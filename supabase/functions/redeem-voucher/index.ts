// redeem-voucher — valide un code voucher saisi sur le portail captif et
// autorise l'appareil (MAC) sur le réseau invité UniFi.
//
// Appelée par le portail (navigateur) : elle reçoit { code, mac_address }.
// Le MAC provient de l'URL de redirection UniFi (?id=...), capturé par le portail.
//
// Authentification UniFi : identique à monitor-usage et kobara-webhook
// (login + cookie de session + X-CSRF-Token + cmd/stamgr), car le Network
// Application auto-hébergé ne supporte pas les clés API.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const UNIFI_URL = Deno.env.get('UNIFI_CONTROLLER_URL')
const UNIFI_USERNAME = Deno.env.get('UNIFI_USERNAME')
const UNIFI_PASSWORD = Deno.env.get('UNIFI_PASSWORD')
const UNIFI_SITE = Deno.env.get('UNIFI_SITE') || 'default'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

function normaliserMac(brut?: string | null): string | null {
  if (!brut) return null
  const mac = brut.trim().toLowerCase()
  return /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(mac) ? mac : null
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
): Promise<{ ok: boolean; msg?: string }> {
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
  return { ok: data?.meta?.rc === 'ok', msg: data?.meta?.msg }
}

const UNIFI_MAX_ATTEMPTS = 3

async function authorizeGuest(mac: string, minutes: number): Promise<{ ok: boolean; detail?: string }> {
  if (!UNIFI_URL || !UNIFI_USERNAME || !UNIFI_PASSWORD) return { ok: false, detail: 'unifi_not_configured' }

  let dernierDetail = 'unknown'
  for (let tentative = 1; tentative <= UNIFI_MAX_ATTEMPTS; tentative++) {
    const auth = await unifiLogin()
    if (auth) {
      const res = await unifiCmd(auth, `/api/s/${UNIFI_SITE}/cmd/stamgr`, {
        cmd: 'authorize-guest',
        mac,
        minutes,
      })
      if (res.ok) return { ok: true }
      dernierDetail = res.msg ?? 'authorize_failed'
    } else {
      dernierDetail = 'unifi_login_failed'
    }
    if (tentative < UNIFI_MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 500 * tentative))
    }
  }
  return { ok: false, detail: dernierDetail }
}

// ────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405)

  let corps: { code?: string; mac_address?: string }
  try {
    corps = await req.json()
  } catch {
    return json({ ok: false, reason: 'invalid_json' }, 400)
  }

  const code = (corps.code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (code.length !== 8) return json({ ok: false, reason: 'code_inconnu' })

  const mac = normaliserMac(corps.mac_address)
  if (!mac) return json({ ok: false, reason: 'mac_manquant' })

  const { data: voucher, error } = await supabase
    .from('vouchers')
    .select('id, code, numero_client, forfait_id, mac_address, debut, fin, statut, actif')
    .eq('code', code)
    .maybeSingle()

  if (error) {
    console.error('[redeem-voucher] lecture voucher:', error)
    return json({ ok: false, reason: 'defaut' }, 500)
  }
  if (!voucher) return json({ ok: false, reason: 'code_inconnu' })
  if (voucher.actif === false || voucher.statut === 'rejete') {
    return json({ ok: false, reason: 'code_inactif' })
  }

  const maintenant = Date.now()
  const fin = voucher.fin ? new Date(voucher.fin).getTime() : null
  if (fin && fin <= maintenant) return json({ ok: false, reason: 'code_expire' })

  // Un voucher est lié à un seul appareil : si un autre MAC l'utilise déjà,
  // on refuse (c'est la règle anti-partage appliquée par monitor-usage).
  const macExistant = normaliserMac(voucher.mac_address)
  if (macExistant && macExistant !== mac) {
    return json({ ok: false, reason: 'code_deja_utilise' })
  }

  // Lie l'appareil au voucher s'il ne l'était pas encore.
  if (!macExistant) {
    await supabase.from('vouchers').update({ mac_address: mac }).eq('id', voucher.id)
  }

  // Autorise l'appareil pour le temps restant du forfait.
  const minutesRestantes = fin ? Math.max(1, Math.round((fin - maintenant) / 60000)) : 60
  const unifi = await authorizeGuest(mac, minutesRestantes)
  if (!unifi.ok) {
    console.error(`[redeem-voucher] authorize-guest échoué pour ${code} (${mac}) : ${unifi.detail}`)
  }

  // Récupère le nom du forfait pour l'affichage côté portail.
  let nomForfait: string | null = null
  if (voucher.forfait_id) {
    const { data: forfait } = await supabase
      .from('forfaits')
      .select('nom')
      .eq('id', voucher.forfait_id)
      .maybeSingle()
    nomForfait = forfait?.nom ?? null
  }

  return json({
    ok: true,
    autorise: unifi.ok,
    forfait: nomForfait,
    fin: voucher.fin,
    minutes_restantes: minutesRestantes,
  })
})
