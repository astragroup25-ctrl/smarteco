'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function PaiementPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const forfaitId = searchParams.get('forfait')
  const [forfait, setForfait] = useState<any>(null)
  const [numero, setNumero] = useState('')
  const [fichier, setFichier] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [copie, setCopie] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!forfaitId) { router.push('/forfaits'); return }
    const charger = async () => {
      const { data } = await supabase.from('forfaits').select('*').eq('id', forfaitId).single()
      setForfait(data)
    }
    charger()
  }, [forfaitId, router])

  const copier = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopie(num)
    setTimeout(() => setCopie(null), 2000)
  }

  const gererFichier = (f: File) => {
    if (f.size > 5 * 1024 * 1024) { setErreur('Image trop lourde (max 5MB)'); return }
    setFichier(f)
    setPreview(URL.createObjectURL(f))
    setErreur('')
  }

  const soumettre = async () => {
    if (!fichier) { setErreur('Veuillez uploader votre capture de paiement.'); return }
    if (!numero.trim()) { setErreur('Veuillez entrer votre numéro WhatsApp.'); return }
    setLoading(true)
    setErreur('')

    const ext = fichier.name.split('.').pop()
    const nomFichier = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(nomFichier, fichier, { contentType: fichier.type })

    if (uploadError) {
      setErreur("Erreur lors de l'upload. Réessayez.")
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(nomFichier)
    const screenshotUrl = urlData.publicUrl

    const { data: paiement, error: paiementError } = await supabase
      .from('paiements')
      .insert({
        numero_client: numero.trim(),
        forfait_id: forfaitId,
        screenshot_url: screenshotUrl,
        statut: 'pending',
      })
      .select()
      .single()

    if (paiementError) {
      setErreur("Erreur lors de l'enregistrement. Réessayez.")
      setLoading(false)
      return
    }

    router.push(
      `/validation?paiement_id=${paiement.id}&screenshot_url=${encodeURIComponent(screenshotUrl)}&forfait_id=${forfaitId}`
    )
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        <button onClick={() => router.push('/forfaits')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#CBD5E1', display: 'flex', alignItems: 'center',
          gap: '8px', fontSize: '14px', marginBottom: '24px', padding: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour
        </button>

        <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
          Paiement
        </h1>

        {/* Résumé forfait */}
        {forfait && (
          <div style={{
            background: '#111827', border: '1px solid #00A8FF',
            borderRadius: '12px', padding: '16px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 2px 0' }}>Forfait sélectionné</p>
              <p style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700, margin: 0 }}>{forfait.nom}</p>
            </div>
            <p style={{ color: '#00A8FF', fontSize: '22px', fontWeight: 800, margin: 0 }}>
              {forfait.prix} HTG
            </p>
          </div>
        )}

        {/* Numéros de paiement */}
        <div style={{
          background: '#111827', border: '1px solid #1E3A5F',
          borderRadius: '12px', padding: '16px', marginBottom: '20px',
        }}>
          <p style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            Envoyez votre paiement à :
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { nom: 'MonCash', num: '50947971485' },
              { nom: 'NatCash', num: '50941580950' },
            ].map((item) => (
              <div key={item.nom} style={{
                flex: 1, background: '#0A0E1A',
                border: '1px solid #1E3A5F', borderRadius: '10px', padding: '12px',
              }}>
                <p style={{ color: '#475569', fontSize: '11px', margin: '0 0 4px 0' }}>{item.nom}</p>
                <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0' }}>
                  {item.num}
                </p>
                <button onClick={() => copier(item.num)} style={{
                  background: copie === item.nom ? '#064E3B' : '#1E3A5F',
                  border: 'none', borderRadius: '6px', padding: '6px 10px',
                  color: copie === item.nom ? '#6EE7B7' : '#CBD5E1',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer', width: '100%',
                }}>
                  {copie === item.nom ? '✓ Copié' : 'Copier'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upload capture */}
        <div style={{
          background: '#111827', border: '1px solid #1E3A5F',
          borderRadius: '12px', padding: '16px', marginBottom: '20px',
        }}>
          <p style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            Preuve de paiement
          </p>

          {/* Exemple EN HAUT */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ color: '#475569', fontSize: '11px', textAlign: 'center', marginBottom: '6px' }}>
              Exemple de capture attendue
            </p>
            <img
              src="https://i.ibb.co/Zzyq1rsw/1000382266.png"
              alt="Exemple capture"
              style={{
                width: '100%', height: '200px',
                objectFit: 'cover', borderRadius: '8px',
                border: '1px solid #1E3A5F',
              }}
            />
          </div>

          {/* Zone upload EN BAS */}
          <div>
            <p style={{ color: '#475569', fontSize: '11px', textAlign: 'center', marginBottom: '6px' }}>
              Votre capture de paiement
            </p>
            {preview ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={preview}
                  alt="Votre capture"
                  style={{
                    width: '100%', height: '200px',
                    objectFit: 'cover', borderRadius: '8px',
                    border: '1px solid #00A8FF',
                  }}
                />
                <button
                  onClick={() => { setFichier(null); setPreview(null) }}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(0,0,0,0.7)', border: 'none',
                    borderRadius: '50%', width: '28px', height: '28px',
                    color: '#FFFFFF', cursor: 'pointer', fontSize: '14px',
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragOver(false)
                  const f = e.dataTransfer.files[0]
                  if (f) gererFichier(f)
                }}
                style={{
                  height: '120px',
                  border: `2px dashed ${dragOver ? '#00A8FF' : '#1E3A5F'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: '8px',
                  transition: 'border-color 0.2s ease',
                  background: dragOver ? 'rgba(0,168,255,0.05)' : 'transparent',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="3" width="22" height="22" rx="4" stroke="#1E3A5F" strokeWidth="2" strokeDasharray="4 2" />
                  <path d="M14 18V10M14 10L11 13M14 10L17 13" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ color: '#475569', fontSize: '12px', textAlign: 'center', margin: 0 }}>
                  Glissez votre capture ici<br />
                  <span style={{ color: '#00A8FF' }}>ou appuyez pour sélectionner</span>
                </p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) gererFichier(f)
              }}
            />
          </div>
        </div>

        {/* Numéro WhatsApp */}
        <div style={{
          background: '#111827', border: '1px solid #1E3A5F',
          borderRadius: '12px', padding: '16px', marginBottom: '20px',
        }}>
          <label style={{ color: '#CBD5E1', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            Votre numéro WhatsApp
          </label>
          <input
            type="tel"
            value={numero}
            onChange={e => setNumero(e.target.value)}
            placeholder="ex: 50912345678"
            style={{
              width: '100%', background: '#0A0E1A',
              border: '1px solid #1E3A5F', borderRadius: '8px',
              padding: '12px 16px', color: '#FFFFFF', fontSize: '15px',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {erreur && (
          <div style={{
            background: '#1A0A0A', border: '1px solid #7F1D1D',
            borderRadius: '10px', padding: '12px', marginBottom: '16px',
          }}>
            <p style={{ color: '#FCA5A5', fontSize: '13px', margin: 0, textAlign: 'center' }}>
              {erreur}
            </p>
          </div>
        )}

        <button onClick={soumettre} disabled={loading} style={{
          background: '#00A8FF', color: '#0A0E1A',
          border: 'none', borderRadius: '12px', padding: '16px',
          width: '100%', fontSize: '15px', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          marginBottom: '24px',
        }}>
          {loading ? 'Envoi en cours...' : 'Envoyer ma preuve de paiement'}
        </button>

      </div>
    </main>
  )
}