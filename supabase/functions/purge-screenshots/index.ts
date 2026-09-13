// purge-screenshots — Edge Function déclenchée par pg_cron une fois par jour.
//
// Rôle : au-delà de 7 jours, supprimer uniquement la CAPTURE D'ÉCRAN (l'image elle-même,
// potentiellement sensible) d'un paiement, tout en conservant la ligne `paiements` et les
// données déjà extraites par l'IA (montant, date, heure, expéditeur, statut, code_transaction,
// image_hash). Ces données restent nécessaires indéfiniment pour la détection de fraude :
// si quelqu'un retente une capture déjà utilisée (même après 7 jours), on la détecte encore
// par comparaison de image_hash / code_transaction / (expéditeur + montant + date), sans avoir
// besoin de conserver l'image source.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async () => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: paiements, error } = await supabase
    .from('paiements')
    .select('id, screenshot_url')
    .not('screenshot_url', 'is', null)
    .lt('created_at', cutoff)

  if (error) {
    console.error('[purge-screenshots] échec de lecture des paiements:', error)
    return new Response(JSON.stringify({ ok: false, reason: 'read_failed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let purged = 0
  for (const p of paiements ?? []) {
    // L'URL publique a la forme .../storage/v1/object/public/screenshots/<nom-fichier>
    const fileName = p.screenshot_url?.split('/screenshots/')[1]
    if (fileName) {
      const { error: removeError } = await supabase.storage.from('screenshots').remove([fileName])
      if (removeError) {
        console.error(`[purge-screenshots] échec suppression fichier ${fileName}:`, removeError)
        continue // on ne vide pas screenshot_url si le fichier n'a pas pu être supprimé
      }
    }

    await supabase.from('paiements').update({ screenshot_url: null }).eq('id', p.id)
    purged++
  }

  return new Response(JSON.stringify({ ok: true, purged }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
