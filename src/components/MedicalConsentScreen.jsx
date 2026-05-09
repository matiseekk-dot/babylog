import React, { useState } from 'react'
import { t, useLocale } from '../i18n'
import { addBreadcrumb } from '../sentry'
import { trackConsentAccepted } from '../utils/analytics'

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
    // v2.11.32 P1-6: pierwszy event funnel — user przeszedł consent.
    trackConsentAccepted()
    onAccept?.()
  }

  return (
    // v2.11.26: outer-scroll architecture (jak fix disclaimer w v2.11.24).
    //
    // Wcześniej: outer .app z height:100dvh + display:flex flexDirection:column,
    // inner z minHeight:100dvh + flex:1 spacer pchający checkbox+button na dół.
    // Bug: na małych ekranach (5", landscape, dynamiczne paski Android, safe area)
    // content (ikona 72px + 4 bullet points + emergency callout) zajmował więcej
    // niż 100dvh-paddings. Spacer:flex:1 kompresował się do 0, ale checkbox+button
    // już nie mieściły się w viewport. User widział TYLKO button "Rozumiem,
    // kontynuuj" wystający dolnym brzegiem, klik = nic (button disabled, bo
    // checkbox NIEWIDOCZNY = niezaznaczony).
    //
    // Plus na Android Chrome WebView TWA inner overflow:auto był touch-hijacked
    // (jak disclaimer screen), scroll w ogóle nie działał.
    //
    // Fix: outer position:fixed inset:0 + overflowY:auto = THE scroller. Content
    // jako zwykły flow. Footer (checkbox + button) sticky bottom:0 — ZAWSZE
    // widoczny niezależnie od wielkości ekranu / wysokości content.
    <div style={{
      position: 'fixed',
      inset: 0,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      background: 'var(--bg)',
      zIndex: 9999,
    }}>
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: 'var(--space-spacious) var(--space-comfortable) 0',
        paddingTop: 'max(var(--space-spacious), env(safe-area-inset-top))',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--space-comfortable)',
          background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-500) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto var(--space-comfortable)',
          boxShadow: '0 4px 14px rgba(15, 110, 86, 0.25)',
        }}>
          🍼
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 24, fontWeight: 800, color: 'var(--text)',
          textAlign: 'center', margin: '0 0 var(--space-snug)',
          letterSpacing: '-0.02em',
        }}>
          {t('consent.title')}
        </h1>

        <p style={{
          fontSize: 15, color: 'var(--text-2)',
          textAlign: 'center', margin: '0 0 var(--space-comfortable)',
          lineHeight: 1.5,
        }}>
          {t('consent.intro')}
        </p>

        {/* Bullet points */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: 'var(--space-snug)',
          marginBottom: 'var(--space-comfortable)',
        }}>
          <ConsentPoint icon="📋" text={t('consent.p1')} />
          <ConsentPoint icon="🩺" text={t('consent.p2')} />
          <ConsentPoint icon="👨‍⚕️" text={t('consent.p3')} />
          <ConsentPoint icon="🚨" text={t('consent.p4')} />
        </div>

        {/* Emergency callout — wyróżniony wizualnie */}
        <div style={{
          background: 'var(--alert-50)',
          border: '1.5px solid var(--alert-500)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space) var(--space)',
          marginBottom: 'var(--space-comfortable)',
          boxShadow: '0 1px 3px rgba(224, 93, 68, 0.12)',
        }}>
          <div style={{
            fontSize: 13, fontWeight: 800,
            color: 'var(--alert-700)', marginBottom: 'var(--space-tight)',
            textTransform: 'uppercase', letterSpacing: '0.02em',
          }}>
            🚨 {t('consent.emergency_title')}
          </div>
          <div style={{ fontSize: 15, color: 'var(--alert-700)', lineHeight: 1.5, fontWeight: 600 }}>
            {t('consent.emergency_text')}
          </div>
        </div>
      </div>

      {/* Sticky footer — checkbox + button ZAWSZE widoczne, niezależnie od scroll
          pozycji. To gwarantuje że user widzi co musi zaznaczyć i co kliknąć,
          bez konieczności docierania do końca strony. */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: 'var(--bg)',
        borderTop: '0.5px solid var(--border)',
        padding: 'var(--space) var(--space-comfortable)',
        paddingBottom: 'max(var(--space-comfortable), env(safe-area-inset-bottom))',
        maxWidth: 480,
        margin: '0 auto',
      }}>
        {/* Single checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-snug)',
          marginBottom: 'var(--space)',
          cursor: 'pointer',
          padding: 'var(--space-tight) 0',
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
              accentColor: 'var(--brand-500)',
            }}
          />
          <span style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.5 }}>
            {t('consent.checkbox')}
          </span>
        </label>

        {/* Accept button */}
        <button
          type="button"
          onClick={accept}
          disabled={!checked}
          style={{
            width: '100%',
            background: checked
              ? 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-500) 100%)'
              : 'var(--text-3)',
            color: 'var(--surface)',
            border: 'none',
            borderRadius: 'var(--radius-comfortable)',
            padding: 'var(--space) var(--space)',
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
    <div style={{ display: 'flex', gap: 'var(--space-snug)', alignItems: 'flex-start' }}>
      <div style={{
        fontSize: 18, lineHeight: 1,
        flexShrink: 0, marginTop: 2,
        width: 28, textAlign: 'center',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.5 }}>
        {text}
      </div>
    </div>
  )
}
