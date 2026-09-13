'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const sections = [
  {
    title: 'Utilisation du réseau',
    text: 'L’accès est destiné à l’appareil autorisé. Le partage de connexion peut entraîner un usage inhabituel. Lorsqu’une consommation dépasse le seuil de surveillance du service, actuellement 500 Mo sur cinq minutes, SMART.ECO peut limiter temporairement la connexion concernée à 1 Mbps en envoi et en réception pendant deux heures. Cette mesure est automatique, proportionnée et ne constitue pas un blocage permanent.',
  },
  {
    title: 'Données collectées',
    text: 'Nous utilisons votre numéro de téléphone, l’adresse MAC de l’appareil, les informations de transaction nécessaires à votre forfait et les volumes de données envoyés et reçus par l’appareil autorisé. Ces données servent à fournir le service, à assurer le support et à prévenir les abus de partage de connexion.',
  },
  {
    title: 'Notifications et vos choix',
    text: 'Si vous avez installé l’application SMART.ECO et autorisé les notifications, nous vous informons d’un ralentissement temporaire. Vos données ne sont ni vendues ni partagées à des fins publicitaires. Vous pouvez demander leur suppression via WhatsApp au +509 4158-0950.',
  },
]

export default function PolitiqueConfidentialitePage() {
  const router = useRouter()

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#334155', fontSize: '14px', padding: 0, marginBottom: '24px' }}>
          ← Retour
        </button>
        <h1 style={{ color: '#0F172A', fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>Politique de confidentialité</h1>
        <p style={{ color: '#64748B', fontSize: '13px', lineHeight: 1.6, margin: '0 0 24px' }}>
          Dernière mise à jour : 12 septembre 2026
        </p>
        {sections.map((section) => (
          <section key={section.title} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h2 style={{ color: '#0284C7', fontSize: '16px', margin: '0 0 8px' }}>{section.title}</h2>
            <p style={{ color: '#334155', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>{section.text}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
