'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { capturerMac, appelerFonction } from '@/lib/portal'

// Plus de capture d'écran ni de numéros à recopier : le paiement est pris en
// charge par Kobara (MonCash / NatCash). Le montant n'est jamais transmis par
// le client — l'Edge Function create-payment le recalcule depuis la base.
export default function PaiementContenu() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const forfaitId = searchParams.get('forfait')

  const [forfait, setForfait] = useState<any>(null)
  const [numero, setNumero] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    capturerMac()
    if (!forfaitId) {
      router.push('/forfaits')
      return
    }
    const charger = async () => {
      const { data } = await supabase.from('forfaits').select('*').eq('id', forfaitId).single()
      setForfait(data)
    }
    charger()
  }, [forfaitId, router])

  const payer = async () => {
    const phone = numero.replace(/\D/g, '')
    if (phone.length < 8) {
      setErreur('Entrez le numéro qui servira au paiement (MonCash ou NatCash).')
      return
    }

    setChargement(true)
    setErreur('')

    try {
      const origine = window.location.origin
      const reponse = await appelerFonction<{
        ok?: boolean
        checkout_url?: string
        error?: string
      }>('create-payment', {
        forfait_id: forfaitId,
        numero_client: phone,
        mac_address: capturerMac(),
        success_url: `${origine}/succes?tel=${phone}`,
        cancel_url: `${origine}/forfaits`,
      })

      if (reponse.checkout_url) {
        // Redirection vers la page de paiement Kobara.
        window.location.href = reponse.checkout_url
        return
      }

      setErreur('Impossible de démarrer le paiement. Réessayez dans un instant.')
    } catch {
      setErreur('Connexion impossible. Vérifiez votre réseau puis réessayez.')
    } finally {
      setChargement(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '440px', margin: '0 auto', width: '100%' }}>

        <button onClick={() => router.back()} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#334155', display: 'flex', alignItems: 'center',
          gap: '8px', fontSize: '14px', marginBottom: '24px', padding: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </button>

        <h1 style={{ color: '#0F172A', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
          Paiement
        </h1>

        {/* Résumé du forfait */}
        {forfait && (
          <div style={{
            background: '#FFFFFF', border: '1px solid #00A8FF',
            borderRadius: '14px', padding: '18px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ color: '#64748B', fontSize: '12px', margin: '0 0 2px 0' }}>Forfait sélectionné</p>
              <p style={{ color: '#0F172A', fontSize: '16px', fontWeight: 700, margin: 0 }}>{forfait.nom}</p>
            </div>
            <p style={{ color: '#00A8FF', fontSize: '24px', fontWeight: 800, margin: 0 }}>
              {forfait.prix} HTG
            </p>
          </div>
        )}

        {/* Numéro de paiement */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0',
          borderRadius: '14px', padding: '18px', marginBottom: '20px',
        }}>
          <label style={{ color: '#334155', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Votre numéro MonCash / NatCash
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={numero}
            onChange={e => setNumero(e.target.value)}
            placeholder="ex : 50912345678"
            style={{
              width: '100%', background: '#F1F5F9',
              border: '1px solid #E2E8F0', borderRadius: '10px',
              padding: '14px 16px', color: '#0F172A', fontSize: '16px',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <p style={{ color: '#64748B', fontSize: '12px', margin: '10px 0 0 0', lineHeight: 1.5 }}>
            Ce numéro identifie votre paiement et votre forfait. Vous recevrez votre code d'accès juste après.
          </p>
        </div>

        {erreur && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: '10px', padding: '12px', marginBottom: '16px',
          }}>
            <p style={{ color: '#B91C1C', fontSize: '13px', margin: 0, textAlign: 'center' }}>
              {erreur}
            </p>
          </div>
        )}

        <button onClick={payer} disabled={chargement} style={{
          background: '#00A8FF', color: '#0A0E1A',
          border: 'none', borderRadius: '14px', padding: '18px',
          width: '100%', fontSize: '16px', fontWeight: 700,
          cursor: chargement ? 'not-allowed' : 'pointer',
          opacity: chargement ? 0.7 : 1,
        }}>
          {chargement ? 'Ouverture du paiement…' : 'Payer maintenant'}
        </button>

        <p style={{
          color: '#64748B', fontSize: '12px', textAlign: 'center',
          marginTop: '16px', lineHeight: 1.6,
        }}>
          Paiement sécurisé par Kobara (MonCash / NatCash).<br />
          Aucune capture d'écran n'est nécessaire : votre appareil est connecté automatiquement.
        </p>

      </div>
    </main>
  )
}
