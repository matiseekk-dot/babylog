import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { nowTime, todayDate, genId } from '../utils/helpers'
import Modal from './Modal'
import { SectionAlerts } from './AlertBanner'
import { toast, toastWithUndo } from './Toast'
import { t, useLocale } from '../i18n'

/**
 * Type buttons per toilet mode.
 *
 * Internal `label` values are STABLE English strings stored in Firestore,
 * never displayed directly to users — `displayLabel` is used in UI via t().
 *
 * This keeps old data readable even if user changes mode or language.
 */
function getTypesByMode(mode) {
  if (mode === 'potty') {
    return [
      { label:'Mokra',       displayLabel:t('diaper.wet'),         emoji:'💧', color:'#E6F1FB', textColor:'#0C447C' },
      { label:'Brudna',      displayLabel:t('diaper.dirty'),       emoji:'💩', color:'#FAEEDA', textColor:'#633806' },
      { label:'Nocnik-siku', displayLabel:t('diaper.potty_pee'),   emoji:'🚽', color:'#E1F5EE', textColor:'#085041' },
      { label:'Nocnik-kupa', displayLabel:t('diaper.potty_poo'),   emoji:'🚽', color:'#E1F5EE', textColor:'#085041' },
    ]
  }
  if (mode === 'toilet') {
    return [
      { label:'Siku',   displayLabel:t('diaper.toilet_pee'),  emoji:'💧', color:'#E6F1FB', textColor:'#0C447C' },
      { label:'Kupa',   displayLabel:t('diaper.toilet_poo'),  emoji:'💩', color:'#FAEEDA', textColor:'#633806' },
    ]
  }
  return [
    { label:'Mokra',   displayLabel:t('diaper.wet'),   emoji:'💧', color:'#E6F1FB', textColor:'#0C447C' },
    { label:'Brudna',  displayLabel:t('diaper.dirty'), emoji:'💩', color:'#FAEEDA', textColor:'#633806' },
    { label:'Obydwie', displayLabel:t('diaper.both'),  emoji:'🔄', color:'#EEEDFE', textColor:'#3C3489' },
  ]
}

const ALL_TYPES_MAP = {
  'Mokra':       { emoji:'💧', key:'diaper.wet' },
  'Brudna':      { emoji:'💩', key:'diaper.dirty' },
  'Obydwie':     { emoji:'🔄', key:'diaper.both' },
  'Nocnik-siku': { emoji:'🚽', key:'diaper.potty_pee' },
  'Nocnik-kupa': { emoji:'🚽', key:'diaper.potty_poo' },
  'Siku':        { emoji:'💧', key:'diaper.toilet_pee' },
  'Kupa':        { emoji:'💩', key:'diaper.toilet_poo' },
}

function displayType(typeLabel) {
  const entry = ALL_TYPES_MAP[typeLabel]
  return entry ? t(entry.key) : typeLabel
}

function displayEmoji(typeLabel) {
  const entry = ALL_TYPES_MAP[typeLabel]
  return entry ? entry.emoji : '👶'
}

