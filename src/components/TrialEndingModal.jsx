import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * TrialEndingModal
 *
 * v2.14.0 — Retention booster: przypomina użytkownikowi że trial się kończy,
 * zanim funkcje Premium przestaną działać. Pokazuje się w progu 3 / 1 / 0 dni.
 *
 * Detekcja i throttling — w App.jsx: pokazujemy raz na dzień per uid
 * (localStorage flag `babylog_trial_ending_shown_${uid}_${YYYY-MM-DD}`).
 * Ten komponent jest czysto prezentacyjny — decyzja "czy pokazać" leży wyżej.
 *
 * Props:
 *   open       — czy modal jest widoczny (parent gate'uje)
 *   daysLeft   — 0, 1 lub inny (wybiera właściwy tytuł)
 *   onUpgrade  — fn(): user chce kupić (parent otwiera paywall z trigger='trial_ending')
 *   onLater    — fn(): user zamyka; parent zapisuje shown-flag na dziś
 *   partners   — partnerzy wspólnego konta właściciela (v2.16.0). Ich Premium
 *                pochodzi z trialu właściciela, więc po jego końcu też go tracą.
 */
export default function TrialEndingModal({ open, daysLeft, onUpgrade, onLater, partners = [] }) {
  useLocale()
  if (!open) return null

  const title =
    daysLeft <= 0
      ? t('paywall.trial_ending.title_today')
      : daysLeft === 1
      ? t('paywall.trial_ending.title_tomorrow')
      : t('paywall.trial_ending.title_days', { days: daysLeft })

  const partnerNames = partners.map(p => p.name).filter(Boolean).join(', ')
  const partnerNote = partners.length === 0
    ? null
    : partnerNames
      ? t('paywall.trial_ending.partner', { names: partnerNames })
      : t('paywall.trial_ending.partner_generic')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-ending-title"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onLater() }}
    >
      <div style={{
        background: 'linear-gradient(180deg,#fff 0%,#F7F7F5 100%)',
        borderRadius: 20, padding: 24, maxWidth: 400, width: '100%',
        boxShadow: '0 20px 60px rgba(215, 116, 96, 0.35)',
        border: '2px solid #F5CFC4',
      }}>
        <div style={{ fontSize: 44, textAlign: 'center', marginBottom: 8 }}>⏳</div>

        <h2
          id="trial-ending-title"
          style={{
            fontSize: 20, fontWeight: 800, textAlign: 'center',
            margin: '0 0 10px', color: '#B84E2E', lineHeight: 1.25,
          }}
        >
          {title}
        </h2>

        <p style={{
          fontSize: 13.5, textAlign: 'center', color: '#5a5a56',
          marginBottom: 20, lineHeight: 1.5,
        }}>
          {t('paywall.trial_ending.body')}
        </p>

        {partnerNote && (
          <p style={{
            fontSize: 13, textAlign: 'center', color: '#0F6E56', fontWeight: 600,
            background: '#E1F5EE', borderRadius: 10, padding: '10px 12px',
            margin: '-8px 0 20px', lineHeight: 1.45,
          }}>
            👨‍👩‍👧 {partnerNote}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onUpgrade}
            style={{
              width: '100%', padding: '14px', minHeight: 52,
              background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('paywall.trial_ending.cta_upgrade')}
          </button>
          <button
            onClick={onLater}
            style={{
              width: '100%', padding: '12px', minHeight: 48,
              background: 'transparent', color: '#5a5a56',
              border: 'none', borderRadius: 12,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('paywall.trial_ending.cta_later')}
          </button>
        </div>
      </div>
    </div>
  )
}
