import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * CallDoctorCard
 *
 * KILLER FEATURE — wsparcie decyzyjne w kryzysie.
 *
 * Pokazuje się gdy:
 *   - temperatura ≥ 39.0°C
 *   - gorączka trwa > 48h
 *   - dziecko < 3 miesiące i gorączka ≥ 38.0°C
 *
 * NIE jest poradą medyczną — kieruje do lekarza z jasną decyzją.
 *
 * Props:
 *   severity: 'watch' | 'call' | 'emergency'
 *   reason: string describing why it fired
 *   onDismiss: fn
 *   onNavigate: fn(section)
 */

const SEVERITY_CONFIG = {
  watch: {
    color: '#BA7517', bg: '#FEF9F0', border: '#FAC775',
    emoji: '👀', titleKey: 'crisis.watch.title',
  },
  call: {
    color: '#D85A30', bg: '#FEF3EE', border: '#F0997B',
    emoji: '📞', titleKey: 'crisis.call.title',
  },
  emergency: {
    color: '#A32D2D', bg: '#FFF0F0', border: '#F09595',
    emoji: '🚨', titleKey: 'crisis.emergency.title',
  },
}

export default function CallDoctorCard({ severity = 'watch', reason, onDismiss, onNavigate, onPrep }) {
  useLocale()
  const cfg = SEVERITY_CONFIG[severity]

  // Per-locale emergency numbers (BUG-003 fix)
  const locale = (() => {
    try { return (localStorage.getItem('babylog_locale') || navigator.language || 'pl').toLowerCase().startsWith('pl') ? 'pl' : 'en' }
    catch { return 'pl' }
  })()
  const DOCTOR_PHONE = locale === 'pl' ? '800 190 590' : '112'  // EN fallback: generic EU emergency
  const EMERGENCY_PHONE = '112'

  const callDoctor = () => {
    const phone = severity === 'emergency' ? EMERGENCY_PHONE : DOCTOR_PHONE
    window.location.href = `tel:${phone.replace(/\s/g, '')}`
  }

  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '16px',
      background: cfg.bg,
      border: `2px solid ${cfg.border}`,
      borderRadius: 14,
      position: 'relative',
      animation: severity === 'emergency' ? 'crisisPulse 2s ease-in-out infinite' : 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 28 }}>{cfg.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: cfg.color, lineHeight: 1.2 }}>
            {t(cfg.titleKey)}
          </div>
          <div style={{ fontSize: 12, color: '#5a5a56', marginTop: 2, lineHeight: 1.35 }}>
            {reason}
          </div>
        </div>
        <button onClick={onDismiss} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: '#9a9a94', padding: 4,
        }}>✕</button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {severity === 'watch' && (
          <>
            <button onClick={() => onNavigate('temp')} style={actionBtn(cfg, 'primary')}>
              {t('crisis.watch.action1')}
            </button>
            <button onClick={callDoctor} style={actionBtn(cfg, 'secondary')}>
              📞 {t('crisis.action.call_doctor')}
            </button>
          </>
        )}

        {severity === 'call' && (
          <>
            <button onClick={callDoctor} style={actionBtn(cfg, 'primary')}>
              📞 {t('crisis.action.call_doctor')} — {DOCTOR_PHONE}
            </button>
            <button onClick={() => onPrep?.()} style={actionBtn(cfg, 'secondary')}>
              {t('crisis.action.what_to_prepare')}
            </button>
          </>
        )}

        {severity === 'emergency' && (
          <>
            <button onClick={callDoctor} style={{
              ...actionBtn(cfg, 'primary'),
              background: '#A32D2D', fontSize: 17,
            }}>
              🚨 {t('crisis.action.call_112')} — {EMERGENCY_PHONE}
            </button>
            <div style={{ fontSize: 11, color: '#712B13', textAlign: 'center', marginTop: 4, lineHeight: 1.4 }}>
              {t('crisis.emergency.disclaimer')}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes crisisPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(163, 45, 45, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(163, 45, 45, 0); }
        }
      `}</style>
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
