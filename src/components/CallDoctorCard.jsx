import React, { useState } from 'react'
import { t, useLocale } from '../i18n'

/**
 * CallDoctorCard
 *
 * v2.7.5 refactor: Karta prezentująca PROGI REFERENCYJNE z literatury
 * medycznej (AAP, Mayo Clinic) — nie wsparcie decyzyjne. Wszystkie
 * komunikaty mają jasną atrybucję źródła i disclaimer.
 *
 * v2.7.5b: Collapsible. Domyślnie zwinięty oprócz `severity === 'emergency'`.
 * User widzi że jest informacja, treść rozwija na tap. Oszczędność miejsca
 * na ekranie — wcześniej karta zajmowała ~400px wysokości na fold.
 */

const SEVERITY_CONFIG = {
  watch: {
    color: '#854F0B', bg: '#FAEEDA', border: '#FAC775',
    emoji: 'ℹ️', titleKey: 'crisis.watch.title',
  },
  call: {
    color: '#854F0B', bg: '#FAEEDA', border: '#FAC775',
    emoji: 'ℹ️', titleKey: 'crisis.call.title',
  },
  emergency: {
    color: '#993C1D', bg: '#FAEEDA', border: '#F0997B',
    emoji: 'ℹ️', titleKey: 'crisis.emergency.title',
  },
}

export default function CallDoctorCard({ severity = 'watch', reason, onDismiss, onNavigate, onPrep }) {
  useLocale()
  const cfg = SEVERITY_CONFIG[severity]

  // Emergency zostaje rozwinięty (faktycznie ważne); watch/call domyślnie zwinięte.
  // Stan zachowywany w localStorage żeby przejście między tabami nie resetowało.
  const [expanded, setExpanded] = useState(() => {
    if (severity === 'emergency') return true
    try {
      const stored = localStorage.getItem(`call_doctor_expanded_${severity}`)
      return stored === 'true'
    } catch {
      return false
    }
  })

  const toggleExpanded = () => {
    setExpanded(prev => {
      const next = !prev
      try { localStorage.setItem(`call_doctor_expanded_${severity}`, next ? 'true' : 'false') } catch { /* ignore */ }
      return next
    })
  }

  const EMERGENCY_PHONE = '112'

  const call112 = () => {
    window.location.href = `tel:${EMERGENCY_PHONE}`
  }

  return (
    <div style={{
      margin: '12px 16px 0',
      padding: expanded ? '14px' : '10px 14px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 14,
      position: 'relative',
      transition: 'padding 0.15s ease',
    }}>
      {/* Header — klikalny, toggluje expanded */}
      <button
        type="button"
        onClick={() => toggleExpanded()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, textAlign: 'left',
          marginBottom: expanded ? 12 : 0,
        }}
      >
        <div style={{ fontSize: expanded ? 22 : 18, flexShrink: 0 }}>{cfg.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: expanded ? 15 : 13, fontWeight: 700, color: cfg.color, lineHeight: 1.2 }}>
            {t(cfg.titleKey)}
          </div>
          {/* W trybie zwiniętym — krótkie reason w jednej linii */}
          {!expanded && reason && (
            <div style={{
              fontSize: 11, color: '#5a5a56', marginTop: 2, lineHeight: 1.3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {reason}
            </div>
          )}
        </div>
        <span style={{ color: cfg.color, fontSize: 12, flexShrink: 0, opacity: 0.7 }}>
          {expanded ? '▲' : '▼'}
        </span>
        {/* Dismiss button — tylko gdy expanded */}
        {expanded && (
          <span
            onClick={(e) => { e.stopPropagation(); onDismiss?.() }}
            role="button"
            aria-label={t('common.close') || 'Zamknij'}
            style={{
              fontSize: 18, color: '#9a9a94', padding: 4, cursor: 'pointer', flexShrink: 0,
            }}
          >✕</span>
        )}
      </button>

      {/* Treść expanded */}
      {expanded && (
        <>
          {/* Pełny reason + cytat źródła */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#5a5a56', lineHeight: 1.4 }}>
              {reason}
            </div>
            <div style={{
              fontSize: 10, color: cfg.color, opacity: 0.75,
              marginTop: 6, fontStyle: 'italic', lineHeight: 1.35,
            }}>
              {t('rule.source_label')} {t('rule.source.aap')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {severity === 'watch' && (
              <>
                <button onClick={() => onNavigate('temp')} style={actionBtn(cfg, 'primary')}>
                  {t('crisis.watch.action1')}
                </button>
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(186, 117, 23, 0.06)',
                  borderRadius: 8, fontSize: 12, color: cfg.color,
                  textAlign: 'center', lineHeight: 1.45, fontWeight: 500,
                }}>
                  💡 {t('crisis.watch.advice')}
                </div>
              </>
            )}

            {severity === 'call' && (
              <>
                <div style={{
                  padding: '14px',
                  background: 'rgba(216, 90, 48, 0.08)',
                  border: `1px solid ${cfg.border}`,
                  borderRadius: 10, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: cfg.color, marginBottom: 4 }}>
                    {t('crisis.call.action')}
                  </div>
                  <div style={{ fontSize: 12, color: '#712B13', lineHeight: 1.5 }}>
                    {t('crisis.call.advice')}
                  </div>
                </div>
                <button onClick={() => onPrep?.()} style={actionBtn(cfg, 'secondary')}>
                  📋 {t('crisis.action.what_to_prepare')}
                </button>
              </>
            )}

            {severity === 'emergency' && (
              <>
                <button onClick={call112} style={{
                  ...actionBtn(cfg, 'primary'),
                  fontSize: 15,
                }}>
                  {t('crisis.action.call_112')} — {EMERGENCY_PHONE}
                </button>
                <div style={{ fontSize: 11, color: '#712B13', textAlign: 'center', marginTop: 4, lineHeight: 1.4 }}>
                  {t('crisis.emergency.disclaimer')}
                </div>
              </>
            )}
          </div>

          {/* Per-card disclaimer */}
          <div style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: `0.5px solid ${cfg.border}`,
            fontSize: 10,
            color: cfg.color,
            opacity: 0.7,
            lineHeight: 1.4,
          }}>
            {t('rule.disclaimer')}
          </div>
        </>
      )}
    </div>
  )
}

function actionBtn(cfg, variant) {
  return variant === 'primary'
    ? {
        width: '100%', padding: '13px', minHeight: 48,
        background: cfg.color, color: '#fff',
        border: 'none', borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }
    : {
        width: '100%', padding: '11px', minHeight: 44,
        background: 'transparent', color: cfg.color,
        border: `1px solid ${cfg.border}`, borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }
}
