'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function AttentePage() {
  const router = useRouter()
  const whatsappUrl = `https://wa.me/50941580950?text=${encodeURIComponent(
    "Bonjour, j'ai effectué un paiement SMART.ECO et j'attends ma validation."
  )}`

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ animation: 'pulse 2s ease infinite', marginBottom: '24px' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#00A8FF" strokeWidth="3" />
            <circle cx="40" cy="40" r="3" fill="#00A8FF" />
            <line x1="40" y1="40" x2="40" y2="20" stroke="#00A8FF" strokeWidth="3" strokeLinecap="round" />
            <line x1="40" y1="40" x2="54" y2="48" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="40" y1="6" x2="40" y2="12" stroke="#1E3A5F" strokeWidth="2" />
            <line x1="40" y1="68" x2="40" y2="74" stroke="#1E3A5F" strokeWidth="2" />
            <line x1="6" y1="40" x2="12" y2="40" stroke="#1E3A5F" strokeWidth="2" />
            <line x1="68" y1="40" x2="74" y2="40" stroke="#1E3A5F" strokeWidth="2" />
          </svg>
        </div>

        <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700, marginBottom: '8px', textAlign: 'center', animation: 'fadeUp 0.5s ease 0.1s both' }}>
          Validation manuelle requise
        </h1>
        <p style={{ color: '#CBD5E1', fontSize: '14px', textAlign: 'center', marginBottom: '32px', lineHeight: '1.6', animation: 'fadeUp 0.5s ease 0.2s both' }}>
          Notre équipe vérifie votre paiement.{' '}
          Vous recevrez votre code sous{' '}
          <span style={{ color: '#00A8FF', fontWeight: 600 }}>30 minutes maximum.</span>
        </p>

        <div style={{
          background: '#111827', border: '1px solid #1E3A5F',
          borderRadius: '12px', padding: '20px', width: '100%',
          maxWidth: '320px', marginBottom: '24px',
          animation: 'fadeUp 0.5s ease 0.3s both',
        }}>
          {[
            { label: 'Paiement reçu', done: true },
            { label: 'Vérification en cours', done: false, active: true },
            { label: 'Code envoyé sur WhatsApp', done: false },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 2 ? '16px' : '0' }}>
              <div style={{
                width: '24px', height: '24px', minWidth: '24px', borderRadius: '50%',
                background: item.done ? '#00C853' : item.active ? '#00A8FF' : '#1E3A5F',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: item.active ? 'pulse 2s ease infinite' : 'none',
              }}>
                {item.done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                )}
              </div>
              <p style={{ color: item.done || item.active ? '#FFFFFF' : '#475569', fontSize: '14px', margin: 0, fontWeight: item.active ? 600 : 400 }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', background: '#25D366', color: '#FFFFFF',
          borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '320px',
          fontSize: '15px', fontWeight: 700, textDecoration: 'none',
          marginBottom: '12px', boxSizing: 'border-box',
          animation: 'fadeUp 0.5s ease 0.4s both',
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="white" strokeWidth="1.5" />
            <path d="M7 11.5C7 9 9 7 11.5 7C14 7 16 9 16 11.5C16 14 14 16 11.5 16C10.5 16 9.5 15.7 8.7 15.2L6.5 15.8L7.1 13.7C6.4 12.9 7 12 7 11.5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          Contacter le support
        </a>

        <button onClick={() => router.push('/')} style={{
          background: 'transparent', border: '1.5px solid #FFFFFF', color: '#FFFFFF',
          borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '320px',
          fontSize: '15px', fontWeight: 600, cursor: 'pointer',
          animation: 'fadeUp 0.5s ease 0.5s both',
        }}>
          Retour à l'accueil
        </button>
      </div>
    </main>
  )
}