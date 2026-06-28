import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateCode } from '@/lib/generateCode'

export async function POST(req: NextRequest) {
  try {
    const { numero_client, forfait_id, code_custom } = await req.json()

    // Récupérer le forfait
    const { data: forfait } = await supabase
      .from('forfaits')
      .select('*')
      .eq('id', forfait_id)
      .single()

    if (!forfait) {
      return NextResponse.json(
        { error: 'Forfait introuvable.' },
        { status: 404 }
      )
    }

    // Générer ou utiliser le code personnalisé
    const code = code_custom?.toUpperCase() || generateCode(8)

    // Vérifier si le code existe déjà
    const { data: existingCode } = await supabase
      .from('vouchers')
      .select('id')
      .eq('code', code)
      .maybeSingle()

    if (existingCode) {
      return NextResponse.json(
        { error: 'Ce code existe déjà. Choisissez un autre.' },
        { status: 409 }
      )
    }

    // Calculer début et fin
    const debut = new Date()
    const fin = new Date(
      debut.getTime() + forfait.duree_minutes * 60 * 1000
    )

    // Insérer le voucher
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .insert({
        code,
        forfait_id,
        numero_client,
        debut: debut.toISOString(),
        fin: fin.toISOString(),
        mb_utilises_jour: 0,
        mb_utilises_total: 0,
        actif: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du voucher.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ code: voucher.code, voucher })

  } catch (error) {
    console.error('Erreur create-voucher:', error)
    return NextResponse.json(
      { error: 'Erreur technique. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}