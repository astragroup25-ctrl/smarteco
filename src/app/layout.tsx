import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SMART.ECO — Internet WiFi',
  description: 'Internet stable, rapide et performant en Haïti',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        {/* Image de fond globale */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          backgroundImage: 'url(https://i.ibb.co/yGYczkZ/A-Haitian-family-of-four-202606251602.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Overlay sombre */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          background: 'rgba(10, 14, 26, 0.82)',
        }} />
        {/* Contenu */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {children}
        </div>
      </body>
    </html>
  )
}