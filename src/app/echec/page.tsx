'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function EchecPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const raison = searchParams.get('raison') || 'Paiement non reconnu.'

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <style>{`@keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ animation: 'scaleIn 0.5s ease', marginBottom: '24px' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#EF4444" strokeWidth="3" />
            <path d="M27 27L53 53M53 27L27 53" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <h1 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
          Paiement non valide
        </h1>

        <div style={{
          background: '#1A0A0A', border: '1px solid #7F1D1D',
          borderRadius: '12px', padding: '16px', maxWidth: '320px',
          width: '100%', marginBottom: '32px', textAlign: 'center',
        }}>
          <p style={{ color: '#FCA5A5', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
            {decodeURIComponent(raison)}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
          <button onClick={() => router.push('/paiement')} style={{
            background: '#00A8FF', color: '#0A0E1A', border: 'none',
            borderRadius: '12px', padding: '16px', fontSize: '15px',
            fontWeight: 700, cursor: 'pointer',
          }}>
            Réessayer
          </button>

          <a href={`https://wa.me/50941580950?text=${encodeURIComponent("Bonjour, j'ai un problème avec mon paiement SMART.ECO.")}`} target="_blank" rel="noopener noreferrer" style={{
            display: 'block', background: 'transparent',
            border: '1.5px solid #25D366', color: '#25D366',
            borderRadius: '12px', padding: '16px', fontSize: '15px',
            fontWeight: 600, textDecoration: 'none', textAlign: 'center',
          }}>
            Contacter le support WhatsApp
          </a>
        </div>
      </div>

      {/* WhatsApp flottant */}
      <a
        href={`https://wa.me/50941580950?text=${encodeURIComponent("Bonjour, puis-je discuter avec le support de SMART.ECO ?")}`}
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

    </main>
  )
}