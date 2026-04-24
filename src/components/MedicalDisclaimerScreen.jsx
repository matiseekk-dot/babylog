import React, { useState, useEffect, useRef } from 'react'
import { t, useLocale } from '../i18n'

/**
 * MedicalDisclaimerScreen
 *
 * Obowiązkowy disclaimer medyczny przy pierwszym uruchomieniu aplikacji.
 * User MUSI zaakceptować żeby przejść dalej.
 *
 * Cel prawny:
 *  - Jasno zakomunikować że apka NIE jest wyrobem medycznym
 *  - Uzyskać świadomą zgodę usera że rozumie ograniczenia
 *  - Stworzyć zapis akceptacji (data + wersja disclaimera)
 *
 * Po akceptacji zapisuje w localStorage:
 *  - med_disclaimer_accepted: timestamp
 *  - med_disclaimer_version: wersja disclaimera (żeby wymusić re-accept
 *    przy zmianach prawnych)
 *
 * v2.7.2: Dodane przed launchem 4 maja 2026.
 */

export const DISCLAIMER_VERSION = '1.0'

function hasAcceptedDisclaimer() {
  try {
    const v = localStorage.getItem('med_disclaimer_version')
    const t = localStorage.getItem('med_disclaimer_accepted')
    return v === DISCLAIMER_VERSION && !!t
  } catch {
    return false
  }
}

function saveAcceptance() {
  try {
    localStorage.setItem('med_disclaimer_version', DISCLAIMER_VERSION)
    localStorage.setItem('med_disclaimer_accepted', new Date().toISOString())
  } catch {}
}

export function needsDisclaimer() {
  return !hasAcceptedDisclaimer()
}

export default function MedicalDisclaimerScreen({ onAccept }) {
  useLocale()
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [checkboxConfirmed, setCheckboxConfirmed] = useState(false)
  const scrollRef = useRef(null)

  // Check if content already fits without scrolling (tall devices / short content)
  // If so, consider user as having "seen all" — allow checkbox immediately.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const checkFit = () => {
      if (el.scrollHeight - el.clientHeight < 40) {
        setScrolledToBottom(true)
      }
    }
    checkFit()
    // Recheck on resize (orientation change)
    window.addEventListener('resize', checkFit)
    return () => window.removeEventListener('resize', checkFit)
  }, [])

  const handleScroll = (e) => {
    const el = e.target
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (atBottom) setScrolledToBottom(true)
  }

  const canAccept = scrolledToBottom && checkboxConfirmed

  const accept = () => {
    if (!canAccept) return
    saveAcceptance()
    // Log legal acceptance - for regulatory proof
    try {
      if (window.Sentry?.addBreadcrumb) {
        window.Sentry.addBreadcrumb({
          category: 'legal',
          message: 'Medical disclaimer accepted',
          data: { version: DISCLAIMER_VERSION, timestamp: new Date().toISOString() },
          level: 'info',
        })
      }
    } catch {}
    onAccept?.()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#fff',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
        background: '#FEF3EE',
      }}>
        <div style={{ fontSize: 34, marginBottom: 8, textAlign: 'center' }}>ℹ️</div>
        <h1 style={{
          fontSize: 20,
          fontWeight: 800,
          color: '#1a1a18',
          textAlign: 'center',
          marginBottom: 6,
          lineHeight: 1.25,
        }}>
          {t('disclaimer.title')}
        </h1>
        <p style={{
          fontSize: 13,
          color: '#5a5a56',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {t('disclaimer.subtitle')}
        </p>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
        }}
      >
        <DisclaimerSection
          title={t('disclaimer.s1.title')}
          body={t('disclaimer.s1.body')}
        />
        <DisclaimerSection
          title={t('disclaimer.s2.title')}
          body={t('disclaimer.s2.body')}
        />
        <DisclaimerSection
          title={t('disclaimer.s3.title')}
          body={t('disclaimer.s3.body')}
        />
        <DisclaimerSection
          title={t('disclaimer.s4.title')}
          body={t('disclaimer.s4.body')}
        />

        <div style={{
          background: '#FEE7DF',
          border: '1px solid #E05D44',
          borderRadius: 10,
          padding: 14,
          marginTop: 20,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#7A1F0C', marginBottom: 6 }}>
            🚨 {t('disclaimer.emergency.title')}
          </div>
          <div style={{ fontSize: 13, color: '#7A1F0C', lineHeight: 1.5 }}>
            {t('disclaimer.emergency.body')}
          </div>
        </div>

        {!scrolledToBottom && (
          <div style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#9a9a94',
            marginTop: 12,
            fontStyle: 'italic',
          }}>
            ↓ {t('disclaimer.scroll_hint')}
          </div>
        )}
      </div>

      {/* Acceptance footer */}
      <div style={{
        padding: '16px 24px 20px',
        borderTop: '0.5px solid rgba(0,0,0,0.08)',
        background: '#F7F7F5',
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 14,
          cursor: scrolledToBottom ? 'pointer' : 'not-allowed',
          opacity: scrolledToBottom ? 1 : 0.5,
        }}>
          <input
            type="checkbox"
            checked={checkboxConfirmed}
            onChange={(e) => setCheckboxConfirmed(e.target.checked)}
            disabled={!scrolledToBottom}
            style={{
              width: 20,
              height: 20,
              marginTop: 2,
              flexShrink: 0,
              cursor: scrolledToBottom ? 'pointer' : 'not-allowed',
            }}
          />
          <span style={{ fontSize: 13, color: '#1a1a18', lineHeight: 1.5 }}>
            {t('disclaimer.checkbox')}
          </span>
        </label>

        <button
          onClick={accept}
          disabled={!canAccept}
          style={{
            width: '100%',
            padding: 14,
            minHeight: 52,
            background: canAccept ? '#D85A30' : '#c0c0bc',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: canAccept ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
        >
          {t('disclaimer.accept_btn')}
        </button>

        <button
          onClick={() => {
            // User rejects — close app if in TWA, else show info
            if (window.close) window.close()
            // Fallback: reload page (user zostanie przy disclaimer screen)
            setTimeout(() => {
              alert(t('disclaimer.reject_info'))
            }, 200)
          }}
          style={{
            width: '100%',
            padding: 10,
            marginTop: 8,
            background: 'transparent',
            color: '#5a5a56',
            border: 'none',
            fontSize: 12,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {t('disclaimer.reject_btn')}
        </button>
      </div>
    </div>
  )
}

function DisclaimerSection({ title, body }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{
        fontSize: 14,
        fontWeight: 700,
        color: '#1a1a18',
        marginBottom: 6,
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: 13,
        color: '#3a3a36',
        lineHeight: 1.55,
      }}>
        {body}
      </p>
    </div>
  )
}
