'use client'

import { useEffect, useRef, useState } from 'react'

const LONGUEUR = 8

// Casiers de saisie du code voucher : 8 cases [A-Z0-9].
// - avance automatiquement, retour arrière intelligent
// - colle un code complet d'un coup (collage sur n'importe quelle case)
// - pré-remplissage possible (code renvoyé par l'app mobile via ?code=)
export default function CodeVoucher({
  valeurInitiale = '',
  onValider,
  chargement = false,
  erreur = '',
}: {
  valeurInitiale?: string
  onValider: (code: string) => void
  chargement?: boolean
  erreur?: string
}) {
  const [cases, setCases] = useState<string[]>(Array(LONGUEUR).fill(''))
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (!valeurInitiale) return
    const lettres = valeurInitiale.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, LONGUEUR).split('')
    const suite = Array(LONGUEUR).fill('')
    lettres.forEach((l, i) => { suite[i] = l })
    setCases(suite)
    refs.current[Math.max(lettres.length - 1, 0)]?.focus()
  }, [valeurInitiale])

  const code = cases.join('')
  const complet = code.length === LONGUEUR

  const ecrire = (index: number, brut: string) => {
    const propre = brut.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!propre) return

    const suite = [...cases]
    let cible = index

    if (propre.length > 1) {
      // Collage d'un code entier : on répartit depuis la case courante.
      propre.slice(0, LONGUEUR - index).split('').forEach((l, k) => { suite[index + k] = l })
      cible = Math.min(index + propre.length, LONGUEUR - 1)
    } else {
      suite[index] = propre
      cible = Math.min(index + 1, LONGUEUR - 1)
    }

    setCases(suite)
    refs.current[cible]?.focus()
  }

  const touche = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const suite = [...cases]
      if (suite[index]) {
        suite[index] = ''
      } else if (index > 0) {
        suite[index - 1] = ''
        refs.current[index - 1]?.focus()
      }
      setCases(suite)
      return
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < LONGUEUR - 1) refs.current[index + 1]?.focus()
    if (e.key === 'Enter' && code.length === LONGUEUR && !chargement) onValider(code)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {cases.map((valeur, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            value={valeur}
            onChange={(e) => ecrire(i, e.target.value)}
            onKeyDown={(e) => touche(i, e)}
            onPaste={(e) => {
              e.preventDefault()
              ecrire(i, e.clipboardData.getData('text'))
            }}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={LONGUEUR}
            aria-label={`Caractère ${i + 1} du code`}
            style={{
              width: '100%',
              maxWidth: '46px',
              height: '58px',
              textAlign: 'center',
              fontSize: '22px',
              fontWeight: 700,
              color: '#0F172A',
              background: '#FFFFFF',
              border: `2px solid ${valeur ? '#00A8FF' : '#E2E8F0'}`,
              borderRadius: '10px',
              outline: 'none',
              padding: 0,
              fontFamily: 'monospace',
              transition: 'border-color 0.15s ease',
            }}
          />
        ))}
      </div>

      {erreur && (
        <p style={{
          color: '#B91C1C',
          fontSize: '13px',
          textAlign: 'center',
          marginTop: '12px',
          marginBottom: 0,
        }}>
          {erreur}
        </p>
      )}

      <button
        onClick={() => onValider(code)}
        disabled={!complet || chargement}
        style={{
          marginTop: '16px',
          width: '100%',
          background: complet ? '#00A8FF' : '#E2E8F0',
          color: complet ? '#0A0E1A' : '#64748B',
          border: 'none',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: complet && !chargement ? 'pointer' : 'not-allowed',
        }}
      >
        {chargement ? 'Vérification…' : 'Valider mon code'}
      </button>
    </div>
  )
}
