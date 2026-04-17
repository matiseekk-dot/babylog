import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { nowTime, todayDate, genId } from '../utils/helpers'
import Modal from './Modal'
import { SectionAlerts } from './AlertBanner'
import { toast } from './Toast'
import { t, useLocale } from '../i18n'

function getTypes() {
  return [
    { label:'Mokra',   displayLabel:t('diaper.wet'),   emoji:'💧', color:'#E6F1FB', textColor:'#0C447C' },
    { label:'Brudna',  displayLabel:t('diaper.dirty'), emoji:'💩', color:'#FAEEDA', textColor:'#633806' },
    { label:'Obydwie', displayLabel:t('diaper.both'),  emoji:'🔄', color:'#EEEDFE', textColor:'#3C3489' },
  ]
}

export default function DiaperTab({uid, babyId, sectionAlerts = [], onNavigate, onDataChange }) {
  useLocale()
  const TYPES = getTypes()
  const [logs, setLogs] = useFirestore(uid, `diaper_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ type:'Mokra', time: nowTime(), date: todayDate(), note:'' })

  const today = todayDate()
  const todayLogs = logs.filter(l=>l.date===today).sort((a,b)=>b.time.localeCompare(a.time))
  const wet = todayLogs.filter(l=>l.type==='Mokra'||l.type==='Obydwie').length
  const dirty = todayLogs.filter(l=>l.type==='Brudna'||l.type==='Obydwie').length

  const quickAdd = (type) => {
    const entry = { id: genId(), type, time: nowTime(), date: todayDate(), note:'' }
    setLogs([entry, ...logs])
    onDataChange?.()
    toast(`${t('common.saved')}: ${type}`)
  }

  const add = () => {
    setLogs([{ id: genId(), ...form }, ...logs])
    setModal(false)
    setForm({ type:'Mokra', time: nowTime(), date: todayDate(), note:'' })
    onDataChange?.()
    toast(t('diaper.toast.saved'))
  }

  const remove = (id) => setLogs(logs.filter(l=>l.id!==id))

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('diaper.title')}</div>
        <div className="section-desc">{t('diaper.desc')}</div>
      </div>

      <SectionAlerts alerts={sectionAlerts} onAction={onNavigate} />

      {/* Duże przyciski — łatwe do trafienia mokrymi rękoma */}
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
        <div className="stat-card"><div className="stat-val">{wet}</div><div className="stat-lbl">{t('diaper.stat.wet')}</div></div>
        <div className="stat-card"><div className="stat-val">{dirty}</div><div className="stat-lbl">{t('diaper.stat.dirty')}</div></div>
      </div>

      <div className="card">
        <div className="card-header">{t('feed.today')}</div>
        {todayLogs.length === 0
          ? <div className="empty-state"><div className="empty-icon">👶</div><p>{t('diaper.empty')}</p></div>
          : todayLogs.map(l => {
              const typ = TYPES.find(x=>x.label===l.type) || TYPES[0]
              return (
                <div className="log-item" key={l.id}>
                  <div className="log-icon">{typ.emoji}</div>
                  <div className="log-body">
                    <div className="log-name">{l.type}</div>
                    {l.note && <div className="log-detail">{l.note}</div>}
                  </div>
                  <div className="log-time">{l.time}</div>
                  <button onClick={()=>remove(l.id)} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
                </div>
              )
            })
        }
      </div>

      <button className="btn-add" onClick={() => { setForm(f=>({...f,time:nowTime(),date:todayDate()})); setModal(true) }}>
        {t('diaper.add_note')}
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title={t('diaper.modal.title')}>
        <div className="form-group">
          <label className="form-label">Typ</label>
          <select className="form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            {TYPES.map(tp=><option key={tp.label} value={tp.label}>{tp.displayLabel}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Godzina</label><input className="form-input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">Data</label><input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">Notatka (opcjonalna)</label>
          <input className="form-input" type="text" value={form.note} placeholder="np. kolor, konsystencja..." onChange={e=>setForm(f=>({...f,note:e.target.value}))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>Anuluj</button>
          <button className="btn-primary" onClick={add}>Zapisz</button>
        </div>
      </Modal>
    </>
  )
}
