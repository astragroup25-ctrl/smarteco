'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { avecMac } from '@/lib/portal'

// Traduit une durée stockée en minutes en libellé lisible.
function libelleDuree(minutes: number): string {
  if (!minutes) return ''
  if (minutes % 1440 === 0) {
    const jours = minutes / 1440
    if (jours === 1) return '24 heures'
    if (jours === 7) return '7 jours'
    if (jours === 14) return '2 semaines'
    if (jours === 30) return '1 mois'
    return `${jours} jours`
  }
  return `${Math.round(minutes / 60)} heures`
}

// Icône choisie selon la durée (courte / moyenne / longue).
function IconeDuree({ minutes }: { minutes: number }) {
  if (minutes <= 4320) {
    return (
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="6" stroke="#00A8FF" strokeWidth="2" />
        <line x1="16" y1="2" x2="16" y2="6" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="26" x2="16" y2="30" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="2" y1="16" x2="6" y2="16" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="16" x2="30" y2="16" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="5.5" y1="5.5" x2="8.5" y2="8.5" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="23.5" y1="23.5" x2="26.5" y2="26.5" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="26.5" y1="5.5" x2="23.5" y2="8.5" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="8.5" y1="23.5" x2="5.5" y2="26.5" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  if (minutes <= 10080) {
    return (
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="26" height="23" rx="3" stroke="#00A8FF" strokeWidth="2" />
        <line x1="3" y1="13" x2="29" y2="13" stroke="#00A8FF" strokeWidth="2" />
        <line x1="10" y1="3" x2="10" y2="9" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="3" x2="22" y2="9" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
        <rect x="8" y="17" width="4" height="4" rx="1" fill="#00A8FF" />
        <rect x="14" y="17" width="4" height="4" rx="1" fill="#00A8FF" />
        <rect x="20" y="17" width="4" height="4" rx="1" fill="#00A8FF" />
      </svg>
    )
  }
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3L19.5 12H29L21.5 17.5L24.5 27L16 21.5L7.5 27L10.5 17.5L3 12H12.5L16 3Z" stroke="#00A8FF" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

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
        .order('duree_minutes', { ascending: true })
      setForfaits(data || [])
      setLoading(false)
    }
    charger()
  }, [])

  // Le forfait d'une semaine est mis en avant (le plus choisi).
  const idPopulaire = forfaits.find(f => f.duree_minutes === 10080)?.id

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        <button onClick={() => router.push('/')} style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          marginBottom: '24px',
          padding: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </button>

        <h1 style={{ color: '#0F172A', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          Nos forfaits
        </h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
          Choisissez la durée qui vous convient
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{
              width: '40px', height: '40px',
              border: '3px solid #E2E8F0',
              borderTop: '3px solid #00A8FF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {forfaits.map((f) => {
              const populaire = f.id === idPopulaire
              return (
                <div key={f.id} style={{
                  background: '#FFFFFF',
                  border: populaire ? '2px solid #00A8FF' : '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '18px',
                  position: 'relative',
                }}>
                  {populaire && (
                    <span style={{
                      position: 'absolute',
                      top: '-11px',
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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <IconeDuree minutes={f.duree_minutes} />
                      <div>
                        <p style={{ color: '#0F172A', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                          {f.nom}
                        </p>
                        <p style={{ color: '#64748B', fontSize: '13px', margin: '2px 0 0 0' }}>
                          {libelleDuree(f.duree_minutes)}
                          {f.vitesse ? ` · ${f.vitesse}` : ''}
                        </p>
                      </div>
                    </div>

                    <p style={{
                      color: '#00A8FF',
                      fontSize: '26px',
                      fontWeight: 800,
                      margin: 0,
                      whiteSpace: 'nowrap',
                    }}>
                      {f.prix} <span style={{ fontSize: '14px', fontWeight: 600 }}>HTG</span>
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(avecMac(`/paiement?forfait=${f.id}`))}
                    style={{
                      marginTop: '16px',
                      background: populaire ? '#00A8FF' : 'transparent',
                      color: populaire ? '#0A0E1A' : '#0284C7',
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
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
