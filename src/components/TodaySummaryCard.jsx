import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * TodaySummaryCard — zastępuje ChildStatusCard (v2.10.5 MDR EXIT).
 *
 * GŁÓWNA RÓŻNICA vs ChildStatusCard:
 *   - NIE pokazuje severity ("twoje dziecko ma critical/alert/OK")
 *   - Pokazuje neutralne statystyki dnia (4 karmienia, 8h snu, ostatnia temp 37.2°C)
 *   - Bez kolorów alarmowych — neutralny kafelek
 *
 * To jest information surface (jak smartwatch pokazujący "8500 kroków dziś"),
 * NIE clinical assessment.
 *
 * Props:
 *   summary       — { feeds, sleeps, sleepHours, sleepRemainder, lastTemp,
 *                    lastTempTime, medsToday, diapersToday }
 *   onNavigate    — fn(tabId) — kliknięcie statystyki przenosi do taba
 *   isPremium     — boolean — czy user ma Premium (do CTA upgrade)
 *   onUpgrade     — fn() — otwiera paywall (Premium upsell)
 */
export default function TodaySummaryCard({ summary, onNavigate, isPremium, onUpgrade }) {
  useLocale()

  const {
    feeds = 0,
    sleeps = 0,
    sleepHours = 0,
    sleepRemainder = 0,
    lastTemp = null,
    lastTempTime = null,
    medsToday = 0,
    diapersToday = 0,
  } = summary || {}

  const hasAny = feeds > 0 || sleeps > 0 || lastTemp !== null || medsToday > 0 || diapersToday > 0

  if (!hasAny) {
    return (
      <div style={{
        margin: 'var(--space-snug) var(--space)',
        padding: 'var(--space-comfortable) var(--space)',
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-comfortable)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-snug)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {t('summary.today_label')}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
          {t('summary.empty_msg')}
        </div>
      </div>
    )
  }

  const stats = []
  if (feeds > 0) {
    stats.push({
      label: t('summary.feeds'),
      value: feeds,
      tab: 'feed',
    })
  }
  if (sleeps > 0 || sleepHours > 0) {
    const display = sleepHours > 0
      ? (sleepRemainder > 0 ? `${sleepHours}h ${sleepRemainder}m` : `${sleepHours}h`)
      : `${sleepRemainder}m`
    stats.push({
      label: t('summary.sleep'),
      value: display,
      tab: 'sleep',
    })
  }
  if (diapersToday > 0) {
    stats.push({
      label: t('summary.diapers'),
      value: diapersToday,
      tab: 'feed',
    })
  }
  if (lastTemp !== null) {
    stats.push({
      label: t('summary.last_temp'),
      value: `${lastTemp.toFixed(1)}°`,
      sub: lastTempTime || null,
      tab: 'temp',
    })
  }
  if (medsToday > 0) {
    stats.push({
      label: t('summary.meds'),
      value: medsToday,
      tab: 'meds',
    })
  }

  return (
    <div style={{
      margin: 'var(--space-snug) var(--space)',
      padding: 'var(--space) var(--space)',
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-comfortable)',
    }}>
      {/* Label "Dziś" */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 'var(--space-snug)',
      }}>
        {t('summary.today_label')}
      </div>

      {/* Stat tiles — neutral grid, BEZ kolorów alarmowych */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: stats.length <= 2 ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: 'var(--space-snug)',
      }}>
        {stats.map((stat, i) => (
          <button
            key={i}
            onClick={() => onNavigate?.(stat.tab)}
            style={{
              padding: 'var(--space-snug) var(--space-snug)',
              background: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius-tight)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-tight)',
              minHeight: 56,
            }}
          >
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: -0.3,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 11,
              color: 'var(--text-3)',
              fontWeight: 500,
            }}>
              {stat.label}
              {stat.sub && (
                <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>
                  · {stat.sub}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Subtle link do referencji PTP/AAP — neutralny, bez alarmu */}
      {lastTemp !== null && (
        <button
          onClick={() => onNavigate?.('reference')}
          style={{
            marginTop: 'var(--space-snug)',
            padding: 'var(--space-snug) 0',
            background: 'none',
            border: 'none',
            fontSize: 12,
            color: 'var(--text-2)',
            cursor: 'pointer',
            textAlign: 'left',
            textDecoration: 'underline',
            textDecorationColor: 'var(--text-3)',
            textUnderlineOffset: 3,
          }}
        >
          {t('summary.see_reference')}
        </button>
      )}

      {/* Premium upsell — tylko jeśli free user, neutralnie */}
      {!isPremium && (
        <div style={{
          marginTop: 'var(--space-snug)',
          padding: 'var(--space-snug) var(--space-snug)',
          background: 'var(--brand-50)',
          borderRadius: 'var(--radius-tight)',
          fontSize: 12,
          color: 'var(--brand-700)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-snug)',
        }}>
          <span>{t('summary.premium_hint')}</span>
          <button
            onClick={onUpgrade}
            style={{
              background: 'var(--brand-500)',
              color: 'var(--surface)',
              border: 'none',
              borderRadius: 'var(--radius-round)',
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {t('summary.premium_cta')}
          </button>
        </div>
      )}
    </div>
  )
}
