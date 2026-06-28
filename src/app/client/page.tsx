'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function ClientPage() {
  const router = useRouter()
  const [numero, setNumero] = useState('')
  const [loading, setLoading] = useState(false)
  const [voucher, setVoucher] = useState<any>(null)
  const [forfait, setForfait] = useState<any>(null)
  const [erreur, setErreur] = useState('')
  const [copie, setCopie] = useState(false)

  const chercher = async () => {
    if (!numero.trim()) { setErreur('Veuillez entrer votre numéro WhatsApp.'); return }
    setLoading(true)
    setErreur('')
    setVoucher(null)

    const { data, error } = await supabase
      .from('vouchers')
      .select('*, forfaits(*)')
      .eq('numero_client', numero.trim())
      .eq('actif', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setLoading(false)
    if (error || !data) { setErreur('Aucun plan actif trouvé pour ce numéro.'); return }
    setVoucher(data)
    setForfait(data.forfaits)
  }

  const copierCode = () => {
    navigator.clipboard.writeText(voucher.code)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  const estExpire = voucher ? new Date(voucher.fin) < new Date() : false

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-HT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const supportUrl = `https://wa.me/50941580950?text=${encodeURIComponent(
    "Bonjour, j'ai besoin d'aide avec mon plan SMART.ECO. Mon numéro: " + numero
  )}`

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        <h1 style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, margin: '16px 0 24px 0' }}>
          Espace Client
        </h1>

        <div style={{ background: '#111827', border: '1px solid #1E3A5F', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <label style={{ color: '#CBD5E1', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            Votre numéro WhatsApp
          </label>
          <input
            type="tel" value={numero}
            onChange={e => setNumero(e.target.value)}
            placeholder="ex: 50912345678"
            onKeyDown={e => e.key === 'Enter' && chercher()}
            style={{
              width: '100%', background: '#0A0E1A',
              border: '1px solid #1E3A5F', borderRadius: '8px',
              padding: '12px 16px', color: '#FFFFFF', fontSize: '15px',
              marginBottom: '12px', boxSizing: 'border-box', outline: 'none',
            }}
          />
          <button onClick={chercher} disabled={loading} style={{
            background: '#00A8FF', color: '#0A0E1A', border: 'none',
            borderRadius: '10px', padding: '14px', width: '100%',
            fontSize: '15px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Recherche...' : 'Voir mon plan'}
          </button>
        </div>

        {erreur && (
          <div style={{ background: '#1A0A0A', border: '1px solid #7F1D1D', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ color: '#FCA5A5', fontSize: '14px', margin: 0, textAlign: 'center' }}>{erreur}</p>
          </div>
        )}

        {voucher && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <span style={{
                background: estExpire ? '#7F1D1D' : '#064E3B',
                color: estExpire ? '#FCA5A5' : '#6EE7B7',
                fontSize: '12px', fontWeight: 600, padding: '4px 16px',
                borderRadius: '20px', border: `1px solid ${estExpire ? '#991B1B' : '#065F46'}`,
              }}>
                {estExpire ? 'Expiré' : '● Actif'}
              </span>
            </div>

            <div style={{ background: '#111827', border: '1px solid #1E3A5F', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ borderBottom: '1px solid #1E3A5F', paddingBottom: '16px', marginBottom: '16px' }}>
                <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 4px 0' }}>Plan actif</p>
                <p style={{ color: '#00A8FF', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  {forfait?.nom} — {forfait?.prix} HTG
                </p>
              </div>

              <div onClick={copierCode} style={{
                background: '#0A0E1A', border: `1.5px solid ${copie ? '#00C853' : '#00A8FF'}`,
                borderRadius: '10px', padding: '14px', textAlign: 'center',
                cursor: 'pointer', marginBottom: '16px', transition: 'border-color 0.3s ease',
              }}>
                <p style={{ color: '#475569', fontSize: '11px', margin: '0 0 6px 0' }}>Code d'accès</p>
                <p style={{ color: '#00A8FF', fontSize: '26px', fontWeight: 700, letterSpacing: '5px', fontFamily: 'monospace', margin: '0 0 4px 0' }}>
                  {voucher.code}
                </p>
                <p style={{ color: copie ? '#00C853' : '#475569', fontSize: '11px', margin: 0 }}>
                  {copie ? '✓ Copié !' : 'Appuyez pour copier'}
                </p>
              </div>

              {[
                { label: 'Début', value: formatDate(voucher.debut) },
                { label: 'Fin', value: formatDate(voucher.fin) },
                { label: 'Adresse MAC', value: voucher.mac_address || 'Non enregistrée' },
                { label: "MB utilisés aujourd'hui", value: `${voucher.mb_utilises_jour || 0} MB` },
                { label: 'MB utilisés au total', value: `${voucher.mb_utilises_total || 0} MB` },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: i < 4 ? '1px solid #0F172A' : 'none',
                }}>
                  <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>{item.label}</p>
                  <p style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: 500, margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>

            <a href={supportUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', background: 'transparent', border: '1.5px solid #25D366',
              color: '#25D366', borderRadius: '12px', padding: '14px', width: '100%',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none', boxSizing: 'border-box',
            }}>
              Contacter le support WhatsApp
            </a>
          </div>
        )}
      </div>
    </main>
  )
}