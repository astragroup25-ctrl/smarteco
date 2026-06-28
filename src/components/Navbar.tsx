'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Navbar() {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const router = useRouter()

  const naviguer = (path: string) => {
    setMenuOuvert(false)
    router.push(path)
  }

  return (
    <>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #1E3A5F',
        background: 'rgba(10, 14, 26, 0.6)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
       <Image
          src="https://i.ibb.co/gL1PFBLd/SMART-ECO.png"
          alt="SMART.ECO"
          width={36}
          height={36}
          style={{ cursor: 'pointer' }}
          onClick={() => naviguer('/')}
        />
        <button
          onClick={() => setMenuOuvert(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <div style={{ width: '24px', height: '2px', background: '#FFFFFF', borderRadius: '2px' }} />
          <div style={{ width: '24px', height: '2px', background: '#FFFFFF', borderRadius: '2px' }} />
          <div style={{ width: '24px', height: '2px', background: '#FFFFFF', borderRadius: '2px' }} />
        </button>
      </nav>

      {/* Overlay menu */}
      {menuOuvert && (
        <div
          onClick={() => setMenuOuvert(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 200,
          }}
        />
      )}

      {/* Menu latéral */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: menuOuvert ? 0 : '-280px',
        width: '260px',
        height: '100%',
        background: '#111827',
        borderLeft: '1px solid #1E3A5F',
        zIndex: 300,
        transition: 'right 0.3s ease',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <span style={{ color: '#CBD5E1', fontSize: '14px', fontWeight: 600 }}>
            Menu
          </span>
          <button
            onClick={() => setMenuOuvert(false)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontSize: '20px',
            }}
          >
            ✕
          </button>
        </div>

        {[
          { label: 'Espace Client', path: '/client', icon: '👤' },
          { label: 'Espace Administration', path: '/admin', icon: '⚙️' },
          { label: 'À propos', path: '/apropos', icon: 'ℹ️' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => naviguer(item.path)}
            style={{
              background: 'transparent',
              border: '1px solid #1E3A5F',
              borderRadius: '10px',
              padding: '14px 16px',
              color: '#FFFFFF',
              fontSize: '15px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'background 0.2s ease',
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}