import React from 'react'

/**
 * InlineInsight
 *
 * Małý, kontekstowy komunikat wyświetlany nad listą w sekcji.
 * Nie zastępuje żadnego istniejącego elementu — wstawiany addytywnie.
 *
 * Props:
 *   insight: { label, detail?, status } | null
 *
 * status → kolor lewego paska:
 *   ok      → zielony
 *   info    → niebieski
 *   warning → żółty
 *   alert   → czerwony
 */

const PALETTE = {
  ok:      { bar: '#1D9E75', bg: '#F4FCF9', text: '#085041', sub: '#0F6E56' },
  info:    { bar: '#378ADD', bg: '#F0F7FD', text: '#0C447C', sub: '#185FA5' },
  warning: { bar: '#BA7517', bg: '#FEF9F0', text: '#633806', sub: '#854F0B' },
  alert:   { bar: '#D85A30', bg: '#FEF3EE', text: '#712B13', sub: '#993C1D' },
}

export default function InlineInsight({ insight }) {
  if (!insight) return null

  const p = PALETTE[insight.status] || PALETTE.ok

  return (
    <div style={{
      margin: '8px 16px 0',
      borderRadius: 10,
      background: p.bg,
      borderLeft: `3px solid ${p.bar}`,
      padding: '9px 12px',
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
    }}>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: p.text,
        flexShrink: 0,
      }}>
        {insight.label}
      </span>
      {insight.detail && (
        <span style={{
          fontSize: 12,
          color: p.sub,
          lineHeight: 1.4,
          minWidth: 0,
        }}>
          {insight.detail}
        </span>
      )}
    </div>
  )
}
