import React, { useState, useEffect } from 'react'
import { getTipForToday } from '../data/dailyTips'
import { getLocale, t, useLocale } from '../i18n'

const LS_KEY = 'babylog_tip_seen'

/**
 * DailyTipCard
 * Shows one developmental tip per day, based on baby's age.
 * User can dismiss; dismissal tracked per day.
 */
export default function DailyTipCard({ ageMonths }) {
  useLocale()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const seen = localStorage.getItem(LS_KEY)
      if (seen === today) setDismissed(true)
    } catch {}
  }, [])

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(LS_KEY, new Date().toISOString().slice(0, 10))
    } catch {}
  }

  if (dismissed) return null

  const tip = getTipForToday(ageMonths, getLocale())

  return (
    <div style={{
      margin: '10px 16px 0',
      padding: '12px 14px',
      background: '#FEF9F0',
      border: '0.5px solid #FAC775',
      borderRadius: 12,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>
        {tip.emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#854F0B',
          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3,
        }}>
          {t('tip.label')}
        </div>
        <div style={{
          fontSize: 13, color: '#3a3a36', lineHeight: 1.45,
        }}>
          {tip.text}
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label={t('common.close')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 16, color: '#9a9a94', padding: 0,
          width: 24, height: 24, lineHeight: 1, flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}
