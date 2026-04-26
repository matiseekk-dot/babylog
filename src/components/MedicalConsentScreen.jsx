import React, { useState } from 'react'
import { t, useLocale } from '../i18n'
import { addBreadcrumb } from '../sentry'

/**
 * MedicalConsentScreen — v2.10.5 MDR EXIT REFACTOR.
 *
 * GŁÓWNA ZMIANA vs v2.10.4:
 *   Przeszliśmy z "defensive disclaimer" ("to nie jest wyrób medyczny,
 *   nie diagnozuje") na "positive declaration of purpose" ("to jest
 *   dziennik z biblioteką wytycznych").
 *
 * Powód: pierwsza forma defensywna była częściowo skuteczna prawnie ale
 *   zostawiała wrażenie że apka *robi* rzeczy medyczne i tylko prosi
 *   o zwolnienie z odpowiedzialności. Druga forma deklaruje *intended
 *   purpose* zgodnie z MDCG 2019-11 jako journal+reference, nie decision
 *   support — co wzmacnia pozycję NIE-MDSW w ocenie URPL.
 *
 * Plus: dodajemy explicit consent na przetwarzanie special category data
 *   (RODO art. 9 ust. 2 lit. a — dane zdrowotne dziecka).
 *
 * Backwards compat: czytamy stare klucze localStorage żeby istniejący
 *   userzy nie musieli akceptować ponownie.
 */

export const CONSENT_VERSION = '2.0' // bump z 1.0 — nowa treść = nowa zgoda dla nowych userów

function readsAccepted() {
  try {
    const v = localStorage.getItem('med_disclaimer_version')
    const ts = localStorage.getItem('med_disclaimer_accepted')
    // Akceptujemy v1.0 i v2.0 jako valid — istniejący userzy nie muszą re-acceptować.
    if ((v === '1.0' || v === '2.0') && !!ts) return true
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
    // RODO consent stamp — osobny od ogólnego acceptance
    localStorage.setItem('rodo_health_data_consent', '1')
    localStorage.setItem('rodo_health_data_consent_at', new Date().toISOString())
  } catch (e) {
    addBreadcrumb('storage', 'consent-save-failed', { msg: e?.message || 'unknown' })
  }
}

