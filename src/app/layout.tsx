import type { Metadata, Viewport } from 'next'
import './globals.css'

// ── PWA / installation (iOS + Android) ──────────────────────────────────────
// Android/Chrome s'appuient sur `manifest.json` pour l'installation.
// iOS/Safari, lui, N'UTILISE PAS le manifest : il faut les meta spécifiques
// Apple (`apple-mobile-web-app-capable`, `apple-mobile-web-app-title`,
// `apple-mobile-web-app-status-bar-style`) et une `apple-touch-icon`.
// Next.js génère ces meta à partir de `appleWebApp` et `icons.apple` ci-dessous.

export const metadata: Metadata = {
  title: 'SMART.ECO — Internet WiFi',
  description: 'Internet stable, rapide et performant en Haïti',
  applicationName: 'SMART.ECO',
  manifest: '/manifest.json',
  // Meta Apple pour l'installation en plein écran sur iOS.
  appleWebApp: {
    capable: true,
    title: 'SMART.ECO',
    statusBarStyle: 'default', // barre d'état claire, cohérente avec le thème clair
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      // Safari exige une apple-touch-icon : sans elle, l'icône de l'écran
      // d'accueil est une capture d'écran de la page.
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  // Évite que Safari transforme les numéros de téléphone en liens sur le portail.
  formatDetection: {
    telephone: false,
  },
}

// `viewport-fit=cover` est nécessaire pour que le contenu s'étende sous les
// encoches/coins arrondis des iPhone. On laisse volontairement le zoom actif
// (pas de `user-scalable: false`) : le portail doit rester accessible.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
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
        {/* Voile clair : garde la photo lisible en fond tout en laissant le
            contenu (thème clair) bien contrasté. */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          background: 'rgba(255, 255, 255, 0.90)',
        }} />
        {/* Contenu */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
