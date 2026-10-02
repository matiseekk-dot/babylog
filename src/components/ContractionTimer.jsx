import React, { useEffect, useState } from 'react'
import { t, useLocale, getLocale } from '../i18n'
import { useFirestore } from '../hooks/useFirestore'
import { genId } from '../utils/helpers'
import { withContractionTimes, contractionStats, formatMinSec } from '../utils/pregnancy'
import { trackContractionTimerUsed } from '../utils/analytics'

/**
 * ContractionTimer — licznik skurczy w trybie ciąży (v2.17.0).
 *
 * Jeden duży przycisk: dotknięcie na początku skurczu i na końcu. Wpisy
 * { id, start, end } w `contractions_{profileId}` (lista scalana po id, więc
 * na wspólnym koncie partner widzi to samo). Pokazujemy tylko liczby: czas
 * trwania, odstępy, podsumowanie godziny. Kiedy jechać do szpitala, mówi
 * położna; tu jest tylko stała informacja o objawach, z którymi się nie czeka.
 *
 * Ekran nie gaśnie, dopóki licznik jest otwarty (Wake Lock), bo używa się go
 * z telefonem w ręku przez długi czas.
 */
export default function ContractionTimer({ uid, profileId }) {
  useLocale()
  const [list, setList] = useFirestore(uid, `contractions_${profileId}`, [])
  const [now, setNow] = useState(Date.now())
  const [confirmId, setConfirmId] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const rows = withContractionTimes(Array.isArray(list) ? list : [])
  const running = rows.find(c => c.end == null) || null
  const last = rows[0] || null
  const stats = contractionStats(rows, now)

  // Odświeżanie co sekundę: trwający skurcz i "od początku ostatniego".
  useEffect(() => {
    if (!last) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [last?.id])

  // Ekran nie gaśnie podczas liczenia skurczy (gdzie przeglądarka pozwala).
  useEffect(() => {
    let lock = null
    let cancelled = false
    const acquire = async () => {
      try {
        if (document.visibilityState === 'visible' && navigator.wakeLock) {
          lock = await navigator.wakeLock.request('screen')
          if (cancelled) lock.release().catch(() => {})
        }
      } catch {}
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      lock?.release().catch(() => {})
    }
  }, [])

  const toggle = () => {
    const ts = Date.now()
    setNow(ts)
    if (running) {
      setList(rows.map(({ durationSec, intervalSec, ...c }) => (c.id === running.id ? { ...c, end: ts } : c)))
    } else {
      trackContractionTimerUsed()
      const clean = rows.map(({ durationSec, intervalSec, ...c }) => c)
      setList([{ id: genId(), start: ts, end: null }, ...clean])
    }
  }

  const remove = (id) => {
    setList(rows.filter(c => c.id !== id).map(({ durationSec, intervalSec, ...c }) => c))
    setConfirmId(null)
  }

  const fmtTime = ts => new Intl.DateTimeFormat(getLocale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(ts))
  const runningSec = running ? Math.max(0, Math.round((now - running.start) / 1000)) : 0
  const sinceLastSec = !running && last ? Math.round((now - last.start) / 1000) : null

  const cell = { padding: '10px 8px', fontSize: 14, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }
  const head = { ...cell, fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4 }

  return (
    <div style={{ padding: '4px 16px 24px' }}>
      {/* Przycisk główny */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 18px' }}>
        <div style={{ minHeight: 44, textAlign: 'center', marginBottom: 12 }} aria-live="polite">
          {running ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--alert-700)' }}>{t('contr.running')}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                {formatMinSec(runningSec)}
              </div>
            </>
          ) : sinceLastSec != null ? (
            <div style={{ fontSize: 14, color: 'var(--text-2)', paddingTop: 12 }}>
              {t('contr.since_last', { time: formatMinSec(sinceLastSec) })}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggle}
          style={{
            width: 200, height: 200, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: running
              ? 'linear-gradient(135deg, var(--alert-500), #E8805C)'
              : 'linear-gradient(135deg, var(--brand-600), var(--brand-500))',
            color: '#fff', fontSize: 19, fontWeight: 800, lineHeight: 1.25, padding: 24,
            boxShadow: running ? '0 8px 28px rgba(216, 90, 48, 0.35)' : '0 8px 28px rgba(15, 110, 86, 0.3)',
          }}
        >
          {running ? t('contr.stop') : t('contr.start')}
        </button>
      </div>

      {/* Ostatnia godzina */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14,
        }}>
          {[
            [t('contr.stats_count'), String(stats.count)],
            [t('contr.stats_duration'), formatMinSec(stats.avgDurationSec)],
            [t('contr.stats_interval'), stats.avgIntervalSec != null ? formatMinSec(stats.avgIntervalSec) : '·'],
          ].map(([label, value]) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12,
              padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
            {t('contr.stats_title')}
          </div>
        </div>
      )}

      {/* Stała informacja: kiedy nie czekać */}
      <div style={{
        background: 'var(--info-50)', borderRadius: 12, padding: '12px 14px', marginBottom: 16,
        fontSize: 13, lineHeight: 1.5, color: 'var(--info-700)',
      }}>
        ℹ️ {t('contr.info')}
      </div>

      {/* Historia */}
      {rows.length === 0 ? (
        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, textAlign: 'center', padding: '0 8px' }}>
          {t('contr.empty')}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px 0', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t('contr.history')}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...head, textAlign: 'left' }}>{t('contr.col_time')}</th>
                <th style={{ ...head, textAlign: 'right' }}>{t('contr.col_duration')}</th>
                <th style={{ ...head, textAlign: 'right' }}>{t('contr.col_interval')}</th>
                <th style={{ ...head, width: 44 }} aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 40).map(c => (
                <tr key={c.id} style={{ borderTop: '0.5px solid var(--border)' }}>
                  <td style={cell}>{fmtTime(c.start)}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    {c.durationSec != null ? formatMinSec(c.durationSec) : '…'}
                  </td>
                  <td style={{ ...cell, textAlign: 'right', color: 'var(--text-2)' }}>
                    {c.intervalSec != null ? formatMinSec(c.intervalSec) : ''}
                  </td>
                  <td style={{ ...cell, padding: '4px 6px', textAlign: 'right' }}>
                    {confirmId === c.id ? (
                      <button type="button" onClick={() => remove(c.id)} style={{
                        background: 'var(--alert-50)', color: 'var(--alert-700)', border: 'none',
                        borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '6px 8px', cursor: 'pointer',
                        minHeight: 36, whiteSpace: 'nowrap',
                      }}>
                        {t('contr.delete_confirm')}
                      </button>
                    ) : (
                      <button type="button" onClick={() => setConfirmId(c.id)}
                        aria-label={t('contr.delete_aria', { time: fmtTime(c.start) })}
                        style={{
                          background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 18,
                          cursor: 'pointer', minWidth: 36, minHeight: 36,
                        }}>
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: '0.5px solid var(--border)', padding: 8, textAlign: 'center' }}>
            <button type="button"
              onClick={() => {
                if (!confirmClear) { setConfirmClear(true); return }
                setList([])
                setConfirmClear(false)
              }}
              style={{
                background: confirmClear ? 'var(--alert-50)' : 'none', border: 'none', borderRadius: 8,
                color: confirmClear ? 'var(--alert-700)' : 'var(--text-3)', fontSize: 13, fontWeight: 600,
                padding: '8px 12px', cursor: 'pointer',
              }}>
              {confirmClear ? t('contr.clear_confirm') : t('contr.clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
