import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { todayDate, genId} from '../utils/helpers'
import Modal from './Modal'
import { toast } from './Toast'
import { MOOD_OPTIONS } from '../data/staticData'

export default function DiaryTab({uid, babyId }) {
  const [entries, setEntries] = useFirestore(uid, `diary_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ date:todayDate(), mood:'😊', text:'' })

  const add = () => {
    if (!form.text.trim()) return
    setEntries([{ id:genId(), ...form }, ...entries])
    setModal(false)
    toast('Wpis zapisany')
    setForm({ date:todayDate(), mood:'😊', text:'' })
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Dziennik</div>
        <div className="section-desc">Wspomnienia i ważne chwile</div>
      </div>

      <div className="card">
        <div className="card-header">Wpisy ({entries.length})</div>
        {entries.length === 0
          ? <div className="empty-state"><div className="empty-icon">📖</div><p>Zacznij zapisywać wspomnienia!</p></div>
          : entries.slice(0,30).map(e => (
            <div key={e.id} className="diary-entry">
              <div className="diary-date">{e.date}</div>
              <div style={{display:'flex',alignItems:'flex-start',gap:6}}>
                <span className="diary-mood">{e.mood}</span>
                <span className="diary-text">{e.text}</span>
              </div>
              <button onClick={()=>setEntries(entries.filter(x=>x.id!==e.id))} style={{
                background:'none',border:'none',color:'var(--text-3)',fontSize:12,
                marginTop:4,padding:0,cursor:'pointer'
              }}>Usuń</button>
            </div>
          ))
        }
      </div>

      <button className="btn-add" onClick={()=>{ setForm(f=>({...f,date:todayDate()})); setModal(true) }}>
        + Dodaj wspomnienie
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nowy wpis">
        <div className="form-group">
          <label className="form-label">Nastrój dziecka</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
            {MOOD_OPTIONS.map(m => (
              <button key={m.emoji} onClick={()=>setForm(f=>({...f,mood:m.emoji}))} style={{
                padding:'8px 12px', borderRadius:10, border:`1.5px solid ${form.mood===m.emoji?'var(--green)':'var(--border)'}`,
                background:form.mood===m.emoji?'var(--green-light)':'var(--surface)',
                fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:4, minHeight:44
              }}>
                <span style={{fontSize:18}}>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Data</label>
          <input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Wpis</label>
          <textarea className="form-input" rows={4} placeholder="Co się wydarzyło? Jakie osiągnięcia, śmieszne momenty, pierwsze razy..." value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} style={{resize:'vertical'}} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>Anuluj</button>
          <button className="btn-primary" onClick={add}>Zapisz</button>
        </div>
      </Modal>
    </>
  )
}
