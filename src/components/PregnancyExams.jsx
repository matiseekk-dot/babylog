import React, { useEffect } from 'react'
import { t, useLocale, getLocale } from '../i18n'
import { useFirestore } from '../hooks/useFirestore'
import { EXAM_PERIODS, EXAM_VISITS_NOTE, EXAMS_SOURCE } from '../data/pregnancyExamsPl'
import { addDays, pregnancyProgress, GESTATION_DAYS } from '../utils/pregnancy'
import { track } from '../utils/analytics'

/**
 * PregnancyExams — badania według polskiego standardu opieki okołoporodowej
 * (v2.17.3, tylko PL). Każde badanie do odhaczenia, przy okresie notatka
 * z wizyty (wyniki). Stan w `exams_{profileId}` = { [periodId:index]: true,
 * ['note:' + periodId]: tekst }, wspólny dla obojga rodziców.
 */
export default function PregnancyExams({ uid, profile }) {
  useLocale()
  const [state, setState] = useFirestore(uid, `exams_${profile.id}`, {})
  const data = state && typeof state === 'object' && !Array.isArray(state) ? state : {}
  const termDays = profile.termDays || GESTATION_DAYS
  const p = pregnancyProgress(profile.dueDate, new Date(), termDays)
  const lmp = addDays(profile.dueDate, -termDays)
  const fmt = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' })
  const dateOf = days => fmt.format(new Date(`${addDays(lmp, days)}T12:00:00`))

  useEffect(() => { track('exams_viewed') }, [])

  const toggle = key => setState({ ...data, [key]: !data[key] })
  const setNote = (id, text) => setState({ ...data, [`note:${id}`]: text.slice(0, 500) })
  const elapsed = p ? p.weeks * 7 + p.days : 0

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{EXAM_VISITS_NOTE}</div>
      {EXAM_PERIODS.map(per => {
        const startDay = per.startWeek * 7
        const endDay = per.endWeek * 7 + 6
        const now = elapsed >= startDay && elapsed <= endDay
        const past = elapsed > endDay
        const done = per.tests.filter((_, i) => data[`${per.id}:${i}`]).length
        return (
          <section key={per.id} aria-label={per.when} style={{
            background: 'var(--surface)', borderRadius: 14, padding: '12px 14px',
            border: now ? '2px solid var(--brand-500)' : '0.5px solid var(--border)',
            opacity: past && done === per.tests.length ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', flex: 1 }}>{per.when}</div>
              {now && <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: 'var(--brand-500)', borderRadius: 20, padding: '2px 8px' }}>{t('exams.now')}</span>}
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {per.startWeek === 0 ? t('exams.until', { date: dateOf(endDay) }) : `${dateOf(startDay)} · ${dateOf(endDay)}`}
              </span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 2 }}>
              {per.tests.map((test, i) => {
                const key = `${per.id}:${i}`
                return (
                  <li key={key}>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', cursor: 'pointer', fontSize: 14, lineHeight: 1.4, color: data[key] ? 'var(--text-3)' : 'var(--text)' }}>
                      <input type="checkbox" checked={!!data[key]} onChange={() => toggle(key)} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0, accentColor: 'var(--brand-500)' }} />
                      <span style={{ textDecoration: data[key] ? 'line-through' : 'none' }}>{test}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
            {(now || past || data[`note:${per.id}`]) && (
              <textarea
                className="form-input"
                rows={2}
                value={data[`note:${per.id}`] || ''}
                placeholder={t('exams.note_ph')}
                aria-label={`${t('exams.note_ph')}: ${per.when}`}
                onChange={e => setNote(per.id, e.target.value)}
                style={{ marginTop: 6, fontSize: 14, resize: 'vertical' }}
              />
            )}
          </section>
        )
      })}
      <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
        {t('exams.source', { source: EXAMS_SOURCE })}
      </div>
      <a href="https://skudev.pl/poradnik/badania-w-ciazy-harmonogram/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-600)' }}>
        📅 {t('exams.ics_link')}
      </a>
    </div>
  )
}
