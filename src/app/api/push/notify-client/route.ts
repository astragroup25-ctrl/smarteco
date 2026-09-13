import { NextRequest, NextResponse } from 'next/server'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const webhookSecret = process.env.CLIENT_NOTIFICATION_WEBHOOK_SECRET

function firebaseApp() {
  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!rawCredentials) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON manquant')
  if (getApps().length) return getApps()[0]
  return initializeApp({ credential: cert(JSON.parse(rawCredentials)) })
}

/** Envoie un push FCM aux appareils liés au numéro client. */
export async function POST(request: NextRequest) {
  if (!webhookSecret || request.headers.get('x-client-notify-secret') !== webhookSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 })
  }

  const payload = await request.json().catch(() => null) as {
    numero_client?: string; title?: string; body?: string; type?: string; data?: Record<string, unknown>
  } | null
  const normalizedNumber = payload?.numero_client?.replace(/\D/g, '')
  if (!normalizedNumber || !payload?.title || !payload.body) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: users, error: usersError } = await supabase
    .from('app_users')
    .select('auth_uid')
    .in('numero_client', [payload.numero_client, normalizedNumber])
  if (usersError) return NextResponse.json({ error: 'user_lookup_failed' }, { status: 500 })

  const userIds = [...new Set((users ?? []).map((user) => user.auth_uid).filter(Boolean))]
  if (!userIds.length) return NextResponse.json({ ok: true, delivered: 0 })

  const { data: tokens, error: tokensError } = await supabase
    .from('device_tokens')
    .select('fcm_token')
    .in('auth_uid', userIds)
  if (tokensError) return NextResponse.json({ error: 'token_lookup_failed' }, { status: 500 })

  const registrationTokens = [...new Set((tokens ?? []).map((token) => token.fcm_token).filter(Boolean))]
  if (!registrationTokens.length) return NextResponse.json({ ok: true, delivered: 0 })

  try {
    const result = await getMessaging(firebaseApp()).sendEachForMulticast({
      tokens: registrationTokens,
      notification: { title: payload.title, body: payload.body },
      data: {
        type: payload.type ?? 'system',
        ...Object.fromEntries(Object.entries(payload.data ?? {}).map(([key, value]) => [key, String(value)])),
      },
    })
    return NextResponse.json({ ok: true, delivered: result.successCount })
  } catch (error) {
    console.error('[notify-client] FCM error:', error)
    return NextResponse.json({ error: 'notification_send_failed' }, { status: 502 })
  }
}
