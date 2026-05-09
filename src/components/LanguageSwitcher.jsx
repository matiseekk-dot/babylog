import React from 'react'
import { useLocale, SUPPORTED_LOCALES } from '../i18n'

/**
 * LanguageSwitcher — toggle PL / EN / DE w topbarze.
 *
 * v2.11.33: dodano DE. Switcher iteruje po SUPPORTED_LOCALES (single source
 * of truth z i18n.js) — przy dodaniu nowego języka wystarczy edytować jeden
 * config tam.
 *
 * UWAGA na rozmiar topbar: 3 buttony × ~36px = 108px szerokości. Plus pozostałe
 * elementy topbara (premium badge, sleep indicator, settings, baby chip)
 * mogą się rozjechać na małych ekranach. Test na 360px viewport.
 * Jeśli problem → switcher idzie do Settings, w topbarze tylko aktualna flaga.
 */
export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'rgba(0,0,0,0.05)', borderRadius: 20,
      padding: 2, gap: 2,
    }}>
      {SUPPORTED_LOCALES.map(l => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          style={{
            padding: '3px 7px',
            border: 'none', borderRadius: 18,
            fontSize: 10, fontWeight: 700,
            cursor: 'pointer',
            background: locale === l ? '#fff' : 'transparent',
            color: locale === l ? '#1a1a18' : '#9a9a94',
            boxShadow: locale === l ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
            minWidth: 28,
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
