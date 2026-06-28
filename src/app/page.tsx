'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  const [modalOuvert, setModalOuvert] = useState(false)
  const router = useRouter()

  const etapes = [
    'Choisissez votre forfait (24h, 7 jours ou 1 mois)',
    'Envoyez le paiement par MonCash ou NatCash',
    'Prenez une capture d\'écran de confirmation',
    'Uploadez la capture sur la page suivante',
    'Recevez votre code d\'accès sur WhatsApp',
  ]

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <span style={{
          background: 'transparent',
          border: '1px solid #00A8FF',
          color: '#00A8FF',
          fontSize: '12px',
          fontWeight: 600,
          padding: '4px 14px',
          borderRadius: '20px',
          marginBottom: '20px',
          letterSpacing: '1px',
        }}>
          WIFI DUBOUT
        </span>

        <h1 style={{
          fontSize: '30px',
          fontWeight: 800,
          color: '#FFFFFF',
          marginBottom: '12px',
          lineHeight: '1.3',
        }}>
          Bienvenue sur<br />SMART.ECO
        </h1>

        <p style={{
          color: '#CBD5E1',
          fontSize: '16px',
          marginBottom: '8px',
        }}>
          Internet stable, rapide et performant
        </p>

        <p style={{
          color: '#00E5FF',
          fontSize: '14px',
          fontStyle: 'italic',
          marginBottom: '40px',
        }}>
          Connect fastly and easily.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
        }}>
          <button
            onClick={() => router.push('/forfaits')}
            style={{
              background: '#00A8FF',
              color: '#0A0E1A',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Activer un plan
          </button>

          <button
            onClick={() => setModalOuvert(true)}
            style={{
              background: 'transparent',
              color: '#FFFFFF',
              border: '1.5px solid #FFFFFF',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Comment activer mon plan ?
          </button>
        </div>
      </div>


      {/* WhatsApp flottant */}
      <a
        href={`https://wa.me/50941580950?text=${encodeURIComponent("Bonjour, j'aimerais avoir plus d'informations sur SMART.ECO.")}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: '58px',
          height: '58px',
                    display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          fontSize: '30px',
          zIndex: 500,
          
        }}
      >
        <img
          src="https://i.ibb.co/355ZHd3p/whatsapp.png"
          alt="WhatsApp"
          style={{
            width: '34px',
            height: '34px',
            objectFit: 'contain',
          }}
        />
      </a>

      {/* Footer */}
      <p style={{
        textAlign: 'center',
        color: '#475569',
        fontSize: '12px',
        padding: '16px',
      }}>
        © 2026 SMART.ECO. Connect fastly and easily.
      </p>

      {/* Modal */}
      {modalOuvert && (
        <div
          onClick={() => setModalOuvert(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)',
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111827',
              border: '1px solid #1E3A5F',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 700 }}>
                Comment ça marche ?
              </h2>
              <button
                onClick={() => setModalOuvert(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {etapes.map((etape, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px',
                marginBottom: i < 4 ? '16px' : '0',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  minWidth: '26px',
                  background: '#00A8FF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0A0E1A',
                }}>
                  {i + 1}
                </div>
                <p style={{
                  color: '#CBD5E1',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  marginTop: '3px',
                }}>
                  {etape}
                </p>
              </div>
            ))}

            <button
              onClick={() => { setModalOuvert(false); router.push('/forfaits') }}
              style={{
                background: '#00A8FF',
                color: '#0A0E1A',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                width: '100%',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '20px',
              }}
            >
              Commencer
            </button>
          </div>
        </div>
      )}
    </main>
  )
}