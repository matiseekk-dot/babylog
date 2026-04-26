import React, { useState, useEffect } from 'react'
import { t, useLocale } from '../i18n'
import { addBreadcrumb } from '../sentry'

/**
 * OnboardingTipsBanner
 *
 * v2.9.2: trzy tipy edukacyjne, które wcześniej były slide'ami w onboardingu
 * (v2.7.x–v2.8.x). Przeniesione na dashboard po onboarding rewrite żeby user
 * dostał natychmiastową wartość (dodanie pierwszego wpisu) zamiast gapić się
 * w trzy karuzelowe ekrany przed setupem.
 *
 * Pokazuje się TYLKO jeśli:
 *   - localStorage 'babylog_onb_tips_dismissed' nie ustawione
 *
 * Sterowanie:
 *   - jedna karta na raz, "Dalej →" (aktualny + 1) / "Rozumiem, zamknij"
 *     (na ostatniej karcie ALBO X w prawym górnym rogu).
 *   - Po dismiss flag jest ustawiony na zawsze, banner więcej się nie pokaże.
 *
 * UWAGA: jeśli kiedyś dodajesz onboarding reset w Settings, też wymaż klucz
 * 'babylog_onb_tips_dismissed' z localStorage żeby user zobaczył znowu.
 */

const TIPS = [
  { emoji: '📋', accentColor: '#1D9E75', accentLight: '#E1F5EE',
    titleKey: 'tips.slide1.title', bodyKey: 'tips.slide1.body', noteKey: null },
  { emoji: '🔍', accentColor: '#185FA5', accentLight: '#E6F1FB',
    titleKey: 'tips.slide2.title', bodyKey: 'tips.slide2.body', noteKey: 'tips.slide2.note' },
  { emoji: '💡', accentColor: '#BA7517', accentLight: '#FAEEDA',
    titleKey: 'tips.slide3.title', bodyKey: 'tips.slide3.body', noteKey: 'tips.slide3.note' },
]

const STORAGE_KEY = 'babylog_onb_tips_dismissed'

function hasBeenDismissed() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' }
  catch { return false }
}

function markDismissed() {
  try { localStorage.setItem(STORAGE_KEY, '1') }
  catch (e) { addBreadcrumb('storage', 'tips-dismiss-failed', { msg: e?.message || 'unknown' }) }
}

export default function OnboardingTipsBanner() {
  useLocale()
  const [dismissed, setDismissed] = useState(() => hasBeenDismissed())
  const [idx, setIdx] = useState(0)

  // Defensywne — gdyby flag pojawił się asynchronicznie (multi-tab)
  useEffect(() => {
    if (hasBeenDismissed()) setDismissed(true)
  }, [])

  if (dismissed) return null

  const tip = TIPS[idx]
  const isLast = idx === TIPS.length - 1

  const next = () => {
    if (isLast) return dismiss()
    setIdx(i => i + 1)
  }

  const dismiss = () => {
    markDismissed()
    setDismissed(true)
  }

  return (
    <div style={{
      margin: '12px 16px',
      padding: '16px 16px 14px',
      background: tip.accentLight,
      border: `1px solid ${tip.accentColor}33`,
      borderRadius: 16,
      position: 'relative',
      transition: 'background 0.25s ease',
    }}>
      {/* Close (X) — dismiss całkowicie, nie wraca następnym razem */}
      <button
        onClick={dismiss}
        aria-label={t('tips.dismiss_aria')}
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 28, height: 28,
          background: 'transparent', border: 'none',
          color: tip.accentColor, fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.65,
        }}
      >×</button>

      {/* Top row: emoji + title */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, paddingRight: 28 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          boxShadow: `0 2px 6px ${tip.accentColor}22`,
        }}>
          {tip.emoji}
        </div>
        <div style={{
          fontSize: 15, fontWeight: 800, color: '#1a1a18',
          lineHeight: 1.25, letterSpacing: '-0.01em',
          whiteSpace: 'pre-line',
        }}>
          {t(tip.titleKey)}
        </div>
      </div>

      {/* Body */}
      <div style={{ fontSize: 13, color: '#3a3a36', lineHeight: 1.5, marginBottom: 8 }}>
        {t(tip.bodyKey)}
      </div>

      {tip.noteKey && (
        <div style={{
          fontSize: 12, fontWeight: 700, color: tip.accentColor,
          marginBottom: 10, lineHeight: 1.4,
        }}>
          {t(tip.noteKey)}
        </div>
      )}

      {/* Bottom row: dots + button */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {TIPS.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
              background: i === idx ? tip.accentColor : 'rgba(0,0,0,0.18)',
              transition: 'width 0.2s ease, background 0.2s ease',
            }} />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          style={{
            background: tip.accentColor,
            color: '#fff',
            border: 'none', borderRadius: 10,
            padding: '8px 14px', minHeight: 36,
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}
        >
          {isLast ? t('tips.cta_finish') : t('tips.cta_next')}
        </button>
      </div>
    </div>
  )
}
