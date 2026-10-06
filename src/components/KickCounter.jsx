import React, { useEffect, useState } from 'react'
import { t, useLocale, getLocale } from '../i18n'
import { useFirestore } from '../hooks/useFirestore'
import { genId } from '../utils/helpers'
import { formatMinSec } from '../utils/pregnancy'
import { track } from '../utils/analytics'

/**
 * KickCounter — dziennik ruchów dziecka (v2.17.6). Prosty zapis, bez oceny:
 * sesja = start, liczba ruchów, koniec. Lista `kicks_{profileId}` =
 * [{ id, start, end, count }] (scalana po id, wspólna dla rodziców).
 * Stała informacja: słabsze lub rzadsze ruchy = kontakt ze szpitalem od razu.
 */
export default function KickCounter({ uid, profileId }) {
  useLocale()
  const [list, setList] = useFirestore(uid, `kicks_${profileId}`, [])
  const rows = (Array.isArray(list) ? list : []).filter(k => k && typeof k.start === 'number').sort((a, b) => b.start - a.start)
  const running = rows.find(k => k.end == null) || null
  const [now, setNow] = useState(Date.now())
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running?.id])

  const save = next => setList(next)
  const start = () => {
    track('kick_session_started')
    setNow(Date.now())
    save([{ id: genId(), start: Date.now(), end: null, count: 0 }, ...rows])
  }
  const tap = () => save(rows.map(k => (k.id === running.id ? { ...k, count: (k.count || 0) + 1 } : k)))
  const stop = () => save(rows.map(k => (k.id === running.id ? { ...k, end: Date.now() } : k)))
  const remove = id => { save(rows.filter(k => k.id !== id)); setConfirmId(null) }

  const fmt = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const secs = k => Math.max(0, Math.round(((k.end ?? now) - k.start) / 1000))
  const cell = { padding: '10px 8px', fontSize: 14, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }
  const head = { ...cell, fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4 }

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 16px' }}>
        {running ? (
          <>
            <div aria-live="polite" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10 }}>
              {t('kicks.running', { count: running.count || 0, time: formatMinSec(secs(running)) })}
            </div>
            <button type="button" onClick={tap} style={{
              width: 200, height: 200, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--accent-500), #7B73D9)', color: '#fff',
              fontSize: 24, fontWeight: 800, boxShadow: '0 8px 28px rgba(83, 74, 183, 0.3)',
            }}>
              {t('kicks.tap')}
            </button>
            <button type="button" onClick={stop} style={{
              marginTop: 14, minHeight: 44, padding: '0 22px', borderRadius: 22, cursor: 'pointer',
              background: 'var(--surface)', border: '0.5px solid var(--border-med)', fontSize: 14, fontWeight: 700, color: 'var(--text)',
            }}>
              {t('kicks.stop')}
            </button>
          </>
        ) : (
          <button type="button" onClick={start} style={{
            width: 200, height: 200, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--brand-600), var(--brand-500))', color: '#fff',
            fontSize: 19, fontWeight: 800, padding: 24, boxShadow: '0 8px 28px rgba(15, 110, 86, 0.3)',
          }}>
            {t('kicks.start')}
          </button>
        )}
      </div>

      <div style={{ background: 'var(--info-50)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13, lineHeight: 1.5, color: 'var(--info-700)' }}>
        ℹ️ {t('kicks.info')}
      </div>

      {rows.length === 0 ? (
        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, textAlign: 'center', padding: '0 8px' }}>{t('kicks.empty')}</div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px 0', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t('contr.history')}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...head, textAlign: 'left' }}>{t('contr.col_time')}</th>
                <th style={{ ...head, textAlign: 'right' }}>{t('kicks.col_count')}</th>
                <th style={{ ...head, textAlign: 'right' }}>{t('kicks.col_duration')}</th>
                <th style={{ ...head, width: 44 }} aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map(k => (
                <tr key={k.id} style={{ borderTop: '0.5px solid var(--border)' }}>
                  <td style={cell}>{fmt.format(new Date(k.start))}</td>
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{k.count || 0}</td>
                  <td style={{ ...cell, textAlign: 'right', color: 'var(--text-2)' }}>{k.end == null ? '…' : formatMinSec(secs(k))}</td>
                  <td style={{ ...cell, padding: '4px 6px', textAlign: 'right' }}>
                    {confirmId === k.id ? (
                      <button type="button" onClick={() => remove(k.id)} style={{
                        background: 'var(--alert-50)', color: 'var(--alert-700)', border: 'none', borderRadius: 8,
                        fontSize: 12, fontWeight: 700, padding: '6px 8px', minHeight: 36, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>{t('contr.delete_confirm')}</button>
                    ) : (
                      <button type="button" aria-label={t('contr.delete_aria', { time: fmt.format(new Date(k.start)) })} onClick={() => setConfirmId(k.id)} style={{
                        background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 18, minWidth: 36, minHeight: 36, cursor: 'pointer',
                      }}>×</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
