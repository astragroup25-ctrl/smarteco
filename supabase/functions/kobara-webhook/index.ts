// kobara-webhook — point de réception des événements de paiement Kobara.
//
// Étapes, strictement dans cet ordre :
//   1) Lire le corps HTTP BRUT (rawBody) via `req.text()` AVANT tout JSON.parse
//      — un parse préalable casserait le calcul HMAC.
//   2) Vérifier la signature (constructEvent) avec le secret webhook. On ne
//      désactive JAMAIS cette vérification, même pour déboguer.
//   3) Sur payment.succeeded : corréler à la soumission `paiements` en attente,
//      créer le voucher actif, puis autoriser l'appareil sur UniFi.
//   4) Répondre vite, de façon IDEMPOTENTE (un événement déjà traité => ack).
//
// Authentification UniFi : identique à monitor-usage (login + cookie de session
// + X-CSRF-Token + cmd/stamgr), car le Network Application auto-hébergé (Windows)
// ne supporte PAS les clés API, quelle que soit sa version — c'est réservé aux
// consoles UniFi OS.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Kobara } from 'npm:kobara'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')! // injectée par Supabase
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // contourne RLS
const KOBARA_SECRET_KEY = Deno.env.get('KOBARA_SECRET_KEY') // requis par le constructeur SDK
const KOBARA_WEBHOOK_SECRET = Deno.env.get('KOBARA_WEBHOOK_SECRET') // secret de l'endpoint webhook

const UNIFI_URL = Deno.env.get('UNIFI_CONTROLLER_URL')
const UNIFI_USERNAME = Deno.env.get('UNIFI_USERNAME')
const UNIFI_PASSWORD = Deno.env.get('UNIFI_PASSWORD')
const UNIFI_SITE = Deno.env.get('UNIFI_SITE') || 'default'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  return digits || null
}

// Génère un code voucher unique (8 caractères [A-Z0-9]), sans collision apparente
// avec les vouchers existants (ex. "OFXWCORF").
async function generateVoucherCode(): Promise<string | null> {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = ''
    for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
    const { data: existing } = await supabase.from('vouchers').select('id').eq('code', code).maybeSingle()
    if (!existing) return code
  }
  return null
}

// ── UniFi (Network Application classique) ───────────────────────────────────

function extractCookie(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? []
  return raw.map((c) => c.split(';')[0]).join('; ')
}

