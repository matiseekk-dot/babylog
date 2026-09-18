import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * TrialStartedModal — Pakiet B Paywall (onboarding paywall).
 *
 * v2.14.0 — Pokazuje się JEDEN raz po zakończonym onboardingu.
 * Cel: user od razu wie że ma 14 dni Premium ODBLOKOWANE (bez karty),
 * co zwiększa engagement + poznaje features za które później zapłaci.
 *
 * WAŻNE: to nie jest paywall sprzedażowy — brak CTA "Kup teraz".
 * Tylko CTA "Zaczynam" żeby user wszedł w flow bez pressure.
 * Zwiększa perceived value trialu, redukuje "surprise downgrade" po 14 dniach.
 *
 * Trigger: App.jsx po detekcji świeżego trialu (trial_start - now < 60s).
 * Flag: localStorage babylog_trial_started_shown_{uid|guest}
 *
 * Props:
 *   open   — czy widoczny
 *   onClose — user klika "Zaczynam"
 */
export default function TrialStartedModal({ open, onClose }) {
  useLocale()
  if (!open) return null

  const features = [
    { icon: '📊', key: 'growth_charts' },
    { icon: '📄', key: 'pdf_report' },
    { icon: '👶', key: 'multi_child' },
    { icon: '🔔', key: 'med_reminders' },
    { icon: '🩺', key: 'doctor_notes' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-started-title"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        background: 'linear-gradient(180deg,#fff 0%,#F7F5F2 100%)',
        borderRadius: 20, padding: 24,
        maxWidth: 400, width: '100%',
        boxShadow: '0 20px 60px rgba(15, 110, 86, 0.35)',
        border: '2px solid #9FE1CB',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Celebration */}
        <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 4 }}>🎁</div>

        <h2
          id="trial-started-title"
          style={{
            fontSize: 22, fontWeight: 800, textAlign: 'center',
            margin: '0 0 8px', color: '#0F6E56', lineHeight: 1.2,
          }}
        >
          {t('trial_started.title')}
        </h2>

        <p style={{
          fontSize: 14, textAlign: 'center', color: '#5a5a56',
          margin: '0 0 20px', lineHeight: 1.5,
        }}>
          {t('trial_started.subtitle')}
        </p>

        {/* Lista Premium features */}
        <div style={{
          background: '#fff', border: '1px solid #D9E9E1',
          borderRadius: 12, padding: 14, marginBottom: 16,
        }}>
          {features.map((f, i) => (
            <div
              key={f.key}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '8px 0',
                borderBottom: i < features.length - 1 ? '1px solid #F0F0EC' : 'none',
              }}
            >
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: -2 }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13.5, fontWeight: 700, color: '#1a1a18', marginBottom: 2,
                }}>
                  {t(`trial_started.features.${f.key}.title`)}
                </div>
                <div style={{ fontSize: 12, color: '#7a7a74', lineHeight: 1.4 }}>
                  {t(`trial_started.features.${f.key}.desc`)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust hint — bez karty */}
        <div style={{
          background: '#FFF7E6', border: '1px solid #FFC94A',
          borderRadius: 10, padding: '10px 12px', marginBottom: 16,
          fontSize: 12, color: '#5C3A00', textAlign: 'center', lineHeight: 1.4,
        }}>
          <strong>✓ {t('trial_started.no_card_hint')}</strong>
        </div>

        {/* CTA — jedyne: "Zaczynam" */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: 14, minHeight: 52,
            background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {t('trial_started.cta')}
        </button>
      </div>
    </div>
  )
}
