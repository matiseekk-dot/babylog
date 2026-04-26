import React, { useState } from 'react'
import { t, useLocale } from '../i18n'
import { addBreadcrumb } from '../sentry'

/**
 * MedicalConsentScreen
 *
 * Zunifikowany ekran zgody medycznej + disclaimera.
 * Pokazany RAZ przed pierwszym użyciem aplikacji.
 *
 * v2.9.0 (kwiecień 2026):
 *   - Połączenie dwóch ekranów (consent + disclaimer) w jeden
 *   - Usunięte: scroll-to-bottom requirement (irytujący UX)
 *   - JEDEN checkbox zamiast dwóch poziomów akceptacji
 *
 * Kompatybilność z istniejącymi userami:
 *   Sprawdzane są DWA klucze localStorage:
 *     - 'babylog_medical_consent_v1' === '1'  (stary krótki ekran)
 *     - 'med_disclaimer_version' === '1.0'    (stary długi ekran)
 *   Jeśli któryś z nich jest ustawiony — user ma zaakceptowane.
 *   Wersja stampa NIE jest bumpowana — userzy z 2.8.x nie muszą akceptować
 *   ponownie. Treść została skrócona i zreorganizowana, ale prawne
 *   istota disclaimera (apka nie jest wyrobem medycznym, nie diagnozuje,
 *   nie zastępuje lekarza, 112 w nagłej sytuacji) jest zachowana.
 *
 * Przy nowej akceptacji zapisywane są OBA klucze defensywnie.
 */

export const CONSENT_VERSION = '1.0'

function readsAccepted() {
  try {
    const v = localStorage.getItem('med_disclaimer_version')
    const ts = localStorage.getItem('med_disclaimer_accepted')
    if (v === CONSENT_VERSION && !!ts) return true
    if (localStorage.getItem('babylog_medical_consent_v1') === '1') return true
    return false
  } catch {
    return false
  }
}

export function needsConsent() {
  return !readsAccepted()
}

function saveAcceptance() {
  try {
    localStorage.setItem('med_disclaimer_version', CONSENT_VERSION)
    localStorage.setItem('med_disclaimer_accepted', new Date().toISOString())
    localStorage.setItem('babylog_medical_consent_v1', '1')
  } catch (e) {
    // Safari Private Mode / quota exceeded — user zobaczy ekran znowu po reload.
    addBreadcrumb('storage', 'consent-save-failed', { msg: e?.message || 'unknown' })
  }
}

export default function MedicalConsentScreen({ onAccept }) {
  useLocale()
  const [checked, setChecked] = useState(false)

  const accept = () => {
    if (!checked) return
    saveAcceptance()
    try {
      if (window.Sentry?.addBreadcrumb) {
        window.Sentry.addBreadcrumb({
          category: 'legal',
          message: 'Medical consent accepted',
          data: { version: CONSENT_VERSION, timestamp: new Date().toISOString() },
          level: 'info',
        })
      }
    } catch {}
    onAccept?.()
  }

  return (
    <div className="app" style={{ overflow:'auto' }}>
      <div style={{
        maxWidth: 480, margin: '0 auto', padding: '32px 20px 24px',
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        paddingTop: 'max(32px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
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
          textAlign: 'center', margin: '0 0 24px',
          lineHeight: 1.5,
        }}>
          {t('consent.intro')}
        </p>

        {/* Bullet points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <ConsentPoint icon="📋" text={t('consent.p1')} />
          <ConsentPoint icon="🩺" text={t('consent.p2')} />
          <ConsentPoint icon="👨‍⚕️" text={t('consent.p3')} />
          <ConsentPoint icon="🚨" text={t('consent.p4')} />
        </div>

        {/* Emergency callout — wyróżniony wizualnie */}
        <div style={{
          background: '#FEE7DF',
          border: '1.5px solid #E05D44',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(224, 93, 68, 0.12)',
        }}>
          <div style={{
            fontSize: 13, fontWeight: 800,
            color: '#7A1F0C', marginBottom: 6,
            textTransform: 'uppercase', letterSpacing: '0.02em',
          }}>
            🚨 {t('consent.emergency_title')}
          </div>
          <div style={{ fontSize: 14, color: '#5A1808', lineHeight: 1.5, fontWeight: 600 }}>
            {t('consent.emergency_text')}
          </div>
        </div>

        {/* Spacer pushes checkbox+button to bottom on tall screens */}
        <div style={{ flex: 1, minHeight: 12 }} />

        {/* Single checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 14,
          cursor: 'pointer',
          padding: '4px 0',
        }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{
              width: 22,
              height: 22,
              marginTop: 1,
              flexShrink: 0,
              cursor: 'pointer',
              accentColor: '#1D9E75',
            }}
          />
          <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
            {t('consent.checkbox')}
          </span>
        </label>

        {/* Accept button */}
        <button
          type="button"
          onClick={accept}
          disabled={!checked}
          style={{
            background: checked
              ? 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)'
              : '#c0c0bc',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '16px 20px',
            fontSize: 16,
            fontWeight: 700,
            cursor: checked ? 'pointer' : 'not-allowed',
            boxShadow: checked ? '0 4px 14px rgba(15, 110, 86, 0.25)' : 'none',
            minHeight: 56,
            transition: 'background 0.2s, box-shadow 0.2s',
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