async function unifiLogin(): Promise<{ cookie: string; csrf?: string } | null> {
  if (!UNIFI_URL || !UNIFI_USERNAME || !UNIFI_PASSWORD) return null
  try {
    const res = await fetch(`${UNIFI_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: UNIFI_USERNAME, password: UNIFI_PASSWORD }),
    })
    if (!res.ok) return null
    return { cookie: extractCookie(res), csrf: res.headers.get('x-csrf-token') ?? undefined }
  } catch {
    return null
  }
}

async function unifiCmd(
  auth: { cookie: string; csrf?: string },
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; rc?: string; msg?: string }> {
  const res = await fetch(`${UNIFI_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: auth.cookie,
      ...(auth.csrf ? { 'X-CSRF-Token': auth.csrf } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) return { ok: false, msg: `http_${res.status}` }
  const data = (await res.json()) as { meta?: { rc?: string; msg?: string } }
  return { ok: data?.meta?.rc === 'ok', rc: data?.meta?.rc, msg: data?.meta?.msg }
}

// Autorise un appareil sur le réseau invité pour la durée du forfait.
//
// On retente quelques fois : le contrôleur auto-hébergé (derrière un tunnel
// Cloudflare) peut être momentanément injoignable, et une session peut expirer
// entre deux appels. On refait donc un login à chaque tentative, en espaçant
// les essais (backoff linéaire). L'opération est idempotente côté UniFi :
// la retenter ne crée pas de doublon d'autorisation.
const UNIFI_MAX_ATTEMPTS = 3

async function authorizeGuest(
  mac: string,
  minutes: number
): Promise<{ ok: boolean; detail?: string; attempts: number }> {
  if (!UNIFI_URL || !UNIFI_USERNAME || !UNIFI_PASSWORD) {
    return { ok: false, detail: 'unifi_not_configured', attempts: 0 }
  }

  let lastDetail = 'unknown'
  for (let attempt = 1; attempt <= UNIFI_MAX_ATTEMPTS; attempt++) {
    try {
      const auth = await unifiLogin()
      if (!auth) {
        lastDetail = 'unifi_login_failed'
      } else {
        const res = await unifiCmd(auth, `/api/s/${UNIFI_SITE}/cmd/stamgr`, {
          cmd: 'authorize-guest',
          mac,
          minutes,
        })
        if (res.ok) return { ok: true, attempts: attempt }
        lastDetail = res.msg ?? 'authorize_failed'
      }
    } catch (err) {
      lastDetail = 'unifi_exception'
      console.error(`[kobara-webhook] authorize-guest : tentative ${attempt} échouée:`, err)
    }
    if (attempt < UNIFI_MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }

  return { ok: false, detail: lastDetail, attempts: UNIFI_MAX_ATTEMPTS }
}

// ── Corrélation soumission ⇄ événement Kobara ────────────────────────────────
//
// Le SDK versé avec cette fonction se replie sur la présence de l'UUID de la
// soumission `paiements` dans l'événement (injecté dans la `description` de
// create-payment). En complément, un fallback montant + numéro est conservé.
// TODO(confirmé en sandbox) : ajuster le mapping exact des champs du payload
// Kobara (event.type, data.*, reference, etc.) une fois un événement réel observé.

async function getForfait(forfait_id?: string | null) {
  if (!forfait_id) return null
  const { data } = await supabase
    .from('forfaits')
    .select('id, nom, prix, duree_minutes, actif')
    .eq('id', forfait_id)
    .maybeSingle()
  return data ?? null
}

async function findPaiement(event: any): Promise<{ paiement: any; forfait: any } | null> {
  // 1) Recherche de l'UUID de la soumission présente dans l'événement.
  const serialized = JSON.stringify(event ?? {})
  const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
  for (const id of serialized.match(uuidRe) ?? []) {
    const { data: paiement } = await supabase.from('paiements').select('*').eq('id', id).maybeSingle()
    if (paiement) {
      const forfait = await getForfait(paiement.forfait_id)
      if (forfait) return { paiement, forfait }
    }
  }

  // 2) Fallback : numéro client + montant attendu sur une soumission en attente.
  const amount = event?.data?.amount ?? event?.amount ?? event?.data?.amount_total
  const phone = normalizePhone(
    event?.data?.customer?.phone ??
    event?.customer?.phone ??
    event?.data?.phone
  )
  if (amount != null && phone) {
    const expected = String(amount)
    const { data: paiement } = await supabase
      .from('paiements')
      .select('*')
      .eq('numero_client', phone)
      .eq('statut', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (paiement && paiement.montant_attendu === expected) {
      const forfait = await getForfait(paiement.forfait_id)
      if (forfait) return { paiement, forfait }
    }
  }

  return null
}

Deno.serve(async (req) => {
  // Aucun secret => refus explicite. Ne jamais contourner la vérification.
  if (!KOBARA_WEBHOOK_SECRET || !KOBARA_SECRET_KEY) {
    console.error('[kobara-webhook] secrets manquants')
    return json({ ok: false, reason: 'webhook_not_configured' }, 500)
  }

  const rawBody = await req.text() // BRUT — ne pas parser avant la vérif.
  const signature = req.headers.get('kobara-signature')
  if (!signature) return json({ ok: false, reason: 'no_signature' }, 400)

  let event: any
  try {
    const kobara = new Kobara({ secretKey: KOBARA_SECRET_KEY })
    event = kobara.webhooks.constructEvent(rawBody, signature, KOBARA_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[kobara-webhook] signature invalide:', err)
    return json({ ok: false, reason: 'invalid_signature' }, 401)
  }

  // Seuls les paiements réussis déclenchent une autorisation.
  const type = String(event?.type ?? event?.event ?? '')
  if (type !== 'payment.succeeded') {
    // Tout autre événement (échec, retry, etc.) : on ack sans agir.
    return json({ ok: true, reason: 'ignored_event', type })
  }

  const match = await findPaiement(event)
  if (!match) {
    console.warn('[kobara-webhook] aucun paiement en attente correspondant')
    return json({ ok: true, reason: 'no_matching_paiement' })
  }
  const { paiement, forfait } = match

  // Idempotence : déjà validé, ou un voucher est déjà rattaché => ack sans refaire.
  if (paiement.statut === 'valide') return json({ ok: true, reason: 'already_processed' })
  const { data: existingVoucher } = await supabase
    .from('vouchers')
    .select('id')
    .eq('paiement_id', paiement.id)
    .maybeSingle()
  if (existingVoucher) return json({ ok: true, reason: 'already_processed' })

  const code = await generateVoucherCode()
  if (!code) return json({ ok: false, reason: 'voucher_code_failed' }, 500)

  const now = new Date()
  const debut = now.toISOString()
  const fin = new Date(now.getTime() + (forfait.duree_minutes ?? 60) * 60_000).toISOString()
  const today = now.toISOString().slice(0, 10)

  const { data: voucher, error: verr } = await supabase
    .from('vouchers')
    .insert({
      code,
      numero_client: paiement.numero_client,
      forfait_id: paiement.forfait_id,
      paiement_id: paiement.id,
      mac_address: paiement.mac_address ?? null,
      debut,
      fin,
      statut: 'actif',
      actif: true,
      mb_utilises_jour: 0,
      mb_utilises_total: 0,
      mb_utilises_jour_date: today,
    })
    .select()
    .single()

  if (verr) {
    console.error('[kobara-webhook] insert voucher:', verr)
    return json({ ok: false, reason: 'voucher_insert_failed' }, 500)
  }

  // Le paiement est confirmé : on le marque validé (le montant est déjà
  // re-calculé côté serveur dans create-payment, jamais issu du client).
  await supabase
    .from('paiements')
    .update({
      statut: 'valide',
      statut_transaction: 'success',
      montant_detecte: String(forfait.prix),
    })
    .eq('id', paiement.id)

  // Autorisation WiFi (non bloquante si la MAC est absente ou UniFi injoignable :
  // le voucher reste valide et utilisable, et l'admin peut ré-autoriser).
  let unifi: { ok: boolean; detail?: string; attempts: number } = { ok: true, attempts: 0 }
  if (paiement.mac_address) {
    try {
      unifi = await authorizeGuest(paiement.mac_address, forfait.duree_minutes ?? 60)
    } catch (err) {
      console.error('[kobara-webhook] échec authorize-guest:', err)
      unifi = { ok: false, detail: 'unifi_exception', attempts: 0 }
    }
  } else {
    // Paiement depuis l'app (aucun client WiFi identifié) : le voucher est émis
    // et l'autorisation se fera lors de la connexion ultérieure.
    unifi = { ok: true, detail: 'no_mac', attempts: 0 }
  }

  if (!unifi.ok) {
    // Le paiement est encaissé et le voucher existe déjà : on ne fait PAS échouer
    // le webhook (un statut d'erreur ferait rejouer Kobara, au risque d'un double
    // traitement). On loggue fort pour que l'admin puisse ré-autoriser la MAC.
    console.error(
      `[kobara-webhook] AUTHORIZE-GUEST ÉCHOUÉ — client=${paiement.numero_client} mac=${paiement.mac_address} detail=${unifi.detail}`
    )
  }

  console.log(
    `[kobara-webhook] voucher ${code} créé pour ${paiement.numero_client} (${forfait.nom}); unifi_ok=${unifi.ok} (tentatives=${unifi.attempts})`
  )

  return json({ ok: true, voucher_code: voucher.code, unifi })
})
