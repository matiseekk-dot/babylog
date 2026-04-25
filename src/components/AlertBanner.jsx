import React, { useState } from 'react'
import { t } from '../i18n'

// v2.7.5: Złagodzone kolory dla `alert` i `critical`. Wszystkie statusy
// używają stonowanej palety informacyjnej (info/warning) zgodnie z framingiem
// "informacja referencyjna z literatury", nie "decision support".
//
// v2.7.5b: Disclaimer jest schowany pod "ℹ" przyciskiem (oszczędność miejsca).
// User klika żeby zobaczyć pełną dyskaczę. Source zostaje widoczne zawsze
// (kluczowe dla framingu legal).
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
    titleColor: '#633806', msgColor: '#854F0B', icon: 'ℹ️',
  },
  alert: {
    bg: '#FAEEDA', border: '#FAC775',
    titleColor: '#633806', msgColor: '#854F0B', icon: 'ℹ️',
  },
  critical: {
    bg: '#FAEEDA', border: '#F0997B',
    titleColor: '#712B13', msgColor: '#993C1D', icon: 'ℹ️',
  },
}

/**
 * AlertBanner — jeden komunikat referencyjny.
 *
 * msg ma pola: status, title, message, source (klucz i18n), action, actionTarget
 * Disclaimer jest schowany pod "ℹ" przyciskiem (klik = pokaż).
 */
export default function AlertBanner({ msg, onAction, compact = false }) {
  if (!msg) return null
  const s = STYLES[msg.status] || STYLES.info
  const needsDisclaimer = ['warning', 'alert', 'critical'].includes(msg.status)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

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
        <div style={{
          fontSize: 12, fontWeight: 700, color: s.titleColor, marginBottom: 2,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ flex: 1, minWidth: 0 }}>{msg.title}</span>
          {/* "ℹ" button — toggluje disclaimer. Tylko dla warning/alert/critical
              non-compact (compact = w sekcjach, nie ma miejsca). */}
          {needsDisclaimer && !compact && (
            <button
              type="button"
              onClick={() => setShowDisclaimer(d => !d)}
              aria-label="info"
              style={{
                background: 'transparent',
                border: `0.5px solid ${s.border}`,
                color: s.titleColor,
                width: 18, height: 18, borderRadius: '50%',
                fontSize: 10, fontWeight: 700,
                cursor: 'pointer', padding: 0, lineHeight: '16px',
                flexShrink: 0,
              }}
            >
              ℹ
            </button>
          )}
        </div>
        {msg.message && (
          <div style={{ fontSize: 12, color: s.msgColor, lineHeight: 1.45 }}>
            {msg.message}
          </div>
        )}
        {msg.source && (
          <div style={{
            fontSize: 10,
            color: s.msgColor,
            opacity: 0.75,
            marginTop: 6,
            fontStyle: 'italic',
            lineHeight: 1.35,
          }}>
            {t('rule.source_label')} {t(msg.source)}
          </div>
        )}
        {/* Disclaimer rozwijany na klik "ℹ" */}
        {showDisclaimer && needsDisclaimer && !compact && (
          <div style={{
            fontSize: 10,
            color: s.msgColor,
            opacity: 0.65,
            marginTop: 6,
            paddingTop: 6,
            borderTop: `0.5px solid ${s.border}`,
            lineHeight: 1.35,
          }}>
            {t('rule.disclaimer')}
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
 * SectionAlerts — lista alertów dla sekcji. Compact (oszczędność miejsca)
 * pokazuje source ale nie disclaimera.
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
