import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { DIET_ITEMS } from '../data/staticData'
import { genId } from '../utils/helpers'
import Modal from './Modal'
import { t, useLocale } from '../i18n'

const EMOJI_OPTIONS = ['🥕','🥦','🍠','🎃','🍎','🍐','🍌','🫐','🍓','🍇','🍑','🥑','🧅','🧄','🫛','🌽','🍅','🥝','🍋','🫚','🐔','🐟','🥩','🥚','🧀','🥛','🌾','🍚','🫘','🥜','🍯','🧇','🥞']

export default function DietTab({uid, babyId, ageMonths }) {
  useLocale()
  const [status, setStatus] = useFirestore(uid, `diet_${babyId}`, {})
  const [customItems, setCustomItems] = useFirestore(uid, `diet_custom_${babyId}`, [])
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', emoji: '🥕', months: String(ageMonths) })

  const allItems = [...DIET_ITEMS, ...customItems]

  const toggle = (id) => {
    const next = { ...status }
    if (next[id] === 'ok') next[id] = 'nope'
    else if (next[id] === 'nope') delete next[id]
    else next[id] = 'ok'
    setStatus(next)
  }

  const addCustom = () => {
    if (!form.name.trim()) return
    const item = { id: genId(), name: form.name.trim(), emoji: form.emoji, months: Number(form.months), custom: true }
    setCustomItems([...customItems, item])
    setModal(false)
    setForm({ name: '', emoji: '🥕', months: String(ageMonths) })
  }

  const removeCustom = (id) => {
    setCustomItems(customItems.filter(i => i.id !== id))
    const next = { ...status }
    delete next[id]
    setStatus(next)
    setDeleteId(null)
  }

  const available = allItems.filter(d => d.months <= ageMonths)
  const upcoming = allItems.filter(d => d.months > ageMonths && d.months <= ageMonths + 3)
  const filtered = filter === 'available' ? available : filter === 'upcoming' ? upcoming : allItems
  const triedCount = Object.keys(status).filter(k => status[k] === 'ok').length

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('diet.title')}</div>
        <div className="section-desc">{t('diet.desc', {tried: triedCount, available: available.length, custom: customItems.length})}</div>
      </div>

      <div className="warn-card">
        {t('diet.warning')}
      </div>

      <div className="segment">
        <button className={`seg-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>Wszystkie</button>
        <button className={`seg-btn ${filter==='available'?'active':''}`} onClick={()=>setFilter('available')}>{t('diet.filter.available')}</button>
        <button className={`seg-btn ${filter==='upcoming'?'active':''}`} onClick={()=>setFilter('upcoming')}>{t('diet.filter.upcoming')}</button>
      </div>

      <div className="diet-grid">
        {filtered.map(d => {
          const s = status[d.id]
          const locked = d.months > ageMonths
          return (
            <div
              key={d.id}
              className={`diet-item ${s==='ok'?'ok':s==='nope'?'nope':''}`}
              onClick={() => !locked && toggle(d.id)}
              onLongPress={() => d.custom && setDeleteId(d.id)}
              style={{ opacity: locked ? 0.45 : 1, cursor: locked ? 'default' : 'pointer', position:'relative' }}
            >
              {d.custom && (
                <button onClick={e=>{e.stopPropagation();setDeleteId(d.id)}} style={{
                  position:'absolute',top:4,right:4,background:'rgba(0,0,0,0.08)',border:'none',
                  borderRadius:'50%',width:18,height:18,fontSize:9,cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-2)',lineHeight:1
                }}>✕</button>
              )}
              <div className="diet-emoji">{d.emoji}</div>
              <div className="diet-name">{d.name}</div>
              <div className="diet-age">{t('diet.from_month', {months: d.months})}</div>
              {s==='ok' && <div style={{fontSize:10,color:'var(--green-dark)',fontWeight:700,marginTop:3}}>{t('diet.status.tried')}</div>}
              {s==='nope' && <div style={{fontSize:10,color:'var(--coral)',fontWeight:700,marginTop:3}}>✗ Reakcja</div>}
              {locked && <div style={{fontSize:10,color:'var(--text-3)',marginTop:3}}>🔒 Zbyt wcześnie</div>}
            </div>
          )
        })}
      </div>

      <div style={{margin:'12px 16px 0',fontSize:12,color:'var(--text-3)',lineHeight:1.6}}>
        {t('diet.tip')}
      </div>

      <button className="btn-add" onClick={()=>{ setForm({name:'',emoji:'🥕',months:String(ageMonths)}); setModal(true) }}>
        {t('diet.add_custom')}
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nowy produkt">
        <div className="form-group">
          <label className="form-label">Emoji produktu</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4,maxHeight:120,overflowY:'auto'}}>
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
          <label className="form-label">{t('diet.modal.name')}</label>
          <input className="form-input" type="text" placeholder="np. Mango, Quinoa..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('diet.modal.months')}</label>
          <input className="form-input" type="number" min="4" max="36" value={form.months} onChange={e=>setForm(f=>({...f,months:e.target.value}))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={addCustom}>{t('common.save')}</button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title={t('diet.delete.title')}>
        <p style={{fontSize:14,color:'var(--text-2)',lineHeight:1.6}}>
          Czy na pewno chcesz usunąć ten produkt? Stracisz też jego status (próbowało/reakcja).
        </p>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setDeleteId(null)}>{t('common.cancel')}</button>
          <button className="btn-primary" style={{background:'var(--coral)'}} onClick={()=>removeCustom(deleteId)}>Usuń</button>
        </div>
      </Modal>
    </>
  )
}
