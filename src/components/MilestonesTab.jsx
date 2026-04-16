import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { MILESTONES } from '../data/staticData'
import { todayDate, formatDate, uid } from '../utils/helpers'
import Modal from './Modal'

const EMOJI_OPTIONS = ['⭐','🎯','🏆','🌟','💫','🎉','🎈','🚀','💪','🧠','👣','🗣️','🏃','🤝','❤️','🌈','🎵','🎨','📚','🧩','🌱','🦋','🐣','🌸','🍀','🔑','🎀','🛝','🏊','🚴']

export default function MilestonesTab({uid,  babyId, ageMonths }) {
  const [done, setDone] = useFirestore(uid, `milestones_${babyId}`, {})
  const [customMilestones, setCustomMilestones] = useFirestore(uid, `milestones_custom_${babyId}`, [])
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', emoji: '⭐', age: '', months: String(ageMonths) })

  const allMilestones = [...MILESTONES, ...customMilestones]

  const toggle = (id) => {
    const next = { ...done }
    if (next[id]) { delete next[id] } else { next[id] = todayDate() }
    setDone(next)
  }

  const addCustom = () => {
    if (!form.name.trim()) return
    const m = { id: uid(), name: form.name.trim(), emoji: form.emoji, age: form.age || `${form.months} mies.`, months: Number(form.months), custom: true }
    setCustomMilestones([...customMilestones, m])
    setModal(false)
    setForm({ name: '', emoji: '⭐', age: '', months: String(ageMonths) })
  }

  const removeCustom = (id) => {
    setCustomMilestones(customMilestones.filter(m => m.id !== id))
    const next = { ...done }
    delete next[id]
    setDone(next)
    setDeleteId(null)
  }

  const filtered = allMilestones.filter(m => {
    if (filter === 'done') return done[m.id]
    if (filter === 'upcoming') return !done[m.id] && m.months <= ageMonths + 3
    return true
  })

  const doneCount = Object.keys(done).length

  return (
    <>
      <div className="section-header">
        <div className="section-title">Kamienie milowe</div>
        <div className="section-desc">{doneCount}/{allMilestones.length} osiągniętych · Własne: {customMilestones.length}</div>
      </div>

      <div className="segment">
        <button className={`seg-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>Wszystkie</button>
        <button className={`seg-btn ${filter==='upcoming'?'active':''}`} onClick={()=>setFilter('upcoming')}>Nadchodzące</button>
        <button className={`seg-btn ${filter==='done'?'active':''}`} onClick={()=>setFilter('done')}>Osiągnięte</button>
      </div>

      <div className="milestone-grid">
        {filtered.map(m => (
          <div key={m.id} className={`milestone-card ${done[m.id]?'done':''}`} style={{position:'relative'}} onClick={()=>toggle(m.id)}>
            {m.custom && (
              <button onClick={e=>{e.stopPropagation();setDeleteId(m.id)}} style={{
                position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.08)',border:'none',
                borderRadius:'50%',width:20,height:20,fontSize:10,cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-2)'
              }}>✕</button>
            )}
            <div className="ms-emoji">{m.emoji}</div>
            <div className="ms-name">{m.name}</div>
            <div className="ms-age">{m.age}</div>
            {done[m.id] && <div className="ms-done">✓ {formatDate(done[m.id])}</div>}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state" style={{marginTop:16}}>
          <div className="empty-icon">⭐</div>
          <p>Brak kamieni milowych w tej kategorii</p>
        </div>
      )}

      <button className="btn-add" onClick={()=>{ setForm({name:'',emoji:'⭐',age:'',months:String(ageMonths)}); setModal(true) }}>
        + Dodaj własny kamień milowy
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nowy kamień milowy">
        <div className="form-group">
          <label className="form-label">Emoji</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4,maxHeight:110,overflowY:'auto'}}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={()=>setForm(f=>({...f,emoji:e}))} style={{
                width:40,height:40,fontSize:20,borderRadius:8,cursor:'pointer',
                border:`1.5px solid ${form.emoji===e?'var(--green)':'var(--border)'}`,
                background:form.emoji===e?'var(--green-light)':'var(--surface)'
              }}>{e}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Opis etapu</label>
          <input className="form-input" type="text" placeholder="np. Pierwsze słowo 'tata'" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Typowy wiek (mies.)</label>
            <input className="form-input" type="number" min="0" max="60" value={form.months} onChange={e=>setForm(f=>({...f,months:e.target.value,age:`${e.target.value} mies.`}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Etykieta wieku</label>
            <input className="form-input" type="text" placeholder="np. 10–12 mies." value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} />
          </div>
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>Anuluj</button>
          <button className="btn-primary" onClick={addCustom}>Dodaj</button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title="Usuń kamień milowy">
        <p style={{fontSize:14,color:'var(--text-2)',lineHeight:1.6}}>Czy na pewno chcesz usunąć ten kamień milowy?</p>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setDeleteId(null)}>Anuluj</button>
          <button className="btn-primary" style={{background:'var(--coral)'}} onClick={()=>removeCustom(deleteId)}>Usuń</button>
        </div>
      </Modal>
    </>
  )
}
