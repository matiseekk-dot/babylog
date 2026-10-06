import React, { useState } from 'react'
import { t, useLocale, getLocale } from '../i18n'
import { genId } from '../utils/helpers'
import { listFor, listProgress } from '../data/pregnancyLists'

/**
 * PregnancyChecklist — torba do szpitala albo wyprawka do odhaczenia (v2.17.6).
 * Stan wspólny dla obojga rodziców: `lists_{profileId}` =
 *   { bag: { [itemId]: true }, layette: {...}, custom: { bag: [{ id, text, done }], layette: [...] } }
 * Props: listId ('bag' | 'layette'), state, setState (z useFirestore w PregnancyScreen)
 */
export default function PregnancyChecklist({ listId, state, setState }) {
  useLocale()
  const locale = getLocale()
  const data = state && typeof state === 'object' && !Array.isArray(state) ? state : {}
  const checked = data[listId] || {}
  const custom = data.custom?.[listId] || []
  const groups = listFor(listId, locale)
  const { done, total } = listProgress(listId, locale, data)
  const [text, setText] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  const toggle = id => setState({ ...data, [listId]: { ...checked, [id]: !checked[id] } })
  const setCustom = next => setState({ ...data, custom: { ...(data.custom || {}), [listId]: next } })
  const add = () => {
    const v = text.trim().slice(0, 80)
    if (!v) return
    setCustom([...custom, { id: genId(), text: v, done: false }])
    setText('')
  }

  const row = (key, label, on, onToggle, extra) => (
    <li key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', cursor: 'pointer', fontSize: 14, lineHeight: 1.4, color: on ? 'var(--text-3)' : 'var(--text)' }}>
        <input type="checkbox" checked={!!on} onChange={onToggle} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0, accentColor: 'var(--brand-500)' }} />
        <span style={{ textDecoration: on ? 'line-through' : 'none' }}>{label}</span>
      </label>
      {extra}
    </li>
  )

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}
          style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--gray-light)', overflow: 'hidden' }}>
          <div style={{ width: `${total ? Math.round(done / total * 100) : 0}%`, height: '100%', background: 'var(--brand-500)' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>{t('lists.progress', { done, total })}</span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>👫 {t('lists.together')}</div>

      {listId === 'layette' && (
        <div style={{ background: 'var(--info-50)', color: 'var(--info-700)', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.5 }}>
          🛏️ {t('lists.safe_sleep')}
        </div>
      )}

      {groups.map(g => (
        <section key={g.id} aria-label={g.title} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{g.title}</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
            {g.items.map(it => row(it.id, it.text, checked[it.id], () => toggle(it.id)))}
          </ul>
        </section>
      ))}

      <section aria-label={t('lists.custom')} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '10px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{t('lists.custom')}</div>
        {custom.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
            {custom.map(c => row(c.id, c.text, c.done,
              () => setCustom(custom.map(x => (x.id === c.id ? { ...x, done: !x.done } : x))),
              confirmId === c.id ? (
                <button type="button" onClick={() => { setCustom(custom.filter(x => x.id !== c.id)); setConfirmId(null) }} style={{
                  background: 'var(--alert-50)', color: 'var(--alert-700)', border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, padding: '6px 8px', minHeight: 36, cursor: 'pointer',
                }}>{t('contr.delete_confirm')}</button>
              ) : (
                <button type="button" aria-label={t('lists.remove_aria', { item: c.text })} onClick={() => setConfirmId(c.id)} style={{
                  background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 18, minWidth: 36, minHeight: 36, cursor: 'pointer',
                }}>×</button>
              )))}
          </ul>
        )}
        <form onSubmit={e => { e.preventDefault(); add() }} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input className="form-input" type="text" maxLength={80} value={text} placeholder={t('lists.add_ph')}
            aria-label={t('lists.add_ph')} onChange={e => setText(e.target.value)} style={{ fontSize: 15, flex: 1 }} />
          <button type="submit" className="btn-primary" style={{ padding: '0 14px', minHeight: 44 }}>{t('lists.add')}</button>
        </form>
      </section>
    </div>
  )
}
