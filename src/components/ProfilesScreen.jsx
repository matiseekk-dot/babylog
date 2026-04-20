import { t, useLocale } from '../i18n'
import React, { useState } from 'react'
import Modal from './Modal'
import { genId } from '../utils/helpers'

const AVATARS = ['👶','🍼','⭐','🌙','🌈','🦋','🐣','🌸']
const AVATAR_COLORS = ['#E1F5EE','#FAEEDA','#EEEDFE','#FAECE7','#E6F1FB','#FBEAF0','#EAF3DE','#FCEBEB']

export default function ProfilesScreen({ profiles, activeId, onSelect, onAdd, onUpdate, onDelete }) {
  useLocale()
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({ name:'', months:'4', weight:'6.5', avatar:'👶', avatarColor:'#E1F5EE', toiletMode:'diapers' })

  const openAdd = () => {
    setForm({ name:'', months:'4', weight:'6.5', avatar:'👶', avatarColor:'#E1F5EE', toiletMode:'diapers' })
    setModal(true)
  }

  // Smart default for toilet mode based on age in months
  const suggestedToiletMode = (months) => {
    const m = Number(months) || 0
    if (m < 18) return 'diapers'
    if (m < 42) return 'potty'  // 1.5 - 3.5 years
    return 'toilet'
  }

  const openEdit = (p) => {
    setForm({ name:p.name, months:String(p.months), weight:String(p.weight), avatar:p.avatar, avatarColor:p.avatarColor, toiletMode:p.toiletMode || suggestedToiletMode(p.months) })
    setEditModal(p.id)
  }

  const save = () => {
    if (!form.name.trim()) return
    onAdd({ id: genId(), name: form.name.trim(), months: Number(form.months), weight: Number(form.weight), avatar: form.avatar, avatarColor: form.avatarColor, toiletMode: form.toiletMode })
    setModal(false)
  }

  const saveEdit = () => {
    if (!form.name.trim()) return
    onUpdate(editModal, { name: form.name.trim(), months: Number(form.months), weight: Number(form.weight), avatar: form.avatarColor ? form.avatar : '👶', avatarColor: form.avatarColor, toiletMode: form.toiletMode })
    setEditModal(null)
  }

  const ageLabel = (m) => {
    if (m < 1) return 'Noworodek'
    if (m < 12) return t('profiles.age.months', {count: m})
    const y = Math.floor(m/12); const mo = m%12
    return mo > 0 ? t('profiles.age.years_months', {years: y, months: mo}) : (y === 1 ? t('profiles.age.year', {count: y}) : t('profiles.age.months', {count: m}))
  }


  return (
    <div style={{paddingBottom:24}}>
      <div className="section-header">
        <div className="section-title">{t('profiles.title')}</div>
        <div className="section-desc">{t('profiles.desc')}</div>
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
        <>
      <div className="form-group">
        <label className="form-label">{t('onb.setup.name')}</label>
        <input className="form-input" type="text" maxLength={40} placeholder={t('profiles.name_ph')} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
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
      {/* Age: years + months (derived from form.months total) */}
      <div className="form-group">
        <label className="form-label">{t('onb.setup.age')}</label>
        <div className="form-row" style={{marginTop:0}}>
          <div className="form-group" style={{marginTop:0}}>
            <input
              className="form-input"
              type="number"
              inputMode="numeric"
              min="0"
              max="10"
              value={Math.floor((Number(form.months) || 0) / 12)}
              onChange={e => {
                const newY = Number(e.target.value) || 0
                const currentMo = (Number(form.months) || 0) % 12
                setForm(f => ({ ...f, months: String(newY * 12 + currentMo) }))
              }}
            />
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
              {t('age.unit.years')}
            </div>
          </div>
          <div className="form-group" style={{marginTop:0}}>
            <input
              className="form-input"
              type="number"
              inputMode="numeric"
              min="0"
              max="11"
              value={(Number(form.months) || 0) % 12}
              onChange={e => {
                const newMo = Number(e.target.value) || 0
                const currentY = Math.floor((Number(form.months) || 0) / 12)
                setForm(f => ({ ...f, months: String(currentY * 12 + newMo) }))
              }}
            />
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
              {t('age.unit.months')}
            </div>
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t('profiles.toilet_mode.label')}</label>
        <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:4}}>
          {[
            {id:'diapers', emoji:'👶', label:t('profiles.toilet_mode.diapers'), desc:t('profiles.toilet_mode.diapers_desc')},
            {id:'potty',   emoji:'🚽', label:t('profiles.toilet_mode.potty'),   desc:t('profiles.toilet_mode.potty_desc')},
            {id:'toilet',  emoji:'🚾', label:t('profiles.toilet_mode.toilet'),  desc:t('profiles.toilet_mode.toilet_desc')},
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setForm(f => ({...f, toiletMode: opt.id}))}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px',
                border: `2px solid ${form.toiletMode === opt.id ? 'var(--green)' : 'var(--border)'}`,
                borderRadius:10,
                background: form.toiletMode === opt.id ? '#F5F9F7' : '#fff',
                cursor:'pointer', textAlign:'left',
              }}
            >
              <span style={{fontSize:22}}>{opt.emoji}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:14, fontWeight:700, color:'var(--text)'}}>{opt.label}</div>
                <div style={{fontSize:11, color:'var(--text-3)', marginTop:2}}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t('onb.setup.weight')}</label>
        <input className="form-input" type="number" step="0.1" min="1" max="50" value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} />
      </div>
    </>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={save}>{t('common.save')}</button>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={()=>setEditModal(null)} title={t('profiles.edit.title')}>
        <>
      <div className="form-group">
        <label className="form-label">{t('onb.setup.name')}</label>
        <input className="form-input" type="text" maxLength={40} placeholder={t('profiles.name_ph')} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
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
      {/* Age: years + months (derived from form.months total) */}
      <div className="form-group">
        <label className="form-label">{t('onb.setup.age')}</label>
        <div className="form-row" style={{marginTop:0}}>
          <div className="form-group" style={{marginTop:0}}>
            <input
              className="form-input"
              type="number"
              inputMode="numeric"
              min="0"
              max="10"
              value={Math.floor((Number(form.months) || 0) / 12)}
              onChange={e => {
                const newY = Number(e.target.value) || 0
                const currentMo = (Number(form.months) || 0) % 12
                setForm(f => ({ ...f, months: String(newY * 12 + currentMo) }))
              }}
            />
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
              {t('age.unit.years')}
            </div>
          </div>
          <div className="form-group" style={{marginTop:0}}>
            <input
              className="form-input"
              type="number"
              inputMode="numeric"
              min="0"
              max="11"
              value={(Number(form.months) || 0) % 12}
              onChange={e => {
                const newMo = Number(e.target.value) || 0
                const currentY = Math.floor((Number(form.months) || 0) / 12)
                setForm(f => ({ ...f, months: String(currentY * 12 + newMo) }))
              }}
            />
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
              {t('age.unit.months')}
            </div>
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t('profiles.toilet_mode.label')}</label>
        <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:4}}>
          {[
            {id:'diapers', emoji:'👶', label:t('profiles.toilet_mode.diapers'), desc:t('profiles.toilet_mode.diapers_desc')},
            {id:'potty',   emoji:'🚽', label:t('profiles.toilet_mode.potty'),   desc:t('profiles.toilet_mode.potty_desc')},
            {id:'toilet',  emoji:'🚾', label:t('profiles.toilet_mode.toilet'),  desc:t('profiles.toilet_mode.toilet_desc')},
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setForm(f => ({...f, toiletMode: opt.id}))}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px',
                border: `2px solid ${form.toiletMode === opt.id ? 'var(--green)' : 'var(--border)'}`,
                borderRadius:10,
                background: form.toiletMode === opt.id ? '#F5F9F7' : '#fff',
                cursor:'pointer', textAlign:'left',
              }}
            >
              <span style={{fontSize:22}}>{opt.emoji}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:14, fontWeight:700, color:'var(--text)'}}>{opt.label}</div>
                <div style={{fontSize:11, color:'var(--text-3)', marginTop:2}}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t('onb.setup.weight')}</label>
        <input className="form-input" type="number" step="0.1" min="1" max="50" value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} />
      </div>
    </>
        <div className="modal-btns">
          <button className="btn-secondary" style={{background:'var(--coral-light)',color:'var(--coral)',border:'none'}} onClick={()=>{onDelete(editModal);setEditModal(null)}}>{t('common.delete')}</button>
          <button className="btn-primary" onClick={saveEdit}>{t('common.save')}</button>
        </div>
      </Modal>
    </div>
  )
}
