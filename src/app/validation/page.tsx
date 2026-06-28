'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function ValidationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState('Analyse de votre paiement en cours...')
  const [etape, setEtape] = useState(1)

  useEffect(() => {
    const paiement_id = searchParams.get('paiement_id')
    const screenshot_url = searchParams.get('screenshot_url')
    const forfait_id = searchParams.get('forfait_id')

    if (!paiement_id || !screenshot_url || !forfait_id) {
      router.push('/')
      return
    }

    const messages = [
      'Analyse de votre paiement en cours...',
      'Vérification du montant...',
      'Vérification de la date...',
      'Validation finale...',
    ]

    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % messages.length
      setMessage(messages[index])
      setEtape(prev => Math.min(prev + 1, 4))
    }, 2000)

    const validate = async () => {
      try {
        const res = await fetch('/api/validate-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paiement_id,
            screenshot_url: decodeURIComponent(screenshot_url),
            forfait_id,
          }),
        })
        const data = await res.json()
        clearInterval(interval)
        router.push(data.redirect)
      } catch {
        clearInterval(interval)
        router.push('/echec?raison=Erreur+technique.+Veuillez+réessayer.')
      }
    }

    setTimeout(validate, 4000)
    return () => clearInterval(interval)
  }, [searchParams, router])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div style={{
          width: '72px', height: '72px',
          border: '4px solid #1E3A5F',
          borderTop: '4px solid #00A8FF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '32px',
        }} />

        <h2 style={{
          color: '#FFFFFF', fontSize: '18px',
          fontWeight: 600, textAlign: 'center', marginBottom: '20px',
        }}>
          {message}
        </h2>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: i <= etape ? '#00A8FF' : '#1E3A5F',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{
          background: '#111827', border: '1px solid #1E3A5F',
          borderRadius: '12px', padding: '20px', maxWidth: '320px',
          width: '100%', textAlign: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: '12px' }}>
            <circle cx="16" cy="16" r="15" stroke="#00A8FF" strokeWidth="2" />
            <path d="M16 10v7M16 21v1" stroke="#00A8FF" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <p style={{ color: '#CBD5E1', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            Ne fermez pas cette page.<br />
            L'analyse prend généralement{' '}
            <span style={{ color: '#00A8FF', fontWeight: 600 }}>
              moins de 30 secondes.
            </span>
          </p>
        </div>
      </div>
    </main>
  )
}