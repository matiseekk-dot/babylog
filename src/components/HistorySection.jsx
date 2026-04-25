import React, { useState, useMemo } from 'react'
import { t, useLocale } from '../i18n'
import { formatDate, todayDate, dateYMD } from '../utils/helpers'

/**
 * HistorySection — reusable collapsible section pokazująca HISTORIĘ wpisów.
 *
 * Pokazuje wpisy SPRZED dzisiaj (dzisiejsze wpisy są już pokazane nad tym
 * komponentem, w sekcji "Dzisiaj"). Grupuje po dacie, pokazuje podsumowanie
 * w headerze (liczba wpisów). Domyślnie zwinięta — rodzic klika żeby zobaczyć.
 *
 * Zakres: pokazujemy okna 7-dniowe, z przyciskiem "Pokaż starsze" który
 * dodaje kolejne 7 dni. Zapobiega overloadowi UI dla kont z długą historią.
 *
 * Props:
 *   - logs: pełna lista wpisów (będzie odfiltrowana do wczoraj wstecz)
 *   - renderItem: (log) => ReactNode — renderer pojedynczego wpisu
 *   - summarize: (logs) => string — opcjonalne podsumowanie dzienne,
 *                                     np. "6 karmień · 360 ml"
 *   - onDelete: (log) => void — opcjonalny handler usuwania
 *                                (wpisy >1 dzień temu dostają potwierdzenie)
 *   - dateKey: nazwa pola z datą (default: 'date')
 *   - initialDays: ile dni na pierwszy rzut (default: 7)
 */
