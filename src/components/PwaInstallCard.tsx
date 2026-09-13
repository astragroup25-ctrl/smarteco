'use client'

import { useEffect, useState } from 'react'

const CLE_MASQUEE = 'smeco_pwa_masquee'

// Carte horizontale minimaliste proposant d'installer le portail comme
// application (PWA).
//
// Deux plateformes, deux comportements :
//  - Android/Chrome : l'événement `beforeinstallprompt` permet de déclencher
//    l'installation native en un tap.
//  - iOS/Safari : cet événement N'EXISTE PAS. Safari n'utilise pas le manifest
//    pour l'installation ; il faut passer par Partager → « Sur l'écran
//    d'accueil ». On affiche donc l'explication.
export default function PwaInstallCard() {
  const [visible, setVisible] = useState(false)
  const [estIOS, setEstIOS] = useState(false)
  const [invite, setInvite] = useState<any>(null)
  const [aideIOS, setAideIOS] = useState(false)

  useEffect(() => {
    // Déjà installée (mode plein écran) : rien à proposer.
    const pleinEcran =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    if (pleinEcran) return
    if (localStorage.getItem(CLE_MASQUEE) === '1') return

    setEstIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    setVisible(true)

    const surInvite = (e: Event) => {
      e.preventDefault()
      setInvite(e)
    }
    window.addEventListener('beforeinstallprompt', surInvite)
    return () => window.removeEventListener('beforeinstallprompt', surInvite)
  }, [])

  const installer = async () => {
    if (invite) {
      invite.prompt()
      await invite.userChoice
      setInvite(null)
      setVisible(false)
      return
    }
    setAideIOS(true)
  }

  const masquer = () => {
    localStorage.setItem(CLE_MASQUEE, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{ padding: '12px 16px 0 16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '12px 14px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        position: 'relative',
      }}>
        <img
          src="/icons/icon-192.png"
          alt=""
          width={40}
          height={40}
          style={{ borderRadius: '10px', flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#0F172A', fontSize: '14px', fontWeight: 700, margin: 0 }}>
            Installez l’application
          </p>
          <p style={{ color: '#64748B', fontSize: '12px', margin: '2px 0 0 0' }}>
            Accès direct, sans navigateur
          </p>
        </div>

        <button
          onClick={installer}
          style={{
            background: '#00A8FF',
            color: '#0A0E1A',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Installer
        </button>

        <button
          onClick={masquer}
          aria-label="Masquer"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-6px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#E2E8F0',
            border: 'none',
            color: '#334155',
            fontSize: '12px',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Explication iOS */}
      {aideIOS && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '14px',
          marginTop: '10px',
        }}>
          <p style={{ color: '#0F172A', fontSize: '13px', fontWeight: 600, margin: '0 0 8px 0' }}>
            Sur iPhone / iPad :
          </p>
          <p style={{ color: '#334155', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
            1. Ouvrez ce site dans <strong>Safari</strong><br />
            2. Appuyez sur l’icône <strong>Partager</strong> (carré avec une flèche)<br />
            3. Choisissez <strong>« Sur l’écran d’accueil »</strong>
          </p>
          <button
            onClick={() => setAideIOS(false)}
            style={{
              marginTop: '12px',
              background: 'transparent',
              border: 'none',
              color: '#0284C7',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            J’ai compris
          </button>
        </div>
      )}
    </div>
  )
}
