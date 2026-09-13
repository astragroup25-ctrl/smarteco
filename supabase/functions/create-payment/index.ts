// create-payment — Edge Function appelée par le portail (Next.js) ou l'app
// (Flutter) pour démarrer un paiement Kobara.
//
// Flux : portail → create-payment → Kobara payments.create → { checkout_url }
//        → le client paie chez Kobara → Kobara appelle kobara-webhook.
//
// Sécurité :
//   - Le montant n'est JAMAIS lu depuis le client : il est re-calculé depuis la
//     table `forfaits` via la clé service_role (qui contourne RLS).
//   - On enregistre d'abord une soumission `paiements` en `pending`, et on passe
//     son UUID en clé d'idempotence + dans la `description` Kobara. Le webhook
//     Kobara relit cet UUID pour retrouver la soumission avec certitude.
//   - Aucune valeur secrète n'est loggée ni stockée ici : on lit les secrets
//     via Deno.env.get(...).

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Kobara } from 'npm:kobara'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')! // injectée par Supabase
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // injectée, contourne RLS
const KOBARA_SECRET_KEY = Deno.env.get('KOBARA_SECRET_KEY')
const PORTAL_BASE_URL = Deno.env.get('PORTAL_BASE_URL') || 'https://wifi.empirebiblio.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

// Normalise un numéro haïtien : garde uniquement les chiffres.
function normalizePhone(raw?: string): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  return digits || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  if (!KOBARA_SECRET_KEY) {
    console.error('[create-payment] KOBARA_SECRET_KEY manquant')
    return json({ error: 'kobara_not_configured' }, 500)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const forfait_id = typeof body.forfait_id === 'string' ? body.forfait_id : ''
  const numero_client = typeof body.numero_client === 'string' ? body.numero_client : ''
  const mac_address = typeof body.mac_address === 'string' ? body.mac_address : null
  const success_url = typeof body.success_url === 'string' ? body.success_url : undefined
  const cancel_url = typeof body.cancel_url === 'string' ? body.cancel_url : undefined

  const phone = normalizePhone(numero_client)
  if (!forfait_id || !phone) {
    return json({ error: 'missing_forfait_or_numero' }, 400)
  }

  // Re-calcule montant et durée depuis la base — jamais confié au client.
  const { data: forfait, error: ferr } = await supabase
    .from('forfaits')
    .select('id, nom, prix, duree_minutes, actif')
    .eq('id', forfait_id)
    .maybeSingle()

  if (ferr) {
    console.error('[create-payment] lecture forfait:', ferr)
    return json({ error: 'db_error' }, 500)
  }
  if (!forfait || forfait.actif === false) {
    return json({ error: 'forfait_invalide' }, 400)
  }

  // Soumission en attente : servira d'ancre au webhook (idempotence + corrélation).
  const { data: paiement, error: perr } = await supabase
    .from('paiements')
    .insert({
      numero_client,
      forfait_id: forfait.id,
      methode: 'kobara',
      montant_attendu: String(forfait.prix),
      mac_address: mac_address ?? null,
      statut: 'pending',
    })
    .select()
    .single()

  if (perr) {
    console.error('[create-payment] insert paiement:', perr)
    return json({ error: 'paiement_insert_failed' }, 500)
  }

  const kobara = new Kobara({ secretKey: KOBARA_SECRET_KEY })
  const description = `SMART.ECO ${forfait.nom} #${phone} [${paiement.id}]`

  const createPayload: Record<string, unknown> = {
    amount: forfait.prix,
    currency: 'HTG',
    provider: 'kobara',
    description,
    customer: { name: `Client ${phone}`, phone },
  }
  // URL de retour : fournies par le portail si possible, sinon fallback sûr.
  if (success_url) createPayload.success_url = success_url
  else createPayload.success_url = `${PORTAL_BASE_URL}/paiement?statut=attente&ref=${paiement.id}`
  if (cancel_url) createPayload.cancel_url = cancel_url
  else createPayload.cancel_url = `${PORTAL_BASE_URL}/forfaits`

  let checkoutUrl: string | undefined
  try {
    const payment = await kobara.payments.create(createPayload as any, {
      idempotencyKey: paiement.id,
    })
    checkoutUrl = payment?.data?.checkout_url
  } catch (err) {
    console.error('[create-payment] échec Kobara:', err)
    return json({ error: 'kobara_create_failed' }, 502)
  }

  if (!checkoutUrl) {
    console.error('[create-payment] checkout_url absent de la réponse Kobara')
    return json({ error: 'kobara_no_checkout_url' }, 502)
  }

  return json({
    ok: true,
    checkout_url: checkoutUrl,
    paiement_id: paiement.id,
    montant: forfait.prix,
    forfait: forfait.nom,
  })
})
