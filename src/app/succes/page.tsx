'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

export default function SuccesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get('code') || ''
  const [copie, setCopie] = useState(false)

  const copierCode = () => {
    navigator.clipboard.writeText(code)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <style>{`
        @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ animation: 'scaleIn 0.5s ease', marginBottom: '24px' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#00C853" strokeWidth="3" />
            <path d="M24 40L35 51L56 30" stroke="#00C853" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 700, marginBottom: '8px', animation: 'fadeUp 0.5s ease 0.2s both' }}>
          Paiement validé !
        </h1>
        <p style={{ color: '#CBD5E1', fontSize: '14px', marginBottom: '32px', animation: 'fadeUp 0.5s ease 0.3s both' }}>
          Voici votre code d'accès WiFi
        </p>

        <div onClick={copierCode} style={{
          background: '#111827',
          border: `2px solid ${copie ? '#00C853' : '#00A8FF'}`,
          borderRadius: '12px', padding: '20px 32px',
          marginBottom: '16px', cursor: 'pointer', textAlign: 'center',
          width: '100%', maxWidth: '320px',
          animation: 'fadeUp 0.5s ease 0.4s both',
          transition: 'border-color 0.3s ease',
        }}>
          <p style={{ color: '#CBD5E1', fontSize: '12px', margin: '0 0 8px 0' }}>Code d'accès</p>
          <p style={{
            color: '#00A8FF', fontSize: '32px', fontWeight: 700,
            letterSpacing: '6px', margin: '0 0 8px 0', fontFamily: 'monospace',
          }}>
            {code}
          </p>
          <p style={{ color: copie ? '#00C853' : '#475569', fontSize: '12px', margin: 0 }}>
            {copie ? '✓ Copié !' : 'Appuyez pour copier'}
          </p>
        </div>

        <div style={{
          background: '#111827', border: '1px solid #1E3A5F',
          borderRadius: '12px', padding: '20px', width: '100%',
          maxWidth: '320px', marginBottom: '24px',
          animation: 'fadeUp 0.5s ease 0.5s both',
        }}>
          <p style={{ color: '#00A8FF', fontSize: '13px', fontWeight: 600, margin: '0 0 12px 0' }}>
            Comment se connecter :
          </p>
          {[
            'Connectez-vous au WiFi SMART.ECO',
            'Ouvrez votre navigateur',
            'Entrez ce code sur la page de connexion',
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: i < 2 ? '10px' : '0' }}>
              <div style={{
                width: '22px', height: '22px', minWidth: '22px',
                background: '#00A8FF', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#0A0E1A',
              }}>
                {i + 1}
              </div>
              <p style={{ color: '#CBD5E1', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{e}</p>
            </div>
          ))}
        </div>

        <button onClick={() => router.push('/client')} style={{
          background: '#00A8FF', color: '#0A0E1A', border: 'none',
          borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '320px',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          animation: 'fadeUp 0.5s ease 0.6s both',
        }}>
          Voir mon espace client
        </button>
      </div>
    </main>
  )
}