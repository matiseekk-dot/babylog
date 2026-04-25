import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { VACCINATIONS } from '../data/staticData'
import { todayDate, formatDate, genId } from '../utils/helpers'
import Modal from './Modal'
import { t, useLocale, isEN } from '../i18n'

export default function VaccinationsTab({uid, babyId, ageMonths }) {
  useLocale()
  const [done, setDone] = useFirestore(uid, `vacc_${babyId}`, {})
  const [customVacc, setCustomVacc] = useFirestore(uid, `vacc_custom_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', when: '', months: String(ageMonths) })

  // Date picker modal: opened when user taps a vaccine.
  // Lets them mark done with a CUSTOM date (not just today).
  const [dateModal, setDateModal] = useState(null)

  // W wersji EN: brak built-in listy szczepień — Polska baza (PSO) nie pasuje
  // do EN userów, a uniwersalny międzynarodowy harmonogram nie istnieje
  // (US CDC vs UK NHS vs DE STIKO różnią się). EN user dodaje własne wpisy.
  // Roadmap v1.1: per-kraj harmonogramy.
  const builtInVaccines = isEN() ? [] : VACCINATIONS
  const allVacc = [...builtInVaccines, ...customVacc]

  const openDateModal = (vacc) => {
    const existingDate = done[vacc.id]
    setDateModal({
      vacc,
      date: existingDate || todayDate(),
      isExisting: !!existingDate,
    })
  }

  const saveDate = () => {
    setDone({ ...done, [dateModal.vacc.id]: dateModal.date })
    setDateModal(null)
  }

  const unmark = () => {
    const next = { ...done }
    delete next[dateModal.vacc.id]
    setDone(next)
    setDateModal(null)
  }

  const addCustom = () => {
    if (!form.name.trim()) return
    const v = { id: genId(), name: form.name.trim(), when: form.when || `${form.months}. ${t('vacc.month_suffix')}`, months: Number(form.months), custom: true }
    setCustomVacc([...customVacc, v])
    setModal(false)
    setForm({ name: '', when: '', months: String(ageMonths) })
  }

  const removeCustom = (id) => {
    setCustomVacc(customVacc.filter(v => v.id !== id))
    const next = { ...done }
    delete next[id]
    setDone(next)
    setDeleteId(null)
  }

  const doneCount = Object.keys(done).length

  const renderVaccItem = (v, isCustom = false) => {
    const isDone = !!done[v.id]
    const isUpcoming = !isDone && v.months <= ageMonths + 2
    const dotClass = isDone ? 'vacc-done' : isUpcoming ? 'vacc-upcoming' : 'vacc-future'
    return (
      <div key={v.id} className="vacc-item" style={{cursor:'pointer'}} onClick={()=>openDateModal(v)}>
        <div className={`vacc-dot ${dotClass}`} />
        <div className="vacc-body">
          <div className="vacc-name" style={{textDecoration:isDone?'line-through':'none',color:isDone?'var(--text-3)':'var(--text)'}}>{v.name}</div>
          <div className="vacc-when">
            {v.when}
            {isDone && done[v.id] ? ` · ${t('vacc.done_on')} ${formatDate(done[v.id])}` : ''}
          </div>
        </div>
        {isDone && <span style={{fontSize:18}}>✅</span>}
        {isUpcoming && !isDone && <span className="badge badge-amber">{t('vacc.upcoming')}</span>}
        {isCustom && (
          <button aria-label={t('common.delete_aria')} onClick={e=>{e.stopPropagation();setDeleteId(v.id)}} style={{
            background:'none',border:'none',color:'var(--text-3)',fontSize:16,
            padding:'0 0 0 6px',minHeight:44,minWidth:36,cursor:'pointer'
          }}>✕</button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('vacc.title')}</div>
        <div className="section-desc">{t('vacc.desc', {scheme: t('vacc.scheme'), done: doneCount, total: allVacc.length, custom: customVacc.length})}</div>
      </div>

      <div className="warn-card">
        <strong>{t('vacc.important')}</strong> {t('vacc.warning')}
      </div>

      <div className="card">
        <div className="card-header">{t('vacc.scheme_header')}</div>
        {builtInVaccines.map(v => renderVaccItem(v, false))}
      </div>

      {customVacc.length > 0 && (
        <div className="card">
          <div className="card-header">{t('vacc.custom_header')}</div>
          {customVacc.map(v => renderVaccItem(v, true))}
        </div>
      )}

      <button className="btn-add" onClick={()=>{ setForm({name:'',when:'',months:String(ageMonths)}); setModal(true) }}>
        {t('vacc.add')}
      </button>

      {/* Date picker modal — opened on vaccine tap */}
      <Modal
        open={!!dateModal}
        onClose={()=>setDateModal(null)}
        title={dateModal?.vacc.name || ''}
      >
        {dateModal && (
          <>
            <div style={{
              padding:'10px 12px',
              background: dateModal.isExisting ? '#E1F5EE' : '#E6F1FB',
              borderRadius:8,
              fontSize:13,
              color: dateModal.isExisting ? '#085041' : '#0C447C',
              marginBottom:14,
            }}>
              {dateModal.isExisting
                ? t('vacc.edit_date_hint')
                : t('vacc.mark_date_hint', { when: dateModal.vacc.when })}
            </div>

            <div className="form-group">
              <label className="form-label">{t('vacc.done_on_label')}</label>
              <input
                className="form-input"
                type="date"
                value={dateModal.date}
                max={todayDate()}
                onChange={e => setDateModal(d => ({ ...d, date: e.target.value }))}
              />
              <div style={{fontSize:11, color:'var(--text-3)', marginTop:6}}>
                {t('vacc.date_hint')}
              </div>
            </div>

            <div className="modal-btns" style={{flexDirection:'column', gap:8}}>
              <button
                className="btn-primary"
                style={{width:'100%'}}
                onClick={saveDate}
              >
                {dateModal.isExisting ? t('common.save') : t('vacc.mark_done')}
              </button>
              {dateModal.isExisting && (
                <button
                  className="btn-secondary"
                  style={{width:'100%', background:'var(--coral-light)', color:'var(--coral)', border:'none'}}
                  onClick={unmark}
                >
                  {t('vacc.unmark')}
                </button>
              )}
              <button
                className="btn-secondary"
                style={{width:'100%'}}
                onClick={()=>setDateModal(null)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={modal} onClose={()=>setModal(false)} title={t('vacc.modal.title')}>
        <div className="form-group">
          <label className="form-label">{t('vacc.modal.name')}</label>
          <input className="form-input" type="text" maxLength={40} placeholder={t('vacc.name_ph')} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('vacc.modal.when')}</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="60"
            value={form.months}
            onChange={e=>setForm(f=>({...f,months:e.target.value,when:t('vacc.month_of_life', { month: e.target.value })}))}
          />
          <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>
            {t('vacc.month_hint')}
          </div>
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={addCustom}>{t('common.save')}</button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title={t('vacc.delete_title')}>
        <p style={{fontSize:14,color:'var(--text-2)',lineHeight:1.6}}>{t('vacc.delete_msg')}</p>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setDeleteId(null)}>{t('common.cancel')}</button>
          <button className="btn-primary" style={{background:'var(--coral)'}} onClick={()=>removeCustom(deleteId)}>{t('common.delete')}</button>
        </div>
      </Modal>
    </>
  )
}
