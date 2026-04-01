import React, { useState } from 'react'
import { useStorage } from '../hooks/useStorage'
import { nowTime, todayDate, uid } from '../utils/helpers'
import Modal from './Modal'

const TYPES = ['Pierś lewa','Pierś prawa','Butelka','Odciągnięte mleko']

export default function FeedTab({ babyId }) {
  const key = `feed_${babyId}`
  const [logs, setLogs] = useStorage(key, [])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ type:'Pierś lewa', amount:'15', time: nowTime(), date: todayDate() })

  const today = todayDate()
  const todayLogs = logs.filter(l => l.date === today).sort((a,b) => b.time.localeCompare(a.time))

  const totalMl = todayLogs.filter(l=>l.type==='Butelka'||l.type==='Odciągnięte mleko').reduce((s,l)=>s+Number(l.amount||0),0)
  const breastCount = todayLogs.filter(l=>l.type.startsWith('Pierś')).length

  const lastLog = todayLogs[0]
  const lastAgo = lastLog ? (() => {
    const [h,m] = lastLog.time.split(':').map(Number)
    const now = new Date(); const then = new Date(); then.setHours(h,m,0,0)
    const diff = Math.floor((now-then)/60000)
    if (diff < 60) return `${diff} min`
    return `${Math.floor(diff/60)}h ${diff%60}m`
  })() : '—'

  const isBottle = form.type==='Butelka'||form.type==='Odciągnięte mleko'

  const add = () => {
    const entry = { id: uid(), ...form, amount: form.amount }
    const next = [entry, ...logs]
    setLogs(next)
    setModal(false)
    setForm({ type:'Pierś lewa', amount:'15', time: nowTime(), date: todayDate() })
  }

  const remove = (id) => setLogs(logs.filter(l => l.id !== id))

  return (
    <>
      <div className="section-header">
        <div className="section-title">Karmienie</div>
        <div className="section-desc">Rejestruj karmienia piersią i butelką</div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="stat-val">{todayLogs.length}</div><div className="stat-lbl">karmień dziś</div></div>
        <div className="stat-card"><div className="stat-val">{totalMl > 0 ? `${totalMl}ml` : `${breastCount}×`}</div><div className="stat-lbl">{totalMl > 0 ? 'ml butelką' : 'pierś'}</div></div>
        <div className="stat-card"><div className="stat-val">{lastAgo}</div><div className="stat-lbl">od ostatniego</div></div>
      </div>

      <div className="card">
        <div className="card-header">Dzisiaj</div>
        {todayLogs.length === 0
          ? <div className="empty-state"><div className="empty-icon">🍼</div><p>Brak wpisów na dziś</p></div>
          : todayLogs.map(l => (
            <div className="log-item" key={l.id}>
              <div className="log-icon">{l.type.startsWith('Pierś') ? '🤱' : '🍼'}</div>
              <div className="log-body">
                <div className="log-name">{l.type}</div>
                <div className="log-detail">{l.type==='Butelka'||l.type==='Odciągnięte mleko' ? `${l.amount} ml` : `${l.amount} min`}</div>
              </div>
              <div className="log-time">{l.time}</div>
              <button onClick={() => remove(l.id)} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
            </div>
          ))
        }
      </div>

      <button className="btn-add" onClick={() => { setForm(f=>({...f,time:nowTime(),date:todayDate()})); setModal(true) }}>
        + Dodaj karmienie
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title="Nowe karmienie">
        <div className="form-group">
          <label className="form-label">Typ karmienia</label>
          <select className="form-select" value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value,amount:e.target.value.startsWith('Pierś')?'15':'120'}))}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{isBottle ? 'Ilość (ml)' : 'Czas (min)'}</label>
            <input className="form-input" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">Godzina</label>
            <input className="form-input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Data</label>
          <input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={() => setModal(false)}>Anuluj</button>
          <button className="btn-primary" onClick={add}>Zapisz</button>
        </div>
      </Modal>
    </>
  )
}
