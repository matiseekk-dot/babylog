import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * MedicalConsentScreen
 *
 * Shown ONCE before user can access the app for the first time.
 * Legal + medical disclaimer consent gate.
 *
 * Stored in localStorage under 'babylog_medical_consent_v1'.
 */
export default function MedicalConsentScreen({ onAccept }) {
  useLocale()

  return (
    <div className="app" style={{ overflow:'auto' }}>
      <div style={{
        maxWidth: 480, margin: '0 auto', padding: '32px 20px 40px',
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 20px',
          boxShadow: '0 4px 14px rgba(15, 110, 86, 0.25)',
        }}>
          🍼
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 24, fontWeight: 800, color: 'var(--text)',
          textAlign: 'center', margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}>
          {t('consent.title')}
        </h1>

        <p style={{
          fontSize: 15, color: 'var(--text-2)',
          textAlign: 'center', margin: '0 0 28px',
          lineHeight: 1.5,
        }}>
          {t('consent.intro')}
        </p>

        {/* Bullet points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          <ConsentPoint icon="📖" text={t('consent.p1')} />
          <ConsentPoint icon="📞" text={t('consent.p2')} />
          <ConsentPoint icon="💊" text={t('consent.p3')} />
          <ConsentPoint icon="⚖️" text={t('consent.p4')} />
        </div>

        {/* Emergency callout */}
        <div style={{
          background: '#FCEBEB',
          border: '1.5px solid #F09595',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: '#A32D2D', marginBottom: 4,
          }}>
            🚨 {t('consent.emergency_title')}
          </div>
          <div style={{ fontSize: 13, color: '#501313', lineHeight: 1.45 }}>
            {t('consent.emergency_text')}
          </div>
        </div>

        {/* Accept button */}
        <button
          onClick={onAccept}
          style={{
            background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '16px 20px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', marginTop: 'auto',
            boxShadow: '0 4px 14px rgba(15, 110, 86, 0.25)',
            minHeight: 56,
          }}
        >
          {t('consent.accept')}
        </button>
      </div>
    </div>
  )
}

function ConsentPoint({ icon, text }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        fontSize: 18, lineHeight: 1,
        flexShrink: 0, marginTop: 2,
        width: 28, textAlign: 'center',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
        {text}
      </div>
    </div>
  )
}
