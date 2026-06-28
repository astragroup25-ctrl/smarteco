import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { analyzePaymentScreenshot } from '@/lib/groq'
import { generateCode } from '@/lib/generateCode'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { paiement_id, screenshot_url, forfait_id } = await req.json()

    // Récupérer le forfait
    const { data: forfait } = await supabase
      .from('forfaits')
      .select('*')
      .eq('id', forfait_id)
      .single()

    if (!forfait) {
      return NextResponse.json({ valid: false, raison: 'Forfait introuvable.', redirect: '/echec' })
    }

    // Télécharger l'image depuis Supabase Storage
    const imageResponse = await fetch(screenshot_url)
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Vérification hash anti-fraude
    const imageHash = createHash('md5').update(imageBase64).digest('hex')
    const { data: existingHash } = await supabase
      .from('paiements')
      .select('id')
      .eq('image_hash', imageHash)
      .in('statut', ['valide', 'pending_manual'])
      .maybeSingle()

    if (existingHash) {
      await supabase.from('paiements').update({ statut: 'rejete' }).eq('id', paiement_id)
      return NextResponse.json({
        valid: false,
        raison: 'Cette capture a déjà été utilisée.',
        redirect: '/echec'
      })
    }

    // Analyse Groq Vision
    const analyse = await analyzePaymentScreenshot(imageBase64, mimeType)

    // Vérification code transaction unique
    if (analyse.code_transaction) {
      const { data: existingCode } = await supabase
        .from('paiements')
        .select('id')
        .eq('code_transaction', analyse.code_transaction)
        .in('statut', ['valide', 'pending_manual'])
        .maybeSingle()

      if (existingCode) {
        await supabase.from('paiements').update({ statut: 'rejete' }).eq('id', paiement_id)
        return NextResponse.json({
          valid: false,
          raison: 'Ce paiement a déjà été soumis.',
          redirect: '/echec'
        })
      }
    }

    // Vérification doublon expediteur + montant + date
    const { data: existingDouble } = await supabase
      .from('paiements')
      .select('id')
      .eq('expediteur', analyse.expediteur)
      .eq('montant_detecte', analyse.montant)
      .eq('date_transaction', analyse.date)
      .in('statut', ['valide', 'pending_manual'])
      .maybeSingle()

    if (existingDouble) {
      await supabase.from('paiements').update({ statut: 'rejete' }).eq('id', paiement_id)
      return NextResponse.json({
        valid: false,
        raison: 'Un paiement identique existe déjà.',
        redirect: '/echec'
      })
    }

    // Mise à jour paiement avec données Groq
    await supabase.from('paiements').update({
      montant_detecte: analyse.montant,
      date_transaction: analyse.date,
      heure_transaction: analyse.heure,
      expediteur: analyse.expediteur,
      statut_transaction: analyse.statut_transaction,
      code_transaction: analyse.code_transaction,
      image_hash: imageHash,
    }).eq('id', paiement_id)

    // Vérification validité
    const today = new Date().toLocaleDateString('fr-HT', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })

    const montantValide = analyse.montant >= forfait.prix
    const dateValide = analyse.date === today
    const statutValide = analyse.statut_transaction === 'success'
    const destinataireValide =
      analyse.destinataire?.includes('50947971485') ||
      analyse.destinataire?.includes('50941580950')

    if (montantValide && dateValide && statutValide && destinataireValide) {
      // Générer le code voucher
      const code = generateCode(8)
      const debut = new Date()
      const fin = new Date(debut.getTime() + forfait.duree_minutes * 60 * 1000)

      // Récupérer numéro client
      const { data: paiement } = await supabase
        .from('paiements')
        .select('numero_client')
        .eq('id', paiement_id)
        .single()

      // Insérer voucher
      await supabase.from('vouchers').insert({
        code,
        forfait_id,
        numero_client: paiement?.numero_client,
        debut: debut.toISOString(),
        fin: fin.toISOString(),
        mb_utilises_jour: 0,
        mb_utilises_total: 0,
        actif: true,
      })

      // Mettre à jour statut paiement
      await supabase.from('paiements')
        .update({ statut: 'valide' })
        .eq('id', paiement_id)

      return NextResponse.json({
        valid: true,
        code,
        redirect: `/succes?code=${code}`
      })
    } else {
      // Validation manuelle requise
      await supabase.from('paiements')
        .update({ statut: 'pending_manual' })
        .eq('id', paiement_id)

      return NextResponse.json({
        valid: false,
        raison: 'Validation manuelle requise.',
        redirect: '/attente'
      })
    }
  } catch (error) {
    console.error('Erreur validation:', error)
    return NextResponse.json({
      valid: false,
      raison: 'Erreur technique. Veuillez réessayer.',
      redirect: '/echec'
    }, { status: 500 })
  }
}