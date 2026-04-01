import React, { useState } from 'react'
import { useStorage } from '../hooks/useStorage'
import { nowTime, todayDate, uid } from '../utils/helpers'
import Modal from './Modal'

const TYPES = [
  { label:'Mokra', emoji:'💧', badge:'badge-blue' },
  { label:'Brudna', emoji:'💩', badge:'badge-amber' },
  { label:'Obydwie', emoji:'🔄', badge:'badge-purple' },
]

export default function DiaperTab({ babyId }) {
  const [logs, setLogs] = useStorage(`diaper_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ type:'Mokra', time: nowTime(), date: todayDate(), note:'' })

  const today = todayDate()
  const todayLogs = logs.filter(l=>l.date===today).sort((a,b)=>b.time.localeCompare(a.time))
  const wet = todayLogs.filter(l=>l.type==='Mokra'||l.type==='Obydwie').length
  const dirty = todayLogs.filter(l=>l.type==='Brudna'||l.type==='Obydwie').length

  const add = () => {
    const entry = { id: uid(), ...form }
    setLogs([entry, ...logs])
    setModal(false)
    setForm({ type:'Mokra', time: nowTime(), date: todayDate(), note:'' })
  }

  const remove = (id) => setLogs(logs.filter(l=>l.id!==id))

  const getType = (t) => TYPES.find(x=>x.label===t) || TYPES[0]

  return (
    <>
      <div className="section-header">
        <div className="section-title">Pieluchy</div>
        <div className="section-desc">Monitoruj pieluchy i zdrowie dziecka</div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="stat-val">{todayLogs.length}</div><div className="stat-lbl">pieluch dziś</div></div>
        <div className="stat-card"><div className="stat-val">{wet}</div><div className="stat-lbl">mokrych</div></div>
        <div className="stat-card"><div className="stat-val">{dirty}</div><div className="stat-lbl">brudnych</div></div>
      </div>

      <div className="card">
        <div className="card-header">Dzisiaj</div>
        {todayLogs.length === 0
          ? <div className="empty-state"><div className="empty-icon">👶</div><p>Brak wpisów na dziś</p></div>
          : todayLogs.map(l => {
              const t = getType(l.type)
              return (
                <div className="log-item" key={l.id}>
                  <div className="log-icon">{t.emoji}</div>
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

      <div style={{display:'flex',gap:8,margin:'10px 16px 0'}}>
        {TYPES.map(t => (
          <button key={t.label} onClick={() => {
            const entry = { id:uid(), type:t.label, time:nowTime(), date:todayDate(), note:'' }
            setLogs([entry,...logs])
          }} style={{
            flex:1, padding:'10px 4px', border:'0.5px solid var(--border-med)',
            borderRadius:12, background:'var(--surface)', fontSize:13,
            fontWeight:600, color:'var(--text)', display:'flex',
            flexDirection:'column', alignItems:'center', gap:2, minHeight:60
          }}>
            <span style={{fontSize:20}}>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <button className="btn-add" onClick={() => { setForm(f=>({...f,time:nowTime(),date:todayDate()})); setModal(true) }}>
        + Dodaj z notatką
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title="Nowa pielucha">
        <div className="form-group">
          <label className="form-label">Typ</label>
          <select className="form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            {TYPES.map(t=><option key={t.label}>{t.label}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Godzina</label>
            <input className="form-input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Data</label>
            <input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
          </div>
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
