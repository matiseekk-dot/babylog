import React, { useState } from 'react'
import { t, useLocale } from '../i18n'

function getStatusConfig() {
  return {
    ok:       { bg: '#E1F5EE', border: '#9FE1CB', dot: '#1D9E75', text: '#085041', label: t('status.ok')       },
    info:     { bg: '#E6F1FB', border: '#85B7EB', dot: '#378ADD', text: '#0C447C', label: t('status.info')     },
    warning:  { bg: '#FAEEDA', border: '#FAC775', dot: '#BA7517', text: '#633806', label: t('status.warning')  },
    alert:    { bg: '#FAECE7', border: '#F0997B', dot: '#D85A30', text: '#712B13', label: t('status.alert')    },
    critical: { bg: '#FCEBEB', border: '#F09595', dot: '#A32D2D', text: '#501313', label: t('status.critical') },
  }
}

/**
 * ChildStatusBar — pasek globalnego statusu między topbarem a contentem.
 * Tapnięcie rozwija listę wszystkich aktywnych komunikatów.
 */
export default function ChildStatusBar({ globalStatus, topStatus, allMessages, onNavigate }) {
  useLocale()
  const STATUS_CONFIG = getStatusConfig()
  const [expanded, setExpanded] = useState(false)

  if (!globalStatus) return null

  const cfg = STATUS_CONFIG[topStatus] || STATUS_CONFIG.ok
  const others = (allMessages || []).filter(
    m => m.id !== globalStatus.id && m.status !== 'ok'
  )

  const pulse = topStatus === 'critical' || topStatus === 'alert'

  return (
    <div style={{ background: cfg.bg, borderBottom: `0.5px solid ${cfg.border}`, flexShrink: 0 }}>

      {/* Główny wiersz — zawsze widoczny */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        {/* Dot — pulsuje przy alert/critical */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0,
          animation: pulse ? 'statusPulse 1.4s ease-in-out infinite' : 'none',
        }} />

        {/* Etykieta statusu */}
        <span style={{
          fontSize: 10, fontWeight: 700, color: cfg.dot,
          background: `${cfg.dot}20`, borderRadius: 4, padding: '1px 6px',
          letterSpacing: 0.5, flexShrink: 0,
        }}>
          {cfg.label}
        </span>

        {/* Tytuł */}
        <span style={{
          fontSize: 12, fontWeight: 700, color: cfg.text, flex: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {globalStatus.title}
        </span>

        {/* Liczba pozostałych alertów */}
        {others.length > 0 && (
          <span style={{
            background: cfg.dot, color: '#fff', fontSize: 10, fontWeight: 700,
            borderRadius: 20, padding: '1px 6px', flexShrink: 0,
          }}>
            +{others.length}
          </span>
        )}

        <span style={{ color: cfg.dot, fontSize: 11, flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Rozwinięty panel */}
      {expanded && (
        <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Wiadomość główna */}
          {globalStatus.message && (
            <div style={{ fontSize: 12, color: cfg.text, lineHeight: 1.5, marginBottom: 8 }}>
              {globalStatus.message}
            </div>
          )}

          {/* Pozostałe komunikaty */}
          {others.map(m => {
            const mc = STATUS_CONFIG[m.status] || STATUS_CONFIG.info
            return (
              <div
                key={m.id}
                onClick={() => { onNavigate?.(m.section); setExpanded(false) }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '7px 0', borderTop: `0.5px solid ${cfg.border}`,
                  cursor: m.section ? 'pointer' : 'default',
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: mc.dot, flexShrink: 0, marginTop: 4,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: mc.text }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: mc.text, opacity: 0.8, lineHeight: 1.4, marginTop: 1 }}>{m.message}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: mc.dot, flexShrink: 0 }}>
                  {STATUS_CONFIG[m.status]?.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}