export default function MedicalConsentScreen({ onAccept }) {
  useLocale()
  // Dwa explicit checkboxy: (1) zrozumienie funkcji apki, (2) zgoda RODO art. 9
  const [understandsFn, setUnderstandsFn] = useState(false)
  const [consentRodo, setConsentRodo] = useState(false)
  const canAccept = understandsFn && consentRodo

  const accept = () => {
    if (!canAccept) return
    saveAcceptance()
    try {
      if (window.Sentry?.addBreadcrumb) {
        window.Sentry.addBreadcrumb({
          category: 'legal',
          message: 'Consent accepted (purpose + RODO art. 9)',
          data: { version: CONSENT_VERSION, timestamp: new Date().toISOString() },
          level: 'info',
        })
      }
    } catch {}
    onAccept?.()
  }

  return (
    <div className="app" style={{ overflow: 'auto' }}>
      <div style={{
        maxWidth: 480, margin: '0 auto',
        padding: 'var(--space-spacious) var(--space-comfortable) var(--space-comfortable)',
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        paddingTop: 'max(var(--space-spacious), env(safe-area-inset-top))',
        paddingBottom: 'max(var(--space-comfortable), env(safe-area-inset-bottom))',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--space-comfortable)',
          background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-500) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto var(--space-comfortable)',
        }}>
          📔
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: 'var(--text)',
          textAlign: 'center', margin: '0 0 var(--space-snug)',
          letterSpacing: '-0.02em', lineHeight: 1.25,
        }}>
          {t('consent.v2.title')}
        </h1>

        <p style={{
          fontSize: 14, color: 'var(--text-2)',
          textAlign: 'center', margin: '0 0 var(--space-comfortable)',
          lineHeight: 1.5,
        }}>
          {t('consent.v2.intro')}
        </p>

        {/* SEKCJA 1: Co robi apka (positive declaration) */}
        <Section title={t('consent.v2.what_app_does')}>
          <Bullet icon="📔">{t('consent.v2.point.journal')}</Bullet>
          <Bullet icon="📚">{t('consent.v2.point.library')}</Bullet>
          <Bullet icon="📊">{t('consent.v2.point.charts')}</Bullet>
        </Section>

        {/* SEKCJA 2: Co apka NIE robi (clear boundaries) */}
        <Section title={t('consent.v2.what_app_doesnt')}>
          <Bullet icon="🚫">{t('consent.v2.not.diagnose')}</Bullet>
          <Bullet icon="🚫">{t('consent.v2.not.recommend')}</Bullet>
          <Bullet icon="🚫">{t('consent.v2.not.dose')}</Bullet>
        </Section>

        {/* SEKCJA 3: Twoje obowiązki */}
        <Section title={t('consent.v2.your_role')}>
          <Bullet icon="👨‍⚕️">{t('consent.v2.point.doctor')}</Bullet>
          <Bullet icon="📞">{t('consent.v2.point.emergency')}</Bullet>
        </Section>

        {/* CHECKBOXES */}
        <div style={{
          marginTop: 'var(--space-snug)',
          padding: 'var(--space-snug) var(--space)',
          background: 'var(--bg)',
          borderRadius: 'var(--radius)',
        }}>
          <Checkbox
            checked={understandsFn}
            onChange={setUnderstandsFn}
            label={t('consent.v2.checkbox.understand')}
          />
          <div style={{ height: 'var(--space-snug)' }} />
          <Checkbox
            checked={consentRodo}
            onChange={setConsentRodo}
            label={t('consent.v2.checkbox.rodo')}
          />
          <div style={{
            marginTop: 'var(--space-snug)',
            paddingLeft: 32,
            fontSize: 11,
            color: 'var(--text-3)',
            lineHeight: 1.45,
          }}>
            {t('consent.v2.rodo_note')}
          </div>
        </div>

        {/* ACCEPT BUTTON */}
        <button
          onClick={accept}
          disabled={!canAccept}
          style={{
            marginTop: 'var(--space-comfortable)',
            background: canAccept
              ? 'var(--brand-500)'
              : 'var(--text-3)',
            color: 'var(--surface)', border: 'none',
            borderRadius: 'var(--radius-comfortable)',
            padding: 'var(--space-snug) var(--space-comfortable)',
            fontSize: 15, fontWeight: 700,
            cursor: canAccept ? 'pointer' : 'not-allowed',
            minHeight: 52,
          }}
        >
          {t('consent.v2.accept_btn')}
        </button>

        {/* Privacy policy link */}
        <button
          onClick={() => {
            window.open('https://matiseekk-dot.github.io/babylog/privacy.html', '_blank')
          }}
          style={{
            marginTop: 'var(--space-snug)',
            background: 'none',
            border: 'none',
            color: 'var(--text-3)',
            fontSize: 12,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          {t('consent.v2.privacy_link')}
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space)' }}>
      <h2 style={{
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--text-2)',
        marginBottom: 'var(--space-snug)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-snug)' }}>
        {children}
      </div>
    </div>
  )
}

function Bullet({ icon, children }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-snug)', alignItems: 'flex-start' }}>
      <div style={{
        fontSize: 18, lineHeight: 1.2,
        flexShrink: 0, marginTop: 2,
        width: 24, textAlign: 'center',
      }}>{icon}</div>
      <div style={{
        fontSize: 13,
        color: 'var(--text)',
        lineHeight: 1.5,
      }}>{children}</div>
    </div>
  )
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-snug)',
      cursor: 'pointer',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
      />
      <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.45 }}>
        {label}
      </span>
    </label>
  )
}
