import React, { useState, useRef, useEffect } from 'react'
import { t, useLocale } from '../i18n'

/**
 * QuickAddFab — floating button do szybkiego logowania.
 *
 * v2.9.3: nowy główny shortcut. Wcześniej user musiał: tab → "+ Add" →
 * formularz (3 kliknięcia żeby zalogować karmienie). Teraz:
 *   - TAP    → bottom-sheet z 8 quick actions (jeden klik = wpis)
 *   - LONG-PRESS (500ms) → bezpośredni quick feed (smart breast suggestion)
 *   - Każdy item w menu też wykonuje wpis natychmiast — bez modali, bez navigacji
 *
 * Logika bezpośredniego logowania jest w App.jsx (gdzie są instancje
 * useFirestore), FAB tylko wywołuje callbacki. To pozwala FAB-owi pracować
 * nawet gdy aktywny tab jest np. Settings — wpis się utworzy w tle.
 *
 * Props:
 *   onQuickFeed(type, amount)    — natychmiastowy feed log
 *   onQuickDiaper(type)          — natychmiastowy diaper log
 *   onQuickTemp()                — open Health tab (wymaga input → otwiera modal)
 *   onQuickSleepStart()          — start drzemki (toggle timer)
 *   suggestedFeedType            — 'Pierś lewa' | 'Pierś prawa' | null
 *   sleepInProgress              — boolean — gdy true, sleep button = "Stop"
 *   toiletMode                   — 'diapers' | 'potty' | 'toilet'
 *   bottomOffset                 — px — odsuń od dolnej krawędzi (nad bottom nav)
 */
