'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function AproposPage() {
  const router = useRouter()

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        <button onClick={() => router.push('/')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#CBD5E1', display: 'flex', alignItems: 'center',
          gap: '8px', fontSize: '14px', marginBottom: '32px', padding: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="https://i.ibb.co/gL1PFBLd/SMART-ECO.png" alt="SMART.ECO" style={{ height: '80px', marginBottom: '16px' }} />
          <h1 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>SMART.ECO</h1>
          <p style={{ color: '#00E5FF', fontSize: '14px', fontStyle: 'italic' }}>Connect fastly and easily.</p>
        </div>

        {[
          { titre: 'Notre mission', texte: "Fournir un accès internet stable, rapide et abordable à toutes les communautés d'Haïti. Nous croyons que la connectivité est un droit fondamental, pas un luxe." },
          { titre: 'Notre service', texte: "Grâce à la technologie Starlink et aux équipements Ubiquiti, nous offrons une connexion WiFi haute performance même dans les zones les plus difficiles d'accès." },
          { titre: 'Nos forfaits', texte: "Des plans flexibles adaptés à tous les besoins : 75 HTG pour 24h, 350 HTG pour 7 jours, 1100 HTG pour un mois complet." },
        ].map((section, i) => (
          <div key={i} style={{
            background: '#111827', border: '1px solid #1E3A5F',
            borderRadius: '12px', padding: '20px', marginBottom: '16px',
          }}>
            <h2 style={{ color: '#00A8FF', fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0' }}>
              {section.titre}
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {section.texte}
            </p>
          </div>
        ))}

        <a href="https://wa.me/50941580950" target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', background: '#25D366', color: '#FFFFFF',
          borderRadius: '12px', padding: '16px', width: '100%',
          fontSize: '15px', fontWeight: 700, textDecoration: 'none',
          marginTop: '8px', boxSizing: 'border-box',
        }}>
          Nous contacter sur WhatsApp
        </a>

        <p style={{ color: '#475569', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
          © 2026 SMART.ECO. Connect fastly and easily.
        </p>
      </div>
    </main>
  )
}