import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * AutoHideBanner — one-time prompt po przekroczeniu 3 lat.
 *
 * Pokazuje się TYLKO jeśli:
 *   1. Dziecko ma >= 36 miesięcy
 *   2. `autoHideSuggestedAt` jest null (banner nigdy nie pokazany)
 *   3. Przynajmniej jedna z sekcji (feed/diaper) jest jeszcze ON
 *
 * Akcje:
 *   - "Ukryj" → wyłącza feed+diaper, zapisuje autoHideSuggestedAt
 *   - "Zostaw" → nic nie zmienia, zapisuje autoHideSuggestedAt (raz i nigdy więcej)
 *
 * Props:
 *   - profile: aktywny profil dziecka
 *   - onUpdate: (patch) => void — zapis profilu
 */
export default function AutoHideBanner({ profile, onUpdate }) {
  useLocale()

  const years = Math.floor((profile.months || 0) / 12)
  const alreadyHidden =
    profile.visibleTabs?.feed === false &&
    profile.visibleTabs?.diaper === false

  const shouldShow =
    (profile.months || 0) >= 36 &&
    !profile.autoHideSuggestedAt &&
    !alreadyHidden

  if (!shouldShow) return null

  const markSuggested = (hide) => {
    const patch = { autoHideSuggestedAt: new Date().toISOString().slice(0, 10) }
    if (hide) {
      patch.visibleTabs = { feed: false, diaper: false }
    }
    onUpdate(profile.id, patch)
  }

  return (
    <div style={{
      margin: '8px 16px 0',
      padding: '14px 14px',
      background: '#FAEEDA',
      border: '1px solid #E8B96A',
      borderRadius: 12,
    }}>
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        color: '#633806',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span>🎉</span>
        <span>{t('visibility.banner.title', { years })}</span>
      </div>
      <div style={{
        fontSize: 12,
        color: '#8A5A12',
        lineHeight: 1.5,
        marginBottom: 10,
      }}>
        {t('visibility.banner.desc')}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => markSuggested(true)}
          style={{
            flex: 1, padding: '10px',
            background: '#C95A48',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
            minHeight: 40,
          }}
        >
          {t('visibility.banner.hide')}
        </button>
        <button
          onClick={() => markSuggested(false)}
          style={{
            flex: 1, padding: '10px',
            background: 'transparent',
            color: '#633806',
            border: '1px solid #C79A52',
            borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            minHeight: 40,
          }}
        >
          {t('visibility.banner.keep')}
        </button>
      </div>
    </div>
  )
}
