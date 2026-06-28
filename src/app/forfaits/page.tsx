'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function ForfaitsPage() {
  const router = useRouter()
  const [forfaits, setForfaits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from('forfaits')
        .select('*')
        .eq('actif', true)
        .order('prix', { ascending: true })
      setForfaits(data || [])
      setLoading(false)
    }
    charger()
  }, [])

  const icones = [
    <svg key="soleil" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="6" stroke="#00A8FF" strokeWidth="2" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="26" x2="16" y2="30" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="16" x2="6" y2="16" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="16" x2="30" y2="16" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      <line x1="5.5" y1="5.5" x2="8.5" y2="8.5" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      <line x1="23.5" y1="23.5" x2="26.5" y2="26.5" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      <line x1="26.5" y1="5.5" x2="23.5" y2="8.5" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      <line x1="8.5" y1="23.5" x2="5.5" y2="26.5" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
    </svg>,
    <svg key="cal" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="3" y="6" width="26" height="23" rx="3" stroke="#00A8FF" strokeWidth="2" />
      <line x1="3" y1="13" x2="29" y2="13" stroke="#00A8FF" strokeWidth="2" />
      <line x1="10" y1="3" x2="10" y2="9" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="3" x2="22" y2="9" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      <rect x="8" y="17" width="4" height="4" rx="1" fill="#00A8FF" />
      <rect x="14" y="17" width="4" height="4" rx="1" fill="#00A8FF" />
      <rect x="20" y="17" width="4" height="4" rx="1" fill="#00A8FF" />
    </svg>,
    <svg key="etoile" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 3L19.5 12H29L21.5 17.5L24.5 27L16 21.5L7.5 27L10.5 17.5L3 12H12.5L16 3Z" stroke="#00A8FF" strokeWidth="2" strokeLinejoin="round" />
    </svg>,
  ]

  const durees = ['24 heures', '7 jours', '30 jours']

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        <button onClick={() => router.push('/')} style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#CBD5E1',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          marginBottom: '24px',
          padding: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </button>

        <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          Nos forfaits
        </h1>
        <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>
          Choisissez le plan qui vous convient
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{
              width: '40px', height: '40px',
              border: '3px solid #1E3A5F',
              borderTop: '3px solid #00A8FF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {forfaits.map((f, i) => (
              <div key={f.id} style={{
                background: '#111827',
                border: i === 1 ? '2px solid #00A8FF' : '1px solid #1E3A5F',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
              }}>
                {i === 1 && (
                  <span style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '16px',
                    background: '#00A8FF',
                    color: '#0A0E1A',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 12px',
                    borderRadius: '20px',
                  }}>
                    POPULAIRE
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  {icones[i]}
                  <div>
                    <p style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                      {f.nom}
                    </p>
                    <p style={{ color: '#475569', fontSize: '13px', margin: '2px 0 0 0' }}>
                      {durees[i]}
                    </p>
                  </div>
                </div>
                <p style={{
                  color: '#00A8FF',
                  fontSize: '34px',
                  fontWeight: 800,
                  marginBottom: '16px',
                }}>
                  {f.prix} <span style={{ fontSize: '16px', fontWeight: 600 }}>HTG</span>
                </p>
                <button
                  onClick={() => router.push(`/paiement?forfait=${f.id}`)}
                  style={{
                    background: i === 1 ? '#00A8FF' : 'transparent',
                    color: i === 1 ? '#0A0E1A' : '#00A8FF',
                    border: '2px solid #00A8FF',
                    borderRadius: '10px',
                    padding: '13px',
                    width: '100%',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Choisir ce forfait
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}