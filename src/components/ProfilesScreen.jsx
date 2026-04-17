import React, { useState } from 'react'
import Modal from './Modal'
import { genId } from '../utils/helpers'

const AVATARS = ['👶','🍼','⭐','🌙','🌈','🦋','🐣','🌸']
const AVATAR_COLORS = ['#E1F5EE','#FAEEDA','#EEEDFE','#FAECE7','#E6F1FB','#FBEAF0','#EAF3DE','#FCEBEB']

export default function ProfilesScreen({ profiles, activeId, onSelect, onAdd, onUpdate, onDelete }) {
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({ name:'', months:'4', weight:'6.5', avatar:'👶', avatarColor:'#E1F5EE' })

  const openAdd = () => {
    setForm({ name:'', months:'4', weight:'6.5', avatar:'👶', avatarColor:'#E1F5EE' })
    setModal(true)
  }

  const openEdit = (p) => {
    setForm({ name:p.name, months:String(p.months), weight:String(p.weight), avatar:p.avatar, avatarColor:p.avatarColor })
    setEditModal(p.id)
  }

  const save = () => {
    if (!form.name.trim()) return
    onAdd({ id: genId(), name: form.name.trim(), months: Number(form.months), weight: Number(form.weight), avatar: form.avatar, avatarColor: form.avatarColor })
    setModal(false)
  }

  const saveEdit = () => {
    if (!form.name.trim()) return
    onUpdate(editModal, { name: form.name.trim(), months: Number(form.months), weight: Number(form.weight), avatar: form.avatar, avatarColor: form.avatarColor })
    setEditModal(null)
  }

  const ageLabel = (m) => {
    if (m < 1) return 'Noworodek'
    if (m < 12) return `${m} miesięcy`
    const y = Math.floor(m/12); const mo = m%12
    return mo > 0 ? `${y} r. ${mo} mies.` : `${y} rok`
  }

  const FormContent = () => (
    <>
      <div className="form-group">
        <label className="form-label">Imię dziecka</label>
        <input className="form-input" type="text" placeholder="np. Zosia" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
      </div>
      <div className="form-group">
        <label className="form-label">Avatar</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
          {AVATARS.map((a,i) => (
            <button key={a} onClick={()=>setForm(f=>({...f,avatar:a,avatarColor:AVATAR_COLORS[i]}))} style={{
              width:44,height:44,fontSize:22,borderRadius:50,
              border:`2px solid ${form.avatar===a?'var(--green)':'var(--border)'}`,
              background:AVATAR_COLORS[i],cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'
            }}>{a}</button>
          ))}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Wiek (miesiące)</label>
          <input className="form-input" type="number" min="0" max="60" value={form.months} onChange={e=>setForm(f=>({...f,months:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Waga (kg)</label>
          <input className="form-input" type="number" step="0.1" min="1" max="30" value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} />
        </div>
      </div>
    </>
  )

  return (
    <div style={{paddingBottom:24}}>
      <div className="section-header">
        <div className="section-title">Profile dzieci</div>
        <div className="section-desc">Wybierz aktywne dziecko lub dodaj nowe</div>
      </div>

      <div className="profile-list">
        {profiles.map(p => (
          <div key={p.id} className={`profile-card ${p.id===activeId?'active':''}`} onClick={()=>onSelect(p.id)}>
            <div className="profile-avatar" style={{background:p.avatarColor,fontSize:22}}>
              {p.avatar}
            </div>
            <div className="profile-info">
              <div className="profile-name">{p.name}</div>
              <div className="profile-detail">{ageLabel(p.months)} · {p.weight} kg</div>
            </div>
            {p.id===activeId && <span className="profile-check">✓</span>}
            <button onClick={e=>{e.stopPropagation();openEdit(p)}} style={{
              background:'none',border:'none',color:'var(--text-3)',fontSize:18,padding:'0 4px',minHeight:44,minWidth:44
            }}>✏️</button>
          </div>
        ))}
      </div>

      <button className="btn-add" onClick={openAdd}>
        + Dodaj dziecko
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nowe dziecko">
        <FormContent />
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>Anuluj</button>
          <button className="btn-primary" onClick={save}>Dodaj</button>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={()=>setEditModal(null)} title="Edytuj profil">
        <FormContent />
        <div className="modal-btns">
          <button className="btn-secondary" style={{background:'var(--coral-light)',color:'var(--coral)',border:'none'}} onClick={()=>{onDelete(editModal);setEditModal(null)}}>Usuń</button>
          <button className="btn-primary" onClick={saveEdit}>Zapisz</button>
        </div>
      </Modal>
    </div>
  )
}
