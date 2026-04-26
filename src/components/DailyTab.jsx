import React, { useState, useEffect } from 'react'
import { t, useLocale } from '../i18n'
import FeedTab from './FeedTab'
import DiaperTab from './DiaperTab'

/**
 * DailyTab — container dla Karmień + Pieluch (sub-segmenty).
 *
 * v2.9.3: zastępuje osobne taby `feed` i `diaper` z bottom nav. Te dwa
 * use case'y są ze sobą blisko związane (codzienna rutyna niemowlęcia)
 * i mają sens jako jeden kontener z prostym segmented switcherem.
 *
 * Aktywny segment zachowywany w localStorage żeby nie resetować przy każdym
 * powrocie do tabu. Domyślnie 'feed', chyba że profil ma `visibleTabs.feed`
 * wyłączone — wtedy domyślnie 'diaper'.
 *
 * Jeśli oba segmenty są wyłączone w visibleTabs, App.jsx już wcześniej
 * przekierowuje na today (useEffect w guardzie).
 */

const STORAGE_KEY = 'babylog_daily_segment'

export default function DailyTab({ visibleTabs, ...sharedProps }) {
  useLocale()

  const feedAvailable = visibleTabs?.feed !== false
  const diaperAvailable = visibleTabs?.diaper !== false

  // v2.9.5: helper czytający segment z localStorage z fallbackiem.
  // Wywołany przy każdym mount (useEffect poniżej), żeby gdy user kliknął
  // stat tile "pieluchy" w Today (która zapisała 'diaper' do localStorage),
  // wejście na Feed tab pokazało segment Pieluchy nawet jeśli komponent
  // jest cache-owany przez React.
  const readStoredSegment = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'feed' && feedAvailable) return 'feed'
      if (stored === 'diaper' && diaperAvailable) return 'diaper'
    } catch {}
    return feedAvailable ? 'feed' : 'diaper'
  }

  const [segment, setSegment] = useState(readStoredSegment)

  // Mount-time sync: jeśli localStorage został zmieniony zewnętrznie
  // (np. TodayTab ustawił 'diaper' przed nawigacją), zaktualizuj state.
  useEffect(() => {
    const fresh = readStoredSegment()
    if (fresh !== segment) setSegment(fresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Jeśli aktywny segment został wyłączony w Settings podczas sesji,
  // przerzuć na drugi.
  useEffect(() => {
    if (segment === 'feed' && !feedAvailable && diaperAvailable) {
      setSegment('diaper')
    } else if (segment === 'diaper' && !diaperAvailable && feedAvailable) {
      setSegment('feed')
    }
  }, [feedAvailable, diaperAvailable, segment])

  const selectSegment = (seg) => {
    setSegment(seg)
    try { localStorage.setItem(STORAGE_KEY, seg) } catch {}
  }

  // Jeśli tylko jeden segment jest dostępny, nie pokazuj segmented control
  // (zaoszczędź vertical real-estate).
  const showSwitcher = feedAvailable && diaperAvailable

  return (
    <>
      {showSwitcher && (
        <SegmentedSwitcher
          segments={[
            { id: 'feed',   labelKey: 'daily.seg.feed',   emoji: '🍼' },
            { id: 'diaper', labelKey: 'daily.seg.diaper', emoji: '👶' },
          ]}
          active={segment}
          onSelect={selectSegment}
        />
      )}
      {segment === 'feed' && feedAvailable && <FeedTab {...sharedProps} />}
      {segment === 'diaper' && diaperAvailable && <DiaperTab {...sharedProps} />}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Reusable segmented switcher
// ────────────────────────────────────────────────────────────────────────────

export function SegmentedSwitcher({ segments, active, onSelect }) {
  return (
    <div style={{
      display: 'flex',
      gap: 'var(--space-tight)',
      padding: 'var(--space-tight)',
      margin: 'var(--space-snug) var(--space) var(--space-tight)',
      background: 'var(--gray-light)',
      borderRadius: 'var(--radius)',
    }}>
      {segments.map(seg => {
        const isActive = active === seg.id
        return (
          <button
            key={seg.id}
            type="button"
            onClick={() => onSelect(seg.id)}
            style={{
              flex: 1,
              minHeight: 36,
              padding: 'var(--space-tight) var(--space-snug)',
              background: isActive ? 'var(--surface)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-tight)',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--text)' : 'var(--text-2)',
              cursor: 'pointer',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-tight)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span style={{ fontSize: 14 }}>{seg.emoji}</span>
            <span>{t(seg.labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}
