import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { VACCINATIONS } from '../data/staticData'
import { todayDate, genId} from '../utils/helpers'
import Modal from './Modal'
import { t, useLocale } from '../i18n'

export default function VaccinationsTab({uid, babyId, ageMonths }) {
  useLocale()
  const [done, setDone] = useFirestore(uid, `vacc_${babyId}`, {})
  const [customVacc, setCustomVacc] = useFirestore(uid, `vacc_custom_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', when: '', months: String(ageMonths) })

  const allVacc = [...VACCINATIONS, ...customVacc]

  const toggle = (id) => {
    const next = { ...done }
    if (next[id]) { delete next[id] } else { next[id] = todayDate() }
    setDone(next)
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
        {VACCINATIONS.map(v => {
          const isDone = !!done[v.id]
          const isUpcoming = !isDone && v.months <= ageMonths + 2
          const dotClass = isDone ? 'vacc-done' : isUpcoming ? 'vacc-upcoming' : 'vacc-future'
          return (
            <div key={v.id} className="vacc-item" onClick={()=>toggle(v.id)} style={{cursor:'pointer'}}>
              <div className={`vacc-dot ${dotClass}`} />
              <div className="vacc-body">
                <div className="vacc-name" style={{textDecoration:isDone?'line-through':'none',color:isDone?'var(--text-3)':'var(--text)'}}>{v.name}</div>
                <div className="vacc-when">{v.when}{isDone && done[v.id] ? ` · Wykonano: ${done[v.id]}` : ''}</div>
              </div>
              {isDone && <span style={{fontSize:18}}>✅</span>}
              {isUpcoming && !isDone && <span className="badge badge-amber">{t('vacc.upcoming')}</span>}
            </div>
          )
        })}
      </div>

      {customVacc.length > 0 && (
        <div className="card">
          <div className="card-header">{t('vacc.custom_header')}</div>
          {customVacc.map(v => {
            const isDone = !!done[v.id]
            const isUpcoming = !isDone && v.months <= ageMonths + 2
            const dotClass = isDone ? 'vacc-done' : isUpcoming ? 'vacc-upcoming' : 'vacc-future'
            return (
              <div key={v.id} className="vacc-item" style={{cursor:'pointer'}}>
                <div className={`vacc-dot ${dotClass}`} onClick={()=>toggle(v.id)} />
                <div className="vacc-body" onClick={()=>toggle(v.id)}>
                  <div className="vacc-name" style={{textDecoration:isDone?'line-through':'none',color:isDone?'var(--text-3)':'var(--text)'}}>{v.name}</div>
                  <div className="vacc-when">{v.when}{isDone && done[v.id] ? ` · Wykonano: ${done[v.id]}` : ''}</div>
                </div>
                {isDone && <span style={{fontSize:18}}>✅</span>}
                {isUpcoming && !isDone && <span className="badge badge-amber">{t('vacc.upcoming')}</span>}
                <button onClick={e=>{e.stopPropagation();setDeleteId(v.id)}} style={{
                  background:'none',border:'none',color:'var(--text-3)',fontSize:16,
                  padding:'0 0 0 6px',minHeight:44,minWidth:36,cursor:'pointer'
                }}>✕</button>
              </div>
            )
          })}
        </div>
      )}

      <button className="btn-add" onClick={()=>{ setForm({name:'',when:'',months:String(ageMonths)}); setModal(true) }}>
        {t('vacc.add')}
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title={t('vacc.modal.title')}>
        <div className="form-group">
          <label className="form-label">{t('vacc.modal.name')}</label>
          <input className="form-input" type="text" placeholder="np. Meningokoki, Rotawirusy..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('vacc.modal.when')}</label>
            <input className="form-input" type="number" min="0" max="60" value={form.months} onChange={e=>setForm(f=>({...f,months:e.target.value,when:`${e.target.value}. miesiąc`}))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('vacc.modal.when_label')}</label>
            <input className="form-input" type="text" placeholder={t('vacc.modal.when_ph')} value={form.when} onChange={e=>setForm(f=>({...f,when:e.target.value}))} />
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