export default function DiaperTab({uid, babyId, toiletMode = 'diapers', sectionAlerts = [], onNavigate, onDataChange }) {
  useLocale()
  const TYPES = getTypesByMode(toiletMode)
  const [logs, setLogs] = useFirestore(uid, `diaper_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ type: TYPES[0].label, time: nowTime(), date: todayDate(), note:'' })

  const today = todayDate()
  const todayLogs = logs.filter(l=>l.date===today).sort((a,b)=>b.time.localeCompare(a.time))

  const pee = todayLogs.filter(l =>
    l.type === 'Mokra' || l.type === 'Obydwie' ||
    l.type === 'Nocnik-siku' || l.type === 'Siku'
  ).length
  const poo = todayLogs.filter(l =>
    l.type === 'Brudna' || l.type === 'Obydwie' ||
    l.type === 'Nocnik-kupa' || l.type === 'Kupa'
  ).length

  // Potty training streak — only meaningful in potty mode
  const pottyStreak = (() => {
    if (toiletMode !== 'potty') return null
    const byDate = {}
    logs.forEach(l => {
      if (!byDate[l.date]) byDate[l.date] = { hadAccident: false, hadPotty: false }
      if (l.type === 'Mokra' || l.type === 'Brudna' || l.type === 'Obydwie') byDate[l.date].hadAccident = true
      if (l.type === 'Nocnik-siku' || l.type === 'Nocnik-kupa') byDate[l.date].hadPotty = true
    })
    let streak = 0
    const now = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0,10)
      if (!byDate[key]) continue
      if (byDate[key].hadAccident) break
      if (byDate[key].hadPotty) streak++
    }
    return streak
  })()

  const quickAdd = (type) => {
    const entry = { id: genId(), type, time: nowTime(), date: todayDate(), note:'' }
    setLogs([entry, ...logs])
    onDataChange?.()
    toast(`${t('common.saved')}: ${displayType(type)}`)
  }

  const add = () => {
    setLogs([{ id: genId(), ...form }, ...logs])
    setModal(false)
    setForm({ type: TYPES[0].label, time: nowTime(), date: todayDate(), note:'' })
    onDataChange?.()
    toast(t('diaper.toast.saved'))
  }

  const remove = (id) => {
    const removed = logs.find(l => l.id === id)
    if (!removed) return
    setLogs(logs.filter(l => l.id !== id))
    toastWithUndo(t('common.deleted'), () => setLogs(prev => [removed, ...prev]))
  }

  const titleKey = toiletMode === 'toilet' ? 'diaper.title_toilet'
                 : toiletMode === 'potty'  ? 'diaper.title_potty'
                 : 'diaper.title'
  const descKey = toiletMode === 'toilet' ? 'diaper.desc_toilet'
                : toiletMode === 'potty'  ? 'diaper.desc_potty'
                : 'diaper.desc'

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t(titleKey)}</div>
        <div className="section-desc">{t(descKey)}</div>
      </div>

      <SectionAlerts alerts={sectionAlerts} onAction={onNavigate} />

      {pottyStreak !== null && pottyStreak > 0 && (
        <div style={{
          margin:'10px 16px 0',
          padding:'10px 14px',
          background:'#E1F5EE',
          border:'1px solid #9FE1CB',
          borderRadius:12,
          display:'flex', alignItems:'center', gap:10,
        }}>
          <span style={{fontSize:22}}>🏆</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13, fontWeight:700, color:'#085041'}}>
              {t('diaper.potty_streak', { count: pottyStreak })}
            </div>
            <div style={{fontSize:11, color:'#0F6E56', marginTop:2}}>
              {t('diaper.potty_streak_desc')}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8, margin:'10px 16px 0' }}>
        {TYPES.map(type => (
          <button
            key={type.label}
            onClick={() => quickAdd(type.label)}
            style={{
              width:'100%', minHeight:64, border:'none', borderRadius:14,
              background:type.color, color:type.textColor,
              fontSize:16, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            }}
          >
            <span style={{fontSize:28}}>{type.emoji}</span>
            {type.displayLabel}
          </button>
        ))}
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="stat-val">{todayLogs.length}</div><div className="stat-lbl">{t('diaper.stat.total')}</div></div>
        <div className="stat-card"><div className="stat-val">{pee}</div><div className="stat-lbl">{t('diaper.stat.wet')}</div></div>
        <div className="stat-card"><div className="stat-val">{poo}</div><div className="stat-lbl">{t('diaper.stat.dirty')}</div></div>
      </div>

      <div className="card">
        <div className="card-header">{t('feed.today')}</div>
        {todayLogs.length === 0
          ? <div className="empty-state"><div className="empty-icon">👶</div><p>{t('diaper.empty')}</p></div>
          : todayLogs.map(l => (
              <div className="log-item" key={l.id}>
                <div className="log-icon">{displayEmoji(l.type)}</div>
                <div className="log-body">
                  <div className="log-name">{displayType(l.type)}</div>
                  {l.note && <div className="log-detail">{l.note}</div>}
                </div>
                <div className="log-time">{l.time}</div>
                <button onClick={()=>remove(l.id)} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
              </div>
            ))
        }
      </div>

      <button className="btn-add" onClick={() => { setForm(f=>({...f,time:nowTime(),date:todayDate()})); setModal(true) }}>
        {t('diaper.add_note')}
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title={t('diaper.modal.title')}>
        <div className="form-group">
          <label className="form-label">{t('common.type')}</label>
          <select className="form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            {TYPES.map(tp=><option key={tp.label} value={tp.label}>{tp.displayLabel}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t('common.time')}</label><input className="form-input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">{t('common.date')}</label><input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('diaper.modal.note')}</label>
          <input className="form-input" type="text" maxLength={200} value={form.note} placeholder={t('diaper.note_ph')} onChange={e=>setForm(f=>({...f,note:e.target.value}))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={add}>{t('common.save')}</button>
        </div>
      </Modal>
    </>
  )
}
