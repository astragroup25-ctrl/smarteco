'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PwaInstallCard from '@/components/PwaInstallCard'
import CodeVoucher from '@/components/CodeVoucher'
import { capturerMac, getCodeDepuisUrl, avecMac, appelerFonction } from '@/lib/portal'

const MESSAGES_ERREUR: Record<string, string> = {
  code_inconnu: 'Ce code n’existe pas. Vérifiez votre saisie.',
  code_expire: 'Ce forfait est expiré. Achetez un nouveau plan.',
  code_inactif: 'Ce code n’est plus actif.',
  code_deja_utilise: 'Ce code est déjà utilisé sur un autre appareil. Contactez-nous sur WhatsApp.',
  mac_manquant: 'Appareil non reconnu. Reconnectez-vous au WiFi DUBOUT puis réessayez.',
  defaut: 'Vérification impossible. Réessayez dans un instant.',
}

export default function HomePage() {
  const router = useRouter()
  const [modalOuvert, setModalOuvert] = useState(false)
  const [codeInitial, setCodeInitial] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreurCode, setErreurCode] = useState('')

  // Récupère le MAC transmis par UniFi (?id=) et l'éventuel code envoyé par
  // l'app mobile (?code=), pour pré-remplir les casiers.
  useEffect(() => {
    capturerMac()
    const code = getCodeDepuisUrl()
    if (code) setCodeInitial(code)
  }, [])

  const etapes = [
    'Choisissez votre forfait (24h, 36h, 72h, 7 jours, 2 semaines ou 1 mois)',
    'Payez en ligne par MonCash ou NatCash — sans quitter la page',
    'Votre appareil est connecté automatiquement dès la validation',
    'Votre code d’accès s’affiche : notez-le pour vos autres appareils',
  ]

  const validerCode = async (code: string) => {
    setChargement(true)
    setErreurCode('')
    try {
      const r = await appelerFonction<{ ok: boolean; reason?: string; autorise?: boolean }>(
        'redeem-voucher',
        { code, mac_address: capturerMac() }
      )
      if (r.ok) {
        router.push(`/succes?code=${encodeURIComponent(code)}${r.autorise ? '' : '&inactif=1'}`)
        return
      }
      setErreurCode(MESSAGES_ERREUR[r.reason ?? 'defaut'] ?? MESSAGES_ERREUR.defaut)
    } catch {
      setErreurCode(MESSAGES_ERREUR.defaut)
    } finally {
      setChargement(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Proposition d'installation de l'application (PWA) */}
      <PwaInstallCard />

      {/* Hero */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 24px 8px 24px',
        textAlign: 'center',
      }}>
        <span style={{
          background: 'transparent',
          border: '1px solid #00A8FF',
          color: '#0284C7',
          fontSize: '12px',
          fontWeight: 600,
          padding: '4px 14px',
          borderRadius: '20px',
          marginBottom: '16px',
          letterSpacing: '1px',
        }}>
          WIFI DUBOUT
        </span>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#0F172A',
          marginBottom: '10px',
          lineHeight: '1.3',
        }}>
          Bienvenue sur<br />SMART.ECO
        </h1>

        <p style={{ color: '#334155', fontSize: '15px', margin: 0 }}>
          Internet stable, rapide et performant
        </p>
      </div>

      <div style={{
        padding: '24px',
        maxWidth: '440px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>

        {/* Vous avez déjà un code */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <p style={{ color: '#0F172A', fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', textAlign: 'center' }}>
            J’ai déjà un code
          </p>
          <p style={{ color: '#64748B', fontSize: '12px', margin: '0 0 16px 0', textAlign: 'center' }}>
            Entrez votre code d’accès pour vous connecter
          </p>
          <CodeVoucher
            valeurInitiale={codeInitial}
            onValider={validerCode}
            chargement={chargement}
            erreur={erreurCode}
          />
        </div>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          <span style={{ color: '#64748B', fontSize: '12px', fontWeight: 600 }}>OU</span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
        </div>

        {/* Acheter un plan */}
        <div>
          <button
            onClick={() => router.push(avecMac('/forfaits'))}
            style={{
              background: '#00A8FF',
              color: '#0A0E1A',
              border: 'none',
              borderRadius: '14px',
              padding: '18px',
              width: '100%',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Acheter un plan
          </button>

          <button
            onClick={() => setModalOuvert(true)}
            style={{
              marginTop: '10px',
              background: 'transparent',
              color: '#334155',
              border: 'none',
              width: '100%',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            Comment ça marche ?
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
          zIndex: 500,
        }}
      >
        <img
          src="/images/whatsapp.png"
          alt="WhatsApp"
          style={{ width: '34px', height: '34px', objectFit: 'contain' }}
        />
      </a>

      {/* Footer */}
      <p style={{
        textAlign: 'center',
        color: '#64748B',
        fontSize: '12px',
        padding: '16px',
        marginTop: 'auto',
      }}>
        © 2026 SMART.ECO. Connect fastly and easily.
      </p>

      {/* Modal « Comment ça marche ? » */}
      {modalOuvert && (
        <div
          onClick={() => setModalOuvert(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)',
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
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
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
              <h2 style={{ color: '#0F172A', fontSize: '18px', fontWeight: 700 }}>
                Comment ça marche ?
              </h2>
              <button
                onClick={() => setModalOuvert(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0F172A',
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
                marginBottom: i < etapes.length - 1 ? '16px' : '0',
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
                  color: '#334155',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  marginTop: '3px',
                }}>
                  {etape}
                </p>
              </div>
            ))}

            <button
              onClick={() => { setModalOuvert(false); router.push(avecMac('/forfaits')) }}
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
              Voir les forfaits
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
