import React, { useState } from 'react'
import { t, useLocale } from '../i18n'
import { X } from 'lucide-react'

/**
 * TodaySummaryCard — uproszczona karta z linkiem do wytycznych PTP/AAP.
 *
 * v2.10.5b: po feedbacku — usunięte duplikujące statystyki (są już w TodayTab
 * timeline poniżej). Karta zostawia TYLKO link do wytycznych + przycisk
 * dismiss. Po dismiss flaga w localStorage — karta nie pokazuje się więcej
 * (do reset w Settings, jeśli kiedyś dodamy).
 *
 * Behavior:
 *   - Klik na link "Zobacz wytyczne" → nawiguje do tab 'reference'
 *   - Klik na X → dismiss permanent (localStorage flag)
 *
 * Props:
 *   onNavigate    — fn(tabId)
 */
const DISMISS_KEY = 'today_summary_dismissed'

export default function TodaySummaryCard({ onNavigate }) {
  useLocale()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  if (dismissed) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
    setDismissed(true)
  }

  return (
    <div style={{
      margin: 'var(--space-snug) var(--space)',
      padding: 'var(--space-snug) var(--space)',
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-comfortable)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-snug)',
    }}>
      <button
        onClick={() => onNavigate?.('reference')}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          padding: 'var(--space-tight) 0',
          fontSize: 13,
          color: 'var(--text)',
          cursor: 'pointer',
          textAlign: 'left',
          fontWeight: 500,
        }}
      >
        {t('summary.see_reference')}
      </button>
      <button
        onClick={dismiss}
        aria-label={t('common.close')}
        style={{
          background: 'none',
          border: 'none',
          padding: 'var(--space-tight)',
          color: 'var(--text-3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
