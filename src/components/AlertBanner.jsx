import React from 'react'

// Mapowanie status → styl (nowe statusy: ok/info/warning/alert/critical)
const STYLES = {
  ok: {
    bg: '#E1F5EE', border: '#9FE1CB',
    titleColor: '#085041', msgColor: '#0F6E56', icon: '✓',
  },
  info: {
    bg: '#E6F1FB', border: '#85B7EB',
    titleColor: '#0C447C', msgColor: '#185FA5', icon: 'ℹ️',
  },
  warning: {
    bg: '#FAEEDA', border: '#FAC775',
    titleColor: '#633806', msgColor: '#854F0B', icon: '⚠️',
  },
  alert: {
    bg: '#FAECE7', border: '#F0997B',
    titleColor: '#712B13', msgColor: '#993C1D', icon: '🚨',
  },
  critical: {
    bg: '#FCEBEB', border: '#F09595',
    titleColor: '#501313', msgColor: '#791F1F', icon: '🆘',
  },
}

/**
 * AlertBanner — jeden komunikat
 * @param {{ status, title, message, action?, actionTarget? }} msg
 * @param {Function} onAction — nawigacja do sekcji
 * @param {boolean} compact — mniejszy wariant
 */
export default function AlertBanner({ msg, onAction, compact = false }) {
  if (!msg) return null
  const s = STYLES[msg.status] || STYLES.info

  return (
    <div style={{
      margin: '6px 16px 0',
      padding: compact ? '9px 12px' : '12px 14px',
      background: s.bg,
      border: `0.5px solid ${s.border}`,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      <span style={{ fontSize: compact ? 13 : 15, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.titleColor, marginBottom: 2 }}>
          {msg.title}
        </div>
        {msg.message && (
          <div style={{ fontSize: 12, color: s.msgColor, lineHeight: 1.45 }}>
            {msg.message}
          </div>
        )}
      </div>
      {msg.action && onAction && (
        <button onClick={() => onAction(msg.actionTarget)} style={{
          background: s.border, color: s.titleColor, border: 'none',
          borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {msg.action}
        </button>
      )}
    </div>
  )
}

/**
 * SectionAlerts — renderuje listę komunikatów dla sekcji
 */
export function SectionAlerts({ alerts, onAction }) {
  if (!alerts?.length) return null
  return (
    <>
      {alerts.map(m => (
        <AlertBanner key={m.id} msg={m} onAction={onAction} compact />
      ))}
    </>
  )
}
