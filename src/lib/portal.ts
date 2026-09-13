// Contexte « portail captif ».
//
// Quand UniFi redirige le client vers notre portail externe, l'URL transporte
// l'adresse MAC de son appareil, par exemple :
//   /guest/s/default/?ap=94:2a:6f:d0:30:57&id=1c:71:25:63:e4:24&t=1742398732&url=...&ssid=...
//   (`ap` = MAC du point d'accès, `id` = MAC du client)
//
// Ce MAC (`id`) est indispensable : c'est lui qu'on autorise sur le réseau après
// paiement (Edge Function kobara-webhook) ou après saisie d'un code voucher.
//
// L'app mobile, de son côté, peut ouvrir le portail avec `?code=XXXXXXXX` pour
// pré-remplir les casiers de saisie du code.

const CLE_MAC = 'smeco_mac'

// Un MAC valide a la forme aa:bb:cc:dd:ee:ff
export function normaliserMac(brut: string | null | undefined): string | null {
  if (!brut) return null
  const mac = brut.trim().toLowerCase()
  return /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(mac) ? mac : null
}

// Lit le MAC dans l'URL, le mémorise pour la session (afin qu'il survive à la
// navigation accueil → forfaits → paiement), et renvoie le MAC courant.
export function capturerMac(): string | null {
  if (typeof window === 'undefined') return null
  const depuisUrl = normaliserMac(new URLSearchParams(window.location.search).get('id'))
  if (depuisUrl) {
    sessionStorage.setItem(CLE_MAC, depuisUrl)
    return depuisUrl
  }
  return sessionStorage.getItem(CLE_MAC)
}

export function getMac(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(CLE_MAC)
}

// Code voucher éventuellement transmis par l'app (?code=XXXXXXXX).
export function getCodeDepuisUrl(): string | null {
  if (typeof window === 'undefined') return null
  const code = new URLSearchParams(window.location.search).get('code')
  if (!code) return null
  const propre = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return propre ? propre.slice(0, 8) : null
}

// Ajoute le MAC courant à une URL interne, pour ne pas le perdre en chemin.
export function avecMac(chemin: string): string {
  const mac = getMac()
  if (!mac) return chemin
  return `${chemin}${chemin.includes('?') ? '&' : '?'}id=${mac}`
}

// Appel d'une Edge Function Supabase (clé anon : RLS s'applique côté base).
export async function appelerFonction<T = Record<string, unknown>>(
  nom: string,
  corps: unknown
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!base || !cle) throw new Error('Configuration Supabase manquante')

  const res = await fetch(`${base}/functions/v1/${nom}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: cle,
      Authorization: `Bearer ${cle}`,
    },
    body: JSON.stringify(corps),
  })

  const donnees = await res.json().catch(() => ({}))
  return donnees as T
}
