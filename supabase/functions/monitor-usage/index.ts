// monitor-usage — exécutée toutes les cinq minutes par pg_cron.
// Un pic de plus de 500 Mo sur cinq minutes est un signal de partage possible,
// non une preuve. Au lieu de bloquer le client, sa connexion est limitée à
// 1 Mbps pendant deux heures et une notification lui est envoyée.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const UNIFI_URL = Deno.env.get('UNIFI_CONTROLLER_URL')
const UNIFI_USERNAME = Deno.env.get('UNIFI_USERNAME')
const UNIFI_PASSWORD = Deno.env.get('UNIFI_PASSWORD')
const UNIFI_SITE = Deno.env.get('UNIFI_SITE') || 'default'
const PORTAL_BASE_URL = Deno.env.get('PORTAL_BASE_URL') || 'https://wifi.empirebiblio.com'
const CLIENT_NOTIFICATION_WEBHOOK_SECRET = Deno.env.get('CLIENT_NOTIFICATION_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const THROTTLE_MINUTES = 120
const THROTTLE_KBPS = 1024

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface UnifiStation {
  mac: string
  rx_bytes?: number
  tx_bytes?: number
  uptime?: number
}

function extractCookie(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? []
  return raw.map((cookie) => cookie.split(';')[0]).join('; ')
}

async function unifiLogin(): Promise<{ cookie: string; csrf?: string } | null> {
  if (!UNIFI_URL || !UNIFI_USERNAME || !UNIFI_PASSWORD) return null
  const res = await fetch(`${UNIFI_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: UNIFI_USERNAME, password: UNIFI_PASSWORD }),
  })
  if (!res.ok) return null
  return { cookie: extractCookie(res), csrf: res.headers.get('x-csrf-token') ?? undefined }
}

async function unifiCmd(
  auth: { cookie: string; csrf?: string },
  body: Record<string, unknown>,
): Promise<{ ok: boolean; msg?: string }> {
  const res = await fetch(`${UNIFI_URL}/api/s/${UNIFI_SITE}/cmd/stamgr`, {
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
  return { ok: data.meta?.rc === 'ok', msg: data.meta?.msg }
}

/** `up` et `down` sont des limites en Kbps pour authorize-guest. */
function throttleGuest(auth: { cookie: string; csrf?: string }, mac: string) {
  return unifiCmd(auth, {
    cmd: 'authorize-guest',
    mac,
    minutes: THROTTLE_MINUTES,
    up: THROTTLE_KBPS,
    down: THROTTLE_KBPS,
  })
}

async function notifyClient(numeroClient: string, slowedUntil: string): Promise<void> {
  if (!CLIENT_NOTIFICATION_WEBHOOK_SECRET) {
    console.error('[monitor-usage] CLIENT_NOTIFICATION_WEBHOOK_SECRET manquant')
    return
  }
  try {
    const response = await fetch(`${PORTAL_BASE_URL}/api/push/notify-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-notify-secret': CLIENT_NOTIFICATION_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        numero_client: numeroClient,
        type: 'anti_sharing_throttle',
        title: 'Connexion ralentie temporairement',
        body: 'Votre connexion est limitée à 1 Mbps pendant 2 heures en raison d’un usage pouvant indiquer un partage de connexion.',
        data: { slowed_until: slowedUntil },
      }),
    })
    if (!response.ok) console.error(`[monitor-usage] notification client: http_${response.status}`)
  } catch (error) {
    console.error('[monitor-usage] notification client échouée:', error)
  }
}

