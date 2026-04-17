import React from 'react'
import { useLocale } from '../i18n'

/**
 * LanguageSwitcher
 * Mały toggle PL / EN w topbarze.
 */
export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'rgba(0,0,0,0.05)', borderRadius: 20,
      padding: 2, gap: 2,
    }}>
      {['pl', 'en'].map(l => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          style={{
            padding: '3px 8px',
            border: 'none', borderRadius: 18,
            fontSize: 10, fontWeight: 700,
            cursor: 'pointer',
            background: locale === l ? '#fff' : 'transparent',
            color: locale === l ? '#1a1a18' : '#9a9a94',
            boxShadow: locale === l ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
