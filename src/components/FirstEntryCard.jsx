import React from 'react'
import { Moon } from 'lucide-react'
import { t, useLocale } from '../i18n'
import { ActionTile, getDiaperOptions } from './QuickAddFab'

/**
 * FirstEntryCard — "Co było przed chwilą?" na ekranie Dziś, zanim padnie
 * pierwszy wpis.
 *
 * v2.16.1: Analytics pokazało, że nowi użytkownicy spędzali średnio 39 s
 * w apce i prawie nikt nie wracał następnego dnia. Po onboardingu widzieli
 * "Pusty dzień", a jednoklikowe wpisy były schowane pod przyciskiem "+".
 * Karta wyciąga te same szybkie akcje (QuickAddFab) na wierzch: jedno
 * dotknięcie = wpis z aktualną godziną. Znika po pierwszym wpisie.
 *
 * Props:
 *   onQuickFeed(type, amount), onQuickDiaper(type), onQuickSleepStart()
 *     — te same handlery co FAB (App.jsx)
 *   toiletMode — 'diapers' | 'potty' | 'toilet'
 *   onDismiss  — fn(): "Nie teraz" (parent zapisuje flagę)
 */
export default function FirstEntryCard({
  onQuickFeed, onQuickDiaper, onQuickSleepStart, toiletMode = 'diapers', onDismiss,
}) {
  useLocale()
  const diapers = getDiaperOptions(toiletMode)

  return (
    <div style={{
      margin: '12px 16px',
      padding: '16px 16px 12px',
      background: 'var(--surface)',
      border: '2px solid var(--brand-500)',
      borderRadius: 16,
      boxShadow: '0 4px 14px rgba(15, 110, 86, 0.12)',
    }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
        {t('first_entry.title')}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45, margin: '4px 0 12px' }}>
        {t('first_entry.desc')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {toiletMode === 'diapers' && (
          <>
            <ActionTile
              emoji="🤱" labelKey="feed.quick.left"
              accent="var(--brand-700)" bg="var(--brand-50)"
              onClick={() => onQuickFeed('Pierś lewa', '15')}
            />
            <ActionTile
              emoji="🤱" labelKey="feed.quick.right"
              accent="var(--brand-700)" bg="var(--brand-50)"
              onClick={() => onQuickFeed('Pierś prawa', '15')}
            />
            <ActionTile
              emoji="🍼" labelKey="feed.quick.bottle"
              accent="var(--info-700)" bg="var(--info-50)"
              onClick={() => onQuickFeed('Butelka', '120')}
            />
          </>
        )}
        {diapers.slice(0, toiletMode === 'diapers' ? 2 : diapers.length).map(opt => (
          <ActionTile
            key={opt.key}
            emoji={opt.emoji} labelKey={opt.labelKey}
            accent="var(--info-700)" bg="var(--info-50)"
            onClick={() => onQuickDiaper(opt.key)}
          />
        ))}
        <ActionTile
          Icon={Moon} labelKey="first_entry.sleep"
          accent="var(--accent-500)" bg="var(--accent-50)"
          onClick={onQuickSleepStart}
        />
      </div>

      <button type="button" onClick={onDismiss} style={{
        display: 'block', margin: '10px auto 0', padding: '6px 10px',
        background: 'none', border: 'none', color: 'var(--text-3)',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>
        {t('first_entry.later')}
      </button>
    </div>
  )
}
