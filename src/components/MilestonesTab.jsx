import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { MILESTONES, MILESTONES_EN } from '../data/staticData'
import { todayDate, formatDate, genId } from '../utils/helpers'
import Modal from './Modal'
import { t, useLocale, isEN } from '../i18n'

const EMOJI_OPTIONS = ['⭐','🎯','🏆','🌟','💫','🎉','🎈','🚀','💪','🧠','👣','🗣️','🏃','🤝','❤️','🌈','🎵','🎨','📚','🧩','🌱','🦋','🐣','🌸','🍀','🔑','🎀','🛝','🏊','🚴']

/**
 * MilestonesTab
 *
 * ZMIANY 2026-04-21 (v2):
 *   1. Usunięte pole "Etykieta wieku" w modalu dodawania — nadmiarowe,
 *      apka sama generuje "X. miesiąc" z liczby
 *   2. Dodana EDYCJA daty osiągnięcia dla KAŻDEGO milestone'a (nie tylko custom):
 *      - Tap w już zaznaczony milestone → modal z datą do edycji
 *      - Pozwala wpisać "zaczął raczkować 2 tygodnie temu" (data wstecz)
 *   3. Edycja custom milestones (nazwa, emoji, miesiąc) przez "długi" tap
 *
 * Flow:
 *   - Krótki tap na niezaznaczony → toggle + data = dziś
 *   - Krótki tap na zaznaczony → modal edycji daty
 *   - ✕ (tylko na custom) → usuwa całkowicie milestone
 */
export default function MilestonesTab({uid, babyId, ageMonths }) {
  useLocale()
  const [done, setDone] = useFirestore(uid, `milestones_${babyId}`, {})
  const [customMilestones, setCustomMilestones] = useFirestore(uid, `milestones_custom_${babyId}`, [])
  const [filter, setFilter] = useState('all')

  // Modal dodawania nowego
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', emoji: '⭐', months: String(ageMonths) })

  // Modal edycji daty osiągnięcia (dla zaznaczonych)
  const [editDateMilestone, setEditDateMilestone] = useState(null)
  const [editDateValue, setEditDateValue] = useState(todayDate())

  const [deleteId, setDeleteId] = useState(null)

  const builtInMilestones = isEN() ? MILESTONES_EN : MILESTONES
  const allMilestones = [...builtInMilestones, ...customMilestones]

  const handleClick = (m) => {
    if (done[m.id]) {
      // Już zaznaczony → otwórz edycję daty (nie odzaznacza od razu)
      setEditDateMilestone(m)
      setEditDateValue(done[m.id])
    } else {
      // Niezaznaczony → zaznacz z dzisiejszą datą
      setDone({ ...done, [m.id]: todayDate() })
    }
  }

  const saveEditDate = () => {
    if (!editDateMilestone) return
    setDone({ ...done, [editDateMilestone.id]: editDateValue })
    setEditDateMilestone(null)
  }

  const unmark = () => {
    if (!editDateMilestone) return
    const next = { ...done }
    delete next[editDateMilestone.id]
    setDone(next)
    setEditDateMilestone(null)
  }

  const addCustom = () => {
    if (!form.name.trim()) return
    const monthsNum = Number(form.months) || 0
    const m = {
      id: genId(),
      name: form.name.trim(),
      emoji: form.emoji,
      age: `${monthsNum}. mies.`,
      months: monthsNum,
      custom: true,
    }
    setCustomMilestones([...customMilestones, m])
    setModal(false)
    setForm({ name: '', emoji: '⭐', months: String(ageMonths) })
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
        <div className="section-title">{t('milestones.title')}</div>
        <div className="section-desc">{t('milestones.desc', {done: doneCount, total: allMilestones.length, custom: customMilestones.length})}</div>
      </div>

      <div className="segment">
        <button className={`seg-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>Wszystkie</button>
        <button className={`seg-btn ${filter==='upcoming'?'active':''}`} onClick={()=>setFilter('upcoming')}>{t('milestones.filter.upcoming')}</button>
        <button className={`seg-btn ${filter==='done'?'active':''}`} onClick={()=>setFilter('done')}>{t('milestones.filter.done')}</button>
      </div>

      <div className="milestone-grid">
        {filtered.map(m => (
          <div
            key={m.id}
            className={`milestone-card ${done[m.id]?'done':''}`}
            style={{position:'relative'}}
            onClick={() => handleClick(m)}
          >
            {m.custom && (
              <button aria-label={t('common.delete_aria')} onClick={e=>{e.stopPropagation();setDeleteId(m.id)}} style={{
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
          <p>{t('milestones.empty')}</p>
        </div>
      )}

      <button className="btn-add" onClick={()=>{ setForm({name:'',emoji:'⭐',months:String(ageMonths)}); setModal(true) }}>
        {t('milestones.add')}
      </button>

      {/* Modal: DODAJ nowy milestone */}
      <Modal open={modal} onClose={()=>setModal(false)} title={t('milestones.modal.title')}>
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
          <input
            className="form-input"
            type="text"
            maxLength={40}
            placeholder={t('milestones.modal.name_ph')}
            value={form.name}
            onChange={e=>setForm(f=>({...f,name:e.target.value}))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('milestones.month_of_life')}</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="60"
            value={form.months}
            onChange={e=>setForm(f=>({...f,months:e.target.value}))}
          />
          <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>
            {t('milestones.month_hint')}
          </div>
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={addCustom}>{t('common.save')}</button>
        </div>
      </Modal>

      {/* Modal: EDYTUJ datę osiągnięcia */}
      <Modal
        open={!!editDateMilestone}
        onClose={()=>setEditDateMilestone(null)}
        title={editDateMilestone ? `${editDateMilestone.emoji} ${editDateMilestone.name}` : ''}
      >
        {editDateMilestone && (
          <>
            <div style={{
              padding:'10px 12px',
              background:'#E1F5EE',
              borderRadius:8,
              fontSize:12,
              color:'#085041',
              marginBottom:14,
              lineHeight:1.5,
            }}>
              {t('milestones.edit_hint')}
            </div>
            <div className="form-group">
              <label className="form-label">{t('milestones.date_achieved')}</label>
              <input
                className="form-input"
                type="date"
                value={editDateValue}
                onChange={e=>setEditDateValue(e.target.value)}
                max={todayDate()}
              />
            </div>
            <div className="modal-btns" style={{flexDirection:'column',gap:8}}>
              <button className="btn-primary" style={{width:'100%'}} onClick={saveEditDate}>
                {t('common.save')}
              </button>
              <button
                className="btn-secondary"
                style={{width:'100%',background:'var(--coral-light)',color:'var(--coral)',border:'none'}}
                onClick={unmark}
              >
                Odznacz ten etap
              </button>
              <button
                className="btn-secondary"
                style={{width:'100%'}}
                onClick={()=>setEditDateMilestone(null)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal: POTWIERDŹ usunięcie custom milestone */}
      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title={t('milestones.delete_title')}>
        <p style={{fontSize:14,color:'var(--text-2)',lineHeight:1.6}}>{t('milestones.delete_msg')}</p>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setDeleteId(null)}>{t('common.cancel')}</button>
          <button className="btn-primary" style={{background:'var(--coral)'}} onClick={()=>removeCustom(deleteId)}>{t('common.delete')}</button>
        </div>
      </Modal>
    </>
  )
}
