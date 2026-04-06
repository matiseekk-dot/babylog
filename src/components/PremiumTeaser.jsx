import React from 'react'

/**
 * PremiumTeaser
 *
 * Mały komponent zastępujący premium content dla użytkowników free.
 * Nie blokuje dostępu do sekcji — tylko pokazuje że coś jest dostępne w premium.
 *
 * Props:
 *   label      – np. "Analiza temperatury"
 *   onUpgrade  – fn() otwiera paywall
 */
export default function PremiumTeaser({ label, onUpgrade }) {
  return (
    <div
      onClick={onUpgrade}
      style={{
        margin: '8px 16px 0',
        padding: '10px 14px',
        background: 'rgba(29,158,117,0.05)',
        border: '0.5px dashed rgba(29,158,117,0.35)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 14 }}>🔒</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, color: '#5a5a56' }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: '#0F6E56',
        background: '#E1F5EE',
        padding: '3px 9px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}>
        Premium
      </span>
    </div>
  )
}