export default function QuickAddFab({
  onQuickFeed,
  onQuickDiaper,
  onQuickTemp,
  onQuickSleepStart,
  suggestedFeedType,
  sleepInProgress,
  toiletMode = 'diapers',
  bottomOffset = 80,
}) {
  useLocale()
  const [open, setOpen] = useState(false)
  const longPressTimerRef = useRef(null)
  const longPressFiredRef = useRef(false)
  const pointerDownTimeRef = useRef(0)

  // ── Long-press detection ──────────────────────────────────────────────────
  // v2.9.4: Android/TWA fix.
  //   - Pointer events tylko do detekcji long-press (timer)
  //   - onClick obsługuje sam tap (release < 500ms)
  //   - BEZ preventDefault na pointerdown — to blokowało emisję click
  //     w Android Webview i Samsung Internet
  //   - touch-action: manipulation (nie 'none') — pozwala native click
  //     przy zachowaniu blokady double-tap zoom
  const LONG_PRESS_MS = 500

  const handlePointerDown = () => {
    longPressFiredRef.current = false
    pointerDownTimeRef.current = Date.now()
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true
      // Vibrate jako haptic feedback (jeśli dostępne)
      try { if (navigator.vibrate) navigator.vibrate(50) } catch {}
      // Bezpośrednie quick feed: sugerowana pierś, bez ilości
      const type = suggestedFeedType || 'Pierś lewa'
      onQuickFeed?.(type, '15')
    }, LONG_PRESS_MS)
  }

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    // NIE wywołujemy setOpen tutaj — onClick to obsłuży
  }

  const handlePointerCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    longPressFiredRef.current = false
  }

  // onClick — main tap handler, fired po pointer release jeśli wewnątrz buttona.
  // Skoro long-press już strzelił feed log + vibrate, ignoruj click żeby
  // nie otwierać dodatkowo menu.
  const handleClick = () => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    setOpen(true)
  }

  // Cleanup timer at unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [])

  const close = () => setOpen(false)

  // Helper: wykonaj akcję i zamknij menu
  const act = (fn) => {
    close()
    // Drobny defer żeby animacja menu mogła się zacząć
    setTimeout(() => { fn?.() }, 50)
  }

  // ── Diaper options w zależności od toiletMode ─────────────────────────────
  const diaperOptions = (() => {
    if (toiletMode === 'toilet') {
      return [
        { key: 'Siku', emoji: '💧', labelKey: 'diaper.toilet_pee' },
        { key: 'Kupa', emoji: '💩', labelKey: 'diaper.toilet_poo' },
      ]
    }
    if (toiletMode === 'potty') {
      return [
        { key: 'Mokra',       emoji: '💧', labelKey: 'diaper.wet' },
        { key: 'Nocnik-siku', emoji: '🚽', labelKey: 'diaper.potty_pee' },
        { key: 'Nocnik-kupa', emoji: '🚽', labelKey: 'diaper.potty_poo' },
      ]
    }
    return [
      { key: 'Mokra',   emoji: '💧', labelKey: 'diaper.wet' },
      { key: 'Brudna',  emoji: '💩', labelKey: 'diaper.dirty' },
      { key: 'Obydwie', emoji: '🔄', labelKey: 'diaper.both' },
    ]
  })()

  return (
    <>
      {/* FAB button */}
      <button
        type="button"
        aria-label={t('fab.aria_label')}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        onClick={handleClick}
        // Disable native context menu na long-press (Android Webview/Chrome)
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'fixed',
          right: 16,
          bottom: bottomOffset,
          width: 56, height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)',
          color: '#fff',
          border: 'none',
          fontSize: 28, fontWeight: 300,
          cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(15, 110, 86, 0.32), 0 2px 4px rgba(0,0,0,0.08)',
          // v2.9.4: z-index 110 — wyżej niż bottom-nav (90) i niż backdrop (100)
          zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          // Disable highlight on tap
          WebkitTapHighlightColor: 'transparent',
          // v2.9.4: 'manipulation' zamiast 'none' — pozwala emisji click event
          // na Android Webview / Samsung Internet, blokując tylko double-tap
          // zoom (które i tak nie jest pożądane na FAB).
          touchAction: 'manipulation',
          userSelect: 'none',
          transition: 'transform 0.1s ease',
        }}
      >
        <span style={{ display: 'block', marginTop: -2 }}>+</span>
      </button>

      {/* Bottom sheet — quick actions */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={close}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.28)',
              zIndex: 100,
              animation: 'qaf-fade-in 0.18s ease-out',
            }}
          />
          {/* Sheet */}
          <div
            role="dialog"
            aria-label={t('fab.menu_title')}
            style={{
              position: 'fixed',
              left: 0, right: 0, bottom: 0,
              background: '#fff',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              zIndex: 101,
              padding: '14px 16px max(20px, env(safe-area-inset-bottom)) 16px',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.14)',
              animation: 'qaf-slide-up 0.22s ease-out',
              maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'rgba(0,0,0,0.16)',
              margin: '0 auto 14px',
            }} />

            <div style={{
              fontSize: 15, fontWeight: 800, color: 'var(--text)',
              marginBottom: 6, letterSpacing: '-0.01em',
            }}>
              {t('fab.menu_title')}
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.4,
            }}>
              {t('fab.menu_hint')}
            </div>

            {/* Karmienie */}
            <SheetSection title={t('fab.section.feed')}>
              <ActionTile
                emoji="🤱" labelKey="feed.quick.left" accent="#085041" bg="#E1F5EE"
                onClick={() => act(() => onQuickFeed?.('Pierś lewa', '15'))}
                highlighted={suggestedFeedType === 'Pierś lewa'}
              />
              <ActionTile
                emoji="🤱" labelKey="feed.quick.right" accent="#085041" bg="#E1F5EE"
                onClick={() => act(() => onQuickFeed?.('Pierś prawa', '15'))}
                highlighted={suggestedFeedType === 'Pierś prawa'}
              />
              <ActionTile
                emoji="🍼" labelKey="feed.quick.bottle" accent="#0C447C" bg="#E6F1FB"
                onClick={() => act(() => onQuickFeed?.('Butelka', '120'))}
              />
            </SheetSection>

            {/* Pieluchy */}
            <SheetSection title={t('fab.section.diaper')}>
              {diaperOptions.map(opt => (
                <ActionTile
                  key={opt.key}
                  emoji={opt.emoji}
                  labelKey={opt.labelKey}
                  accent="#0C447C" bg="#E6F1FB"
                  onClick={() => act(() => onQuickDiaper?.(opt.key))}
                />
              ))}
            </SheetSection>

            {/* Sen + Temp */}
            <SheetSection title={t('fab.section.other')}>
              <ActionTile
                emoji={sleepInProgress ? '⏹' : '😴'}
                labelKey={sleepInProgress ? 'fab.action.sleep_stop' : 'fab.action.sleep_start'}
                accent="#3C3489" bg="#EEEDFE"
                onClick={() => act(() => onQuickSleepStart?.())}
              />
              <ActionTile
                emoji="🌡️"
                labelKey="fab.action.temp"
                accent="#7A1F0C" bg="#FEE7DF"
                onClick={() => act(() => onQuickTemp?.())}
              />
            </SheetSection>

            {/* Hint o long-press */}
            <div style={{
              marginTop: 12,
              padding: '10px 12px',
              background: '#F7F7F5',
              borderRadius: 10,
              fontSize: 11,
              color: 'var(--text-3)',
              lineHeight: 1.5,
              textAlign: 'center',
            }}>
              💡 {t('fab.long_press_hint')}
            </div>

            {/* Cancel */}
            <button
              type="button"
              onClick={close}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: 10,
                background: 'transparent',
                color: 'var(--text-2)',
                border: '0.5px solid var(--border)',
                borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes qaf-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes qaf-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

function SheetSection({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        marginBottom: 6, paddingLeft: 2,
      }}>
        {title}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
      }}>
        {children}
      </div>
    </div>
  )
}

function ActionTile({ emoji, labelKey, accent, bg, onClick, highlighted }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: bg,
        border: highlighted ? `2px solid ${accent}` : 'none',
        borderRadius: 12,
        padding: '12px 8px',
        minHeight: 72,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 4,
        transition: 'transform 0.08s ease',
      }}
    >
      <div style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        textAlign: 'center', lineHeight: 1.2,
      }}>
        {t(labelKey)}
      </div>
    </button>
  )
}