export default function HistorySection({
  logs,
  renderItem,
  summarize,
  onDelete,
  dateKey = 'date',
  initialDays = 7,
}) {
  useLocale()
  const [expanded, setExpanded] = useState(false)
  const [windowDays, setWindowDays] = useState(initialDays)
  // Inline potwierdzenie dla wpisów >1 dzień temu — zastępuje window.confirm()
  // (iOS PWA/TWA blokuje/brzydko renderuje natywne confirm)
  const [pendingDelete, setPendingDelete] = useState(null) // { log, days }

  // Tylko wpisy z WCZORAJ i wcześniej (dzisiejsze są nad tym komponentem)
  const today = todayDate()

  // Podział wpisów na: w widocznym oknie (ostatnie N dni od dziś) vs starsze
  const { inWindow, olderCount, groupedByDate } = useMemo(() => {
    const cutoffWindow = new Date()
    cutoffWindow.setDate(cutoffWindow.getDate() - windowDays)
    const cutoffWindowStr = dateYMD(cutoffWindow)

    const beforeToday = (logs || []).filter(l => {
      const d = l[dateKey]
      return d && d < today
    })

    const inWindow = beforeToday.filter(l => l[dateKey] >= cutoffWindowStr)
    const olderCount = beforeToday.length - inWindow.length

    // Grupowanie po dacie, malejąco
    const groups = {}
    inWindow.forEach(l => {
      const d = l[dateKey]
      if (!groups[d]) groups[d] = []
      groups[d].push(l)
    })
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))
    const groupedByDate = sortedDates.map(date => ({ date, entries: groups[date] }))

    return { inWindow, olderCount, groupedByDate }
  }, [logs, windowDays, dateKey, today])

  const totalInWindow = inWindow.length

  // Pusty stan — nie renderujemy w ogóle sekcji jeśli brak historycznych wpisów
  if (totalInWindow === 0 && olderCount === 0) return null

  // Etykieta dnia względna (Wczoraj / 3 dni temu / 20 kwi)
  // Liczymy dni przez porównanie YMD stringów a nie timestampów —
  // inaczej o 01:00 lokalnie wpis z wczoraj jest ~10h starszy (Math.floor(0.96)=0)
  // i nie dostaje labela "Wczoraj", tylko pełną datę.
  const dayLabel = (dateStr) => {
    const todayStr = todayDate()
    const [ty, tm, td] = todayStr.split('-').map(Number)
    const [ey, em, ed] = dateStr.split('-').map(Number)
    const todayMid = new Date(ty, tm - 1, td)
    const entryMid = new Date(ey, em - 1, ed)
    const diffDays = Math.round((todayMid - entryMid) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return t('history.yesterday')
    if (diffDays >= 2 && diffDays <= 6) return t('history.days_ago', { days: diffDays })
    return formatDate(dateStr)
  }

  const handleDelete = (log) => {
    if (!onDelete) return
    // Dni liczone przez YMD strings (patrz dayLabel wyżej)
    const dateStr = log[dateKey]
    if (!dateStr) return onDelete(log)
    const todayStr = todayDate()
    const [ty, tm, td] = todayStr.split('-').map(Number)
    const [ey, em, ed] = dateStr.split('-').map(Number)
    const todayMid = new Date(ty, tm - 1, td)
    const entryMid = new Date(ey, em - 1, ed)
    const diffDays = Math.round((todayMid - entryMid) / (1000 * 60 * 60 * 24))
    // Dla wpisów > 1 dzień: pokaż inline banner potwierdzenia zamiast confirm()
    if (diffDays > 1) {
      setPendingDelete({ log, days: diffDays })
      return
    }
    onDelete(log)
  }

  const confirmPendingDelete = () => {
    if (pendingDelete?.log) onDelete(pendingDelete.log)
    setPendingDelete(null)
  }

  const cancelPendingDelete = () => setPendingDelete(null)

  return (
    <div className="card" style={{ margin: '12px 16px 0' }}>
      {pendingDelete && (
        <div
          role="alertdialog"
          style={{
            padding: '12px 14px',
            background: '#FAECE7',
            borderBottom: '0.5px solid #F0997B',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 13, color: '#712B13', lineHeight: 1.4 }}>
            {t('history.confirm_old_delete', { days: pendingDelete.days })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={confirmPendingDelete}
              style={{
                flex: 1, minHeight: 40, padding: '8px 12px',
                background: '#993C1D', color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {t('common.delete_aria')}
            </button>
            <button
              onClick={cancelPendingDelete}
              style={{
                flex: 1, minHeight: 40, padding: '8px 12px',
                background: 'transparent', color: '#5a5a56',
                border: '0.5px solid rgba(0,0,0,0.15)',
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
      {/* Header — klik rozwija/zwija */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          minHeight: 48,
        }}
        aria-expanded={expanded}
      >
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-2)',
          letterSpacing: 0.2,
        }}>
          {t('history.header.summary', { days: windowDays, count: totalInWindow })}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>
          {expanded ? t('history.collapse') : t('history.expand')} {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Body — pokazany tylko gdy expanded */}
      {expanded && (
        <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }}>
          {groupedByDate.length === 0 ? (
            <div style={{
              padding: '20px 14px',
              fontSize: 13,
              color: 'var(--text-3)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              {t('history.empty', { days: windowDays })}
            </div>
          ) : (
            groupedByDate.map(({ date, entries }) => (
              <div key={date} style={{ borderTop: '0.5px solid rgba(0,0,0,0.04)' }}>
                {/* Day header */}
                <div style={{
                  padding: '8px 14px',
                  background: '#fafaf8',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span>{dayLabel(date)}</span>
                  {summarize && (
                    <span style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>
                      {summarize(entries)}
                    </span>
                  )}
                </div>
                {/* Entries */}
                {entries.map((log, idx) => (
                  <div
                    key={log.id || `${date}-${idx}`}
                    style={{ position: 'relative' }}
                  >
                    {renderItem(log, { onDelete: onDelete ? () => handleDelete(log) : undefined })}
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Show older button */}
          {olderCount > 0 ? (
            <button
              onClick={() => setWindowDays(d => d + 7)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                borderTop: '0.5px solid rgba(0,0,0,0.05)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--green, #1D9E75)',
                minHeight: 44,
              }}
            >
              {t('history.show_older', { count: olderCount })}
            </button>
          ) : totalInWindow > 0 ? (
            <div style={{
              padding: '10px 14px',
              borderTop: '0.5px solid rgba(0,0,0,0.05)',
              fontSize: 11,
              color: 'var(--text-3)',
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
              {t('history.no_older')}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
