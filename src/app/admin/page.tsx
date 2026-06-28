'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateCode } from '@/lib/generateCode'

export default function AdminPage() {
  const router = useRouter()
  const [authentifie, setAuthentifie] = useState(false)
  const [codeAdmin, setCodeAdmin] = useState('')
  const [erreurAuth, setErreurAuth] = useState('')
  const [onglet, setOnglet] = useState<'attente' | 'creer' | 'clients'>('attente')

  // Demandes en attente
  const [demandes, setDemandes] = useState<any[]>([])
  const [loadingDemandes, setLoadingDemandes] = useState(false)

  // Création manuelle
  const [forfaits, setForfaits] = useState<any[]>([])
  const [nouveauNumero, setNouveauNumero] = useState('')
  const [nouveauForfait, setNouveauForfait] = useState('')
  const [codePerso, setCodePerso] = useState('')
  const [loadingCreation, setLoadingCreation] = useState(false)
  const [codeGenere, setCodeGenere] = useState('')
  const [erreurCreation, setErreurCreation] = useState('')

  // Clients actifs
  const [clients, setClients] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  const seConnecter = () => {
    if (codeAdmin === 'UNISMEC3') {
      sessionStorage.setItem('admin_auth', 'true')
      setAuthentifie(true)
      setErreurAuth('')
    } else {
      setErreurAuth('Code incorrect.')
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setAuthentifie(true)
    }
  }, [])

  useEffect(() => {
    if (!authentifie) return
    chargerDemandes()
    chargerForfaits()
    chargerClients()
    const interval = setInterval(() => {
      chargerDemandes()
      chargerClients()
    }, 30000)
    return () => clearInterval(interval)
  }, [authentifie])

  const chargerDemandes = async () => {
    setLoadingDemandes(true)
    const { data } = await supabase
      .from('paiements')
      .select('*, forfaits(*)')
      .eq('statut', 'pending_manual')
      .order('created_at', { ascending: false })
    setDemandes(data || [])
    setLoadingDemandes(false)
  }

  const chargerForfaits = async () => {
    const { data } = await supabase.from('forfaits').select('*').eq('actif', true)
    setForfaits(data || [])
    if (data && data.length > 0) setNouveauForfait(data[0].id)
  }

  const chargerClients = async () => {
    setLoadingClients(true)
    const { data } = await supabase
      .from('vouchers')
      .select('*, forfaits(*)')
      .eq('actif', true)
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoadingClients(false)
  }

  const valider = async (paiement: any) => {
    const code = generateCode(8)
    const forfait = paiement.forfaits
    const debut = new Date()
    const fin = new Date(debut.getTime() + forfait.duree_minutes * 60 * 1000)

    await supabase.from('vouchers').insert({
      code,
      forfait_id: paiement.forfait_id,
      numero_client: paiement.numero_client,
      debut: debut.toISOString(),
      fin: fin.toISOString(),
      mb_utilises_jour: 0,
      mb_utilises_total: 0,
      actif: true,
    })

    await supabase.from('paiements').update({ statut: 'valide' }).eq('id', paiement.id)

    const msg = encodeURIComponent(
      `✅ Votre paiement SMART.ECO a été validé !\n\nVotre code d'accès : *${code}*\n\nConnectez-vous au WiFi SMART.ECO et entrez ce code. Bonne navigation ! 🌐`
    )
    window.open(`https://wa.me/${paiement.numero_client}?text=${msg}`, '_blank')
    chargerDemandes()
    chargerClients()
  }

  const rejeter = async (paiement: any) => {
    await supabase.from('paiements').update({ statut: 'rejete' }).eq('id', paiement.id)
    const msg = encodeURIComponent(
      "❌ Votre paiement SMART.ECO n'a pas pu être validé. Veuillez nous contacter pour plus d'informations."
    )
    window.open(`https://wa.me/${paiement.numero_client}?text=${msg}`, '_blank')
    chargerDemandes()
  }

  const creerVoucher = async () => {
    if (!nouveauNumero.trim()) { setErreurCreation('Numéro WhatsApp requis.'); return }
    if (!nouveauForfait) { setErreurCreation('Sélectionnez un forfait.'); return }
    setLoadingCreation(true)
    setErreurCreation('')
    setCodeGenere('')

    const res = await fetch('/api/create-voucher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_client: nouveauNumero.trim(),
        forfait_id: nouveauForfait,
        code_custom: codePerso.trim() || undefined,
      }),
    })

    const data = await res.json()
    setLoadingCreation(false)

    if (data.error) { setErreurCreation(data.error); return }
    setCodeGenere(data.code)
    setNouveauNumero('')
    setCodePerso('')
    chargerClients()
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-HT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  // ─── ÉCRAN DE CONNEXION ───────────────────────────────────────
  if (!authentifie) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: '16px' }}>
              <rect x="8" y="20" width="32" height="24" rx="4" stroke="#00A8FF" strokeWidth="2" />
              <path d="M16 20V14a8 8 0 0116 0v6" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="32" r="3" fill="#00A8FF" />
              <line x1="24" y1="35" x2="24" y2="39" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0' }}>
              Espace Administration
            </h1>
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
              SMART.ECO : Accès restreint
            </p>
          </div>

          <div style={{ background: '#111827', border: '1px solid #1E3A5F', borderRadius: '12px', padding: '24px' }}>
            <label style={{ color: '#CBD5E1', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
              Code d'accès administrateur
            </label>
            <input
              type="password"
              value={codeAdmin}
              onChange={e => setCodeAdmin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && seConnecter()}
              placeholder="Entrez le code"
              style={{
                width: '100%', background: '#0A0E1A',
                border: '1px solid #1E3A5F', borderRadius: '8px',
                padding: '12px 16px', color: '#FFFFFF', fontSize: '15px',
                marginBottom: '12px', boxSizing: 'border-box', outline: 'none',
              }}
            />
            {erreurAuth && (
              <p style={{ color: '#FCA5A5', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>
                {erreurAuth}
              </p>
            )}
            <button onClick={seConnecter} style={{
              background: '#00A8FF', color: '#0A0E1A', border: 'none',
              borderRadius: '10px', padding: '14px', width: '100%',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            }}>
              Se connecter
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ─── DASHBOARD ADMIN ─────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

      {/* Header admin */}
      <div style={{
        background: 'rgba(10,14,26,0.9)', borderBottom: '1px solid #1E3A5F',
        padding: '16px 20px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="#00A8FF" strokeWidth="2" />
            <path d="M8 14h12M8 9h12M8 19h8" stroke="#00A8FF" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700 }}>Admin SMART.ECO</span>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthentifie(false) }}
          style={{
            background: 'transparent', border: '1px solid #1E3A5F',
            borderRadius: '8px', padding: '6px 12px',
            color: '#475569', fontSize: '12px', cursor: 'pointer',
          }}
        >
          Déconnexion
        </button>
      </div>

      {/* Onglets */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #1E3A5F',
        background: 'rgba(10,14,26,0.6)', backdropFilter: 'blur(10px)',
      }}>
        {[
          { id: 'attente', label: `En attente ${demandes.length > 0 ? `(${demandes.length})` : ''}` },
          { id: 'creer', label: 'Créer voucher' },
          { id: 'clients', label: `Clients actifs (${clients.length})` },
        ].map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id as any)}
            style={{
              flex: 1, padding: '14px 8px',
              background: 'transparent', border: 'none',
              borderBottom: onglet === o.id ? '2px solid #00A8FF' : '2px solid transparent',
              color: onglet === o.id ? '#00A8FF' : '#475569',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>

        {/* ── SECTION A : Demandes en attente ── */}
        {onglet === 'attente' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              Demandes en attente de validation
            </h2>
            {loadingDemandes ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid #1E3A5F', borderTop: '3px solid #00A8FF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : demandes.length === 0 ? (
              <div style={{ background: '#111827', border: '1px solid #1E3A5F', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ marginBottom: '12px' }}>
                  <circle cx="20" cy="20" r="18" stroke="#1E3A5F" strokeWidth="2" />
                  <path d="M14 20l4 4 8-8" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
                  Aucune demande en attente
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {demandes.map((d) => (
                  <div key={d.id} style={{
                    background: '#111827', border: '1px solid #1E3A5F',
                    borderRadius: '12px', padding: '16px',
                  }}>
                    {/* Infos client */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <p style={{ color: '#475569', fontSize: '11px', margin: '0 0 2px 0' }}>Numéro client</p>
                        <p style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 600, margin: 0 }}>
                          {d.numero_client}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#475569', fontSize: '11px', margin: '0 0 2px 0' }}>Forfait</p>
                        <p style={{ color: '#00A8FF', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                          {d.forfaits?.nom} — {d.forfaits?.prix} HTG
                        </p>
                      </div>
                    </div>

                    {/* Données extraites par Groq */}
                    {d.montant_detecte && (
                      <div style={{
                        background: '#0A0E1A', borderRadius: '8px',
                        padding: '10px 12px', marginBottom: '12px',
                        display: 'flex', gap: '16px', flexWrap: 'wrap',
                      }}>
                        {[
                          { label: 'Montant', value: `${d.montant_detecte} HTG` },
                          { label: 'Date', value: d.date_transaction },
                          { label: 'Heure', value: d.heure_transaction },
                          { label: 'Expéditeur', value: d.expediteur },
                        ].map((item, i) => (
                          <div key={i}>
                            <p style={{ color: '#475569', fontSize: '10px', margin: '0 0 2px 0' }}>{item.label}</p>
                            <p style={{ color: '#CBD5E1', fontSize: '12px', fontWeight: 600, margin: 0 }}>{item.value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Screenshot */}
                    {d.screenshot_url && (
                      <a href={d.screenshot_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={d.screenshot_url}
                          alt="Capture paiement"
                          style={{
                            width: '100%', height: '160px', objectFit: 'cover',
                            borderRadius: '8px', border: '1px solid #1E3A5F',
                            marginBottom: '12px', cursor: 'pointer',
                          }}
                        />
                      </a>
                    )}

                    <p style={{ color: '#475569', fontSize: '11px', margin: '0 0 12px 0' }}>
                      Soumis le {formatDate(d.created_at)}
                    </p>

                    {/* Boutons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => valider(d)} style={{
                        flex: 1, background: '#064E3B', border: '1px solid #065F46',
                        borderRadius: '10px', padding: '12px',
                        color: '#6EE7B7', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                      }}>
                        ✓ Valider
                      </button>
                      <button onClick={() => rejeter(d)} style={{
                        flex: 1, background: '#7F1D1D', border: '1px solid #991B1B',
                        borderRadius: '10px', padding: '12px',
                        color: '#FCA5A5', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                      }}>
                        ✕ Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SECTION B : Création manuelle ── */}
        {onglet === 'creer' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              Créer un voucher manuellement
            </h2>
            <div style={{ background: '#111827', border: '1px solid #1E3A5F', borderRadius: '12px', padding: '20px' }}>

              {[
                {
                  label: 'Numéro WhatsApp client',
                  placeholder: 'ex: 50912345678',
                  value: nouveauNumero,
                  setter: setNouveauNumero,
                  type: 'tel',
                },
                {
                  label: 'Code personnalisé (optionnel)',
                  placeholder: 'Laissez vide pour auto-générer',
                  value: codePerso,
                  setter: setCodePerso,
                  type: 'text',
                },
              ].map((field, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#CBD5E1', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', background: '#0A0E1A',
                      border: '1px solid #1E3A5F', borderRadius: '8px',
                      padding: '12px 16px', color: '#FFFFFF', fontSize: '14px',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#CBD5E1', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Forfait
                </label>
                <select
                  value={nouveauForfait}
                  onChange={e => setNouveauForfait(e.target.value)}
                  style={{
                    width: '100%', background: '#0A0E1A',
                    border: '1px solid #1E3A5F', borderRadius: '8px',
                    padding: '12px 16px', color: '#FFFFFF', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                >
                  {forfaits.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nom} — {f.prix} HTG
                    </option>
                  ))}
                </select>
              </div>

              {erreurCreation && (
                <p style={{ color: '#FCA5A5', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>
                  {erreurCreation}
                </p>
              )}

              {codeGenere && (
                <div style={{
                  background: '#064E3B', border: '1px solid #065F46',
                  borderRadius: '10px', padding: '16px', marginBottom: '16px', textAlign: 'center',
                }}>
                  <p style={{ color: '#6EE7B7', fontSize: '12px', margin: '0 0 6px 0' }}>
                    ✓ Voucher créé avec succès !
                  </p>
                  <p style={{
                    color: '#FFFFFF', fontSize: '28px', fontWeight: 700,
                    letterSpacing: '5px', fontFamily: 'monospace', margin: 0,
                  }}>
                    {codeGenere}
                  </p>
                </div>
              )}

              <button onClick={creerVoucher} disabled={loadingCreation} style={{
                background: '#00A8FF', color: '#0A0E1A', border: 'none',
                borderRadius: '10px', padding: '14px', width: '100%',
                fontSize: '15px', fontWeight: 700,
                cursor: loadingCreation ? 'not-allowed' : 'pointer',
                opacity: loadingCreation ? 0.7 : 1,
              }}>
                {loadingCreation ? 'Création...' : 'Créer le voucher'}
              </button>
            </div>
          </div>
        )}

        {/* ── SECTION C : Clients actifs ── */}
        {onglet === 'clients' && (
          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              Clients actifs
            </h2>
            {loadingClients ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid #1E3A5F', borderTop: '3px solid #00A8FF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : clients.length === 0 ? (
              <div style={{ background: '#111827', border: '1px solid #1E3A5F', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Aucun client actif</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {clients.map((c) => (
                  <div key={c.id} style={{
                    background: '#111827', border: '1px solid #1E3A5F',
                    borderRadius: '12px', padding: '16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>
                        {c.numero_client}
                      </p>
                      <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 2px 0' }}>
                        {c.forfaits?.nom} — Code : <span style={{ color: '#00A8FF', fontFamily: 'monospace' }}>{c.code}</span>
                      </p>
                      <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>
                        Expire : {formatDate(c.fin)}
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/${c.numero_client}?text=${encodeURIComponent("Bonjour, c'est SMART.ECO. Comment puis-je vous aider ?")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#25D366', borderRadius: '10px',
                        padding: '10px 14px', textDecoration: 'none',
                        fontSize: '18px', marginLeft: '12px',
                      }}
                    >
                      💬
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}