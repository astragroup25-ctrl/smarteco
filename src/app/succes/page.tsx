'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

// Deux arrivées possibles sur cette page :
//  - ?code=XXXXXXXX : le code est déjà connu (saisie dans les casiers du portail).
//  - ?tel=509...     : retour depuis Kobara après paiement. Le voucher est créé
//                      par le webhook (asynchrone), on attend donc son apparition.
function SuccesContenu() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const codeParam = searchParams.get('code') || ''
  const tel = searchParams.get('tel') || ''

  const [code, setCode] = useState(codeParam)
  const [attente, setAttente] = useState(!codeParam && !!tel)
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    if (codeParam || !tel) return

    let arret = false
    let essais = 0

    const chercher = async () => {
      essais++
      const { data } = await supabase
        .from('vouchers')
        .select('code')
        .eq('numero_client', tel)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (arret) return
      if (data?.code) {
        setCode(data.code)
        setAttente(false)
        return
      }
      // ~1 minute d'attente puis on invite à consulter l'espace client.
      if (essais >= 20) {
        setAttente(false)
        return
      }
      setTimeout(chercher, 3000)
    }

    chercher()
    return () => { arret = true }
  }, [codeParam, tel])

  const copierCode = () => {
    navigator.clipboard.writeText(code)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  // Activation en cours
  if (attente) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{
          width: '56px', height: '56px',
          border: '4px solid #E2E8F0', borderTop: '4px solid #00A8FF',
          borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '24px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <h1 style={{ color: '#0F172A', fontSize: '20px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
          Paiement reçu
        </h1>
        <p style={{ color: '#334155', fontSize: '14px', textAlign: 'center', lineHeight: 1.6, maxWidth: '300px' }}>
          Nous activons votre forfait et connectons votre appareil. Cela prend quelques secondes…
        </p>
      </div>
    )
  }

  // Paiement toujours en traitement après le délai d'attente
  if (!code) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <h1 style={{ color: '#0F172A', fontSize: '20px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
          Paiement en cours de traitement
        </h1>
        <p style={{ color: '#334155', fontSize: '14px', textAlign: 'center', lineHeight: 1.6, maxWidth: '320px', marginBottom: '24px' }}>
          Votre code d’accès apparaîtra dans votre espace client dès la confirmation.
          Si rien ne s’affiche d’ici quelques minutes, contactez-nous sur WhatsApp.
        </p>
        <button onClick={() => router.push('/client')} style={{
          background: '#00A8FF', color: '#0A0E1A', border: 'none',
          borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '320px',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer',
        }}>
          Voir mon espace client
        </button>
      </div>
    )
  }

  // Succès
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ animation: 'scaleIn 0.5s ease', marginBottom: '24px' }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="38" stroke="#00C853" strokeWidth="3" />
          <path d="M24 40L35 51L56 30" stroke="#00C853" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 style={{ color: '#0F172A', fontSize: '24px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
        Vous êtes connecté !
      </h1>
      <p style={{ color: '#334155', fontSize: '14px', marginBottom: '32px', textAlign: 'center' }}>
        Voici votre code d’accès WiFi
      </p>

      <div onClick={copierCode} style={{
        background: '#FFFFFF', border: `2px solid ${copie ? '#00C853' : '#00A8FF'}`,
        borderRadius: '12px', padding: '20px 32px', marginBottom: '16px',
        cursor: 'pointer', textAlign: 'center', width: '100%', maxWidth: '320px',
        transition: 'border-color 0.3s ease',
      }}>
        <p style={{ color: '#334155', fontSize: '12px', margin: '0 0 8px 0' }}>Code d’accès</p>
        <p style={{ color: '#00A8FF', fontSize: '32px', fontWeight: 700, letterSpacing: '6px', margin: '0 0 8px 0', fontFamily: 'monospace' }}>
          {code}
        </p>
        <p style={{ color: copie ? '#00C853' : '#64748B', fontSize: '12px', margin: 0 }}>
          {copie ? '✓ Copié !' : 'Appuyez pour copier'}
        </p>
      </div>

      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
        padding: '20px', width: '100%', maxWidth: '320px', marginBottom: '24px',
      }}>
        <p style={{ color: '#0284C7', fontSize: '13px', fontWeight: 600, margin: '0 0 12px 0' }}>
          Bon à savoir
        </p>
        {[
          'Cet appareil est connecté automatiquement.',
          'Gardez ce code : il sert pour vos autres appareils.',
          'Votre forfait se termine automatiquement, sans coupure surprise.',
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: i < 2 ? '10px' : '0' }}>
            <div style={{
              width: '22px', height: '22px', minWidth: '22px', background: '#00A8FF',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#0A0E1A',
            }}>
              {i + 1}
            </div>
            <p style={{ color: '#334155', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{e}</p>
          </div>
        ))}
      </div>

      <button onClick={() => router.push('/client')} style={{
        background: '#00A8FF', color: '#0A0E1A', border: 'none',
        borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '320px',
        fontSize: '15px', fontWeight: 700, cursor: 'pointer',
      }}>
        Voir mon espace client
      </button>
    </div>
  )
}

export default function SuccesPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <style>{`
        @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Suspense fallback={
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTop: '3px solid #00A8FF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }>
        <SuccesContenu />
      </Suspense>
    </main>
  )
}