Deno.serve(async () => {
  let auth: { cookie: string; csrf?: string } | null = null
  try {
    auth = await unifiLogin()
  } catch (error) {
    console.error('[monitor-usage] connexion UniFi échouée:', error)
  }
  if (!auth) return Response.json({ ok: false, reason: 'unifi_unreachable' })

  let stations: UnifiStation[] = []
  try {
    const res = await fetch(`${UNIFI_URL}/api/s/${UNIFI_SITE}/stat/sta`, { headers: { Cookie: auth.cookie } })
    if (!res.ok) return Response.json({ ok: false, reason: `stat_sta_http_${res.status}` })
    stations = ((await res.json()) as { data?: UnifiStation[] }).data ?? []
  } catch (error) {
    console.error('[monitor-usage] lecture des stations échouée:', error)
    return Response.json({ ok: false, reason: 'stat_sta_failed' })
  }

  const { data: config } = await supabase
    .from('security_config').select('overage_threshold_mb').eq('id', 1).maybeSingle()
  const thresholdMb = config?.overage_threshold_mb ?? 500
  const thresholdBytes = thresholdMb * 1024 * 1024
  let checked = 0
  let throttled = 0

  for (const station of stations) {
    if (!station.mac) continue
    const mac = station.mac.toLowerCase()
    const rxBytes = station.rx_bytes ?? 0
    const txBytes = station.tx_bytes ?? 0
    const totalBytes = rxBytes + txBytes

    // Les appareils sans forfait SMART.ECO ne doivent jamais être traités ici.
    const { data: voucher } = await supabase
      .from('vouchers')
      .select('id, code, numero_client, mb_utilises_jour, mb_utilises_total, mb_utilises_jour_date')
      .eq('mac_address', mac).eq('actif', true).maybeSingle()
    if (!voucher) continue

    const { data: lastCheck } = await supabase
      .from('client_usage').select('rx_bytes, tx_bytes')
      .eq('mac_address', mac).order('checked_at', { ascending: false }).limit(1).maybeSingle()
    const lastTotal = (lastCheck?.rx_bytes ?? 0) + (lastCheck?.tx_bytes ?? 0)
    const deltaBytes = !lastCheck || totalBytes < lastTotal ? totalBytes : totalBytes - lastTotal
    const now = new Date()
    const deltaMb = Math.round(deltaBytes / 1024 / 1024)
    const today = now.toISOString().slice(0, 10)
    const sameDay = voucher.mb_utilises_jour_date === today
    checked++

    await supabase.from('vouchers').update({
      mb_utilises_jour: sameDay ? (voucher.mb_utilises_jour ?? 0) + deltaMb : deltaMb,
      mb_utilises_jour_date: today,
      mb_utilises_total: (voucher.mb_utilises_total ?? 0) + deltaMb,
    }).eq('id', voucher.id)

    // Ne prolonge jamais la sanction : les deux heures partent du premier pic.
    const { data: activeThrottle } = await supabase
      .from('client_throttles').select('slowed_until')
      .eq('mac_address', mac).gt('slowed_until', now.toISOString()).maybeSingle()

    if (deltaBytes > thresholdBytes && !activeThrottle) {
      const reason = `Consommation de ${(deltaBytes / 1024 / 1024).toFixed(0)} Mo en 5 min (seuil: ${thresholdMb} Mo) — partage de connexion possible.`
      const result = await throttleGuest(auth, mac)
      await supabase.from('security_actions').insert({
        mac_address: mac,
        reason,
        action_taken: result.ok ? 'throttled_1mbps_for_2h' : `throttle_failed(${result.msg ?? 'unknown'})`,
      })

      if (result.ok) {
        const slowedUntil = new Date(now.getTime() + THROTTLE_MINUTES * 60_000).toISOString()
        throttled++
        await supabase.from('client_throttles').upsert({
          mac_address: mac,
          voucher_id: voucher.id,
          slowed_at: now.toISOString(),
          slowed_until: slowedUntil,
          reason,
        }, { onConflict: 'mac_address' })
        await supabase.from('client_notifications').insert({
          voucher_id: voucher.id,
          numero_client: voucher.numero_client,
          type: 'anti_sharing_throttle',
          title: 'Connexion ralentie temporairement',
          body: 'Votre connexion est limitée à 1 Mbps pendant 2 heures en raison d’un usage pouvant indiquer un partage de connexion.',
          metadata: { slowed_until: slowedUntil },
        })
        await notifyClient(voucher.numero_client, slowedUntil)
        console.log(`[monitor-usage] ${mac} ralenti à 1 Mbps jusqu’au ${slowedUntil}`)
      }
    }

    await supabase.from('client_usage').insert({
      mac_address: mac,
      voucher_code: voucher.code,
      rx_bytes: rxBytes,
      tx_bytes: txBytes,
      session_start: station.uptime ? new Date(Date.now() - station.uptime * 1000).toISOString() : null,
    })
  }

  return Response.json({ ok: true, checked, throttled })
})
