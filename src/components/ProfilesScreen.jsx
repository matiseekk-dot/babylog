import { t, useLocale, getLocale } from '../i18n'
import React, { useState } from 'react'
import Modal from './Modal'
import { genId, parseNum, todayDate } from '../utils/helpers'
import { isValidDueDate, addDays, termDaysForLocale } from '../utils/pregnancy'
import { trackPregnancyStarted } from '../utils/analytics'
import { pregnancyWeekText } from './PregnancyScreen'

const AVATARS = ['👶','🍼','⭐','🌙','🌈','🦋','🐣','🌸']
const AVATAR_COLORS = ['#E1F5EE','#FAEEDA','#EEEDFE','#FAECE7','#E6F1FB','#FBEAF0','#EAF3DE','#FCEBEB']

export default function ProfilesScreen({ profiles, activeId, onSelect, onAdd, onUpdate, onDelete, isPremium, onUpgrade }) {
  useLocale()
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({ name:'', months:'4', weight:'6.5', avatar:'👶', avatarColor:'#E1F5EE', toiletMode:'diapers' })
  // v2.17.0: kolejny profil może być ciążą (np. drugie dziecko w drodze).
  const [kind, setKind] = useState('baby')
  const [due, setDue] = useState('')
  const [dueTried, setDueTried] = useState(false)
  const termDays = termDaysForLocale(getLocale())
  const dueOk = isValidDueDate(due, new Date(), termDays)

  const openAdd = () => {
    // v2.11.9: gate Add Profile button — free user max 1 profile.
    // Wcześniej free user mógł otworzyć modal, wypełnić formularz, dopiero
    // przy Save dostać paywall. Teraz paywall otwiera się od razu —
    // czystsze UX, użytkownik wie czego się spodziewać.
    if (!isPremium && profiles.length >= 1) {
      onUpgrade?.()
      return
    }
    setForm({ name:'', months:'4', weight:'6.5', avatar:'👶', avatarColor:'#E1F5EE', toiletMode:'diapers' })
    setKind('baby'); setDue(''); setDueTried(false)
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
    if (kind === 'pregnancy') {
      if (!dueOk) { setDueTried(true); return }
      trackPregnancyStarted('profiles')
      onAdd({ id: genId(), mode: 'pregnancy', name: form.name.trim() || t('preg.default_name'), dueDate: due, termDays, lmp: null,
        months: 0, weight: null, sex: null, avatar: '🤰', avatarColor: '#FBEAF0', toiletMode: 'diapers' })
      setModal(false)
      return
    }
    if (!form.name.trim()) return
    onAdd({ id: genId(), name: form.name.trim(), months: Number(form.months), weight: parseNum(form.weight) || 0, avatar: form.avatar, avatarColor: form.avatarColor, toiletMode: form.toiletMode })
    setModal(false)
  }

  const saveEdit = () => {
    if (!form.name.trim()) return
    onUpdate(editModal, { name: form.name.trim(), months: Number(form.months), weight: parseNum(form.weight) || 0, avatar: form.avatarColor ? form.avatar : '👶', avatarColor: form.avatarColor, toiletMode: form.toiletMode })
    setEditModal(null)
  }

  const ageLabel = (m) => {
    if (m < 1) return t('profiles.age.newborn')
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
              <div className="profile-detail">
                {p.mode === 'pregnancy' ? pregnancyWeekText(p.dueDate, p.termDays) : `${ageLabel(p.months)} · ${p.weight} kg`}
              </div>
            </div>
            {p.id===activeId && <span className="profile-check">✓</span>}
            {p.mode !== 'pregnancy' && <button onClick={e=>{e.stopPropagation();openEdit(p)}} style={{
              background:'none',border:'none',color:'var(--text-3)',fontSize:18,padding:'0 4px',minHeight:44,minWidth:44
            }}>✏️</button>}
          </div>
        ))}
      </div>

      <button className="btn-add" onClick={openAdd}>
        {t('profiles.add')}
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title={t('profiles.add.title')}>
        <div role="radiogroup" style={{display:'flex',gap:4,padding:4,marginBottom:12,background:'var(--gray-light)',borderRadius:12}}>
          {[['baby', t('onb.mode.baby')], ['pregnancy', `🤰 ${t('onb.mode.pregnancy')}`]].map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={kind === value} onClick={() => setKind(value)} style={{
              flex:1, minHeight:40, border:'none', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:700,
              background: kind === value ? 'var(--surface)' : 'transparent',
              color: kind === value ? 'var(--brand-700)' : 'var(--text-2)',
            }}>{label}</button>
          ))}
        </div>
        {kind === 'pregnancy' ? (<>
      <div className="form-group">
        <label className="form-label" htmlFor="add-preg-name">{t('onb.preg.name')}</label>
        <input id="add-preg-name" className="form-input" type="text" maxLength={40} placeholder={t('onb.preg.name_ph')} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="add-preg-due">{t('onb.preg.due')} *</label>
        <input id="add-preg-due" className="form-input" type="date" value={due}
          min={addDays(todayDate(), -28)} max={addDays(todayDate(), termDays)}
          onChange={e=>setDue(e.target.value)} aria-invalid={(dueTried || !!due) && !dueOk} />
        {(dueTried || due) && !dueOk && (
          <div role="alert" style={{fontSize:12,color:'var(--alert-500)',marginTop:4,fontWeight:500}}>
            ⚠️ {t(due ? 'onb.preg.due_invalid' : 'onb.preg.due_missing')}
          </div>
        )}
      </div>
        </>) : (<>
      <div className="form-group">
        <label className="form-label">{t('onb.setup.name')}</label>
        <input className="form-input" type="text" maxLength={40} placeholder={t('profiles.name_ph')} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
      </div>
      <div className="form-group">
        <label className="form-label">{t('profiles.avatar_label')}</label>
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
        <input className="form-input" type="text" inputMode="decimal" pattern="[0-9.,]*" maxLength={5} value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value.replace(/[^0-9.,]/g,'')}))} />
      </div>
    </>)}
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
        <label className="form-label">{t('profiles.avatar_label')}</label>
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
        <input className="form-input" type="text" inputMode="decimal" pattern="[0-9.,]*" maxLength={5} value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value.replace(/[^0-9.,]/g,'')}))} />
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
