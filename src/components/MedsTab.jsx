import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { nowTime, todayDate, genId, calcParacetamol, calcIbuprofen } from '../utils/helpers'
import Modal from './Modal'
import { SectionAlerts } from './AlertBanner'
import InlineInsight from './InlineInsight'
import PremiumTeaser from './PremiumTeaser'
import { interpretMeds } from '../engine/interpretations'
import { toast } from './Toast'
import { t, useLocale, isEN } from '../i18n'
import { useMedReminder } from '../hooks/useMedReminder'
import HistorySection from './HistorySection'

// W PL: cały built-in list. W EN: tylko Paracetamol + Ibuprofen (uniwersalne).
// Sól fizjologiczna i Probiotyk mają polskie instrukcje dawkowania w i18n —
// w EN można je dodać ręcznie jako custom jeśli user chce.
const BUILT_IN_MEDS_PL = ['Paracetamol','Ibuprofen','Sól fizjologiczna','Probiotyk']
const BUILT_IN_MEDS_EN = ['Paracetamol','Ibuprofen']
const EMOJI_OPTIONS = ['💊','🌡️','💨','🦠','🩹','🧴','💉','🩺','🌿','🍯','🧪','💧','🫀','🧬','⚕️']

export default function MedsTab({uid, babyId, ageMonths, weightKg, sectionAlerts = [], onNavigate, onDataChange, isPremium, onUpgrade }) {
  useLocale()
  // Translate stored Polish med names for display
  const displayMedName = (name) => {
    if (name === 'Paracetamol') return t('med.name.paracetamol')
    if (name === 'Ibuprofen') return t('med.name.ibuprofen')
    if (name === 'Sól fizjologiczna') return t('med.name.saline')
    if (name === 'Probiotyk') return t('med.name.probiotic')
    return name  // custom meds keep their name
  }
  const [logs, setLogs] = useFirestore(uid, `meds_${babyId}`, [])
  const [customMeds, setCustomMeds] = useFirestore(uid, `meds_custom_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [doseModal, setDoseModal] = useState(null)
  const [addMedModal, setAddMedModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ med:'Paracetamol', dose:'', time:nowTime(), date:todayDate(), note:'' })
  const [medForm, setMedForm] = useState({ name:'', emoji:'💊', dosage:'', notes:'' })

  const { permission, askPermission, scheduleReminder, cancelReminder, pendingReminders } = useMedReminder(babyId)

  const parac = calcParacetamol(weightKg)
  const ibu = calcIbuprofen(weightKg, ageMonths)
  const BUILT_IN_MEDS = isEN() ? BUILT_IN_MEDS_EN : BUILT_IN_MEDS_PL
  const allMedNames = [...BUILT_IN_MEDS, ...customMeds.map(m=>m.name), t('meds.other')]

  const openAdd = () => {
    setEditingId(null)
    setForm({ med:'Paracetamol', dose:'', time:nowTime(), date:todayDate(), note:'' })
    setModal(true)
  }

  const openEdit = (entry) => {
    setEditingId(entry.id)
    setForm({
      med: entry.med,
      dose: entry.dose || '',
      time: entry.time,
      date: entry.date,
      note: entry.note || '',
    })
    setModal(true)
  }

  const save = () => {
    if (editingId) {
      setLogs(logs.map(l => l.id === editingId ? { ...l, ...form } : l))
      toast(t('common.saved'))
    } else {
      const entry = { id:genId(), ...form }
      setLogs([entry, ...logs])
      if (permission === 'granted') scheduleReminder(entry)
    }
    setModal(false)
    setEditingId(null)
    setForm({ med:'Paracetamol', dose:'', time:nowTime(), date:todayDate(), note:'' })
  }

  const remove = (id) => setLogs(logs.filter(l=>l.id!==id))

  const logDoseFromModal = () => {
    if (!doseModal?.med) return
    const entry = {
      id: genId(),
      med: doseModal.med,
      dose: doseModal.suggestedDose || '',
      time: nowTime(),
      date: todayDate(),
      note: '',
    }
    setLogs([entry, ...logs])
    if (permission === 'granted') scheduleReminder(entry)
    setDoseModal(null)
    toast(t('meds.toast.logged', { med: displayMedName(doseModal.med) }))
  }

  const addCustomMed = () => {
    if (!medForm.name.trim()) return
    setCustomMeds([...customMeds, { id:genId(), ...medForm, name:medForm.name.trim() }])
    setAddMedModal(false)
    setMedForm({ name:'', emoji:'💊', dosage:'', notes:'' })
  }
  const removeCustomMed = (id) => { setCustomMeds(customMeds.filter(m=>m.id!==id)); setDeleteId(null) }

  const DOSE_INFO = {
    Paracetamol: { med:'Paracetamol', suggestedDose: parac.mlStd ? `${parac.mlStd} ml` : '', title:t('med.name.paracetamol'), content:[
      t('dose.paracetamol.single', {dose: parac.dose}),
      t('dose.paracetamol.susp120', {ml: parac.mlStd}),
      t('dose.paracetamol.susp240', {ml: parac.mlFort}),
      t('dose.paracetamol.max', {max: parac.maxDaily}),
      t('dose.for_weight', {kg: weightKg}),
    ] },
    Ibuprofen: { med:'Ibuprofen', suggestedDose: ibu?.ml ? `${ibu.ml} ml` : '', title:t('med.name.ibuprofen'), content: ibu ? [
      t('dose.ibuprofen.single', {dose: ibu.dose}),
      t('dose.ibuprofen.susp', {ml: ibu.ml}),
      t('dose.ibuprofen.max', {max: ibu.maxDaily}),
      t('dose.ibuprofen.min_age'),
      t('dose.for_weight', {kg: weightKg}),
    ] : [t('dose.ibuprofen.not_for_infants')] },
    'Sól fizjologiczna': { med:'Sól fizjologiczna', suggestedDose:'', title:t('med.name.saline'), content:[t('dose.saline.1'),t('dose.saline.2'),t('dose.saline.3'),t('dose.saline.4')] },
    Probiotyk: { med:'Probiotyk', suggestedDose:'', title:t('med.name.probiotic'), content:[t('dose.probiotic.1'),t('dose.probiotic.2'),t('dose.probiotic.3')] }
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('meds.title')}</div>
        <div className="section-desc">{weightKg > 0 ? t('meds.desc_with_weight', {weight: weightKg, months: ageMonths}) : t('meds.desc_no_weight')}</div>
      </div>
      <div className="card">
        <div className="card-header">{t('meds.calc.title')}</div>
        {(!weightKg || weightKg <= 0) ? (
          <div style={{ padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⚠️</div>
            <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:10, lineHeight:1.5 }}>
              {t('meds.calc.weight_needed')}
            </div>
            <button onClick={onNavigate ? () => onNavigate('settings') : undefined} style={{
              background:'var(--blue)', color:'#fff', border:'none', borderRadius:10,
              padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer',
            }}>
              {t('meds.calc.open_settings')}
            </button>
          </div>
        ) : BUILT_IN_MEDS.map(med => (
          <div className="log-item" key={med}>
            <div className="log-icon">{med==='Paracetamol'?'🌡️':med==='Ibuprofen'?'💊':med==='Sól fizjologiczna'?'💧':'🦠'}</div>
            <div className="log-body">
              <div className="log-name">{displayMedName(med)}</div>
              <div className="log-detail">
                {med==='Paracetamol' && `${parac.dose} mg → ${parac.mlStd} ml`}
                {med==='Ibuprofen' && (ibu ? `${ibu.dose} mg → ${ibu.ml} ml` : t('meds.below_3mo'))}
                {med==='Sól fizjologiczna' && t('meds.saline_dose')}
                {med==='Probiotyk' && t('meds.probiotic_dose')}
              </div>
            </div>
            <button onClick={()=>setDoseModal(DOSE_INFO[med])} style={{background:'var(--blue-light)',color:'var(--blue)',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,minHeight:36}}>{t('meds.dose_btn')}</button>
          </div>
        ))}
      </div>

      <div className="warn-card"><strong>{t('med.important')}</strong> {t('med.disclaimer')}</div>

      {/* Reminder permission banner */}
      {isPremium && permission !== 'granted' && permission !== 'unsupported' && (
        <div style={{margin:'8px 16px 0',padding:'10px 14px',background:'#E6F1FB',border:'0.5px solid #85B7EB',borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:16}}>🔔</span>
          <div style={{flex:1,fontSize:12,color:'#0C447C'}}>{t('med.remind_enable')}</div>
          <button onClick={askPermission} style={{background:'#185FA5',color:'#fff',border:'none',borderRadius:8,padding:'6px 12px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>{t('med.remind_btn')}</button>
        </div>
      )}

      {/* Pending reminders */}
      {isPremium && pendingReminders.length > 0 && (
        <div style={{margin:'8px 16px 0',display:'flex',flexDirection:'column',gap:4}}>
          {pendingReminders.map(r => (
            <div key={r.id} style={{padding:'9px 12px',background:r.minutesLeft<=0?'#E1F5EE':'#FEF9F0',border:`0.5px solid ${r.minutesLeft<=0?'#9FE1CB':'#FAC775'}`,borderRadius:10,display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:14}}>⏱️</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:r.minutesLeft<=0?'#085041':'#633806'}}>
                  {r.minutesLeft<=0 ? `${r.medName} — ${t('meds.reminder.now')}` : `${r.medName} — ${t('meds.reminder.in')} ${r.minutesLeft} min`}
                </div>
                {r.dose && <div style={{fontSize:11,color:'var(--text-3)'}}>{t('meds.reminder.dose_label')} {r.dose}</div>}
              </div>
              <button onClick={()=>cancelReminder(r.id)} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:14,cursor:'pointer',padding:4}}>✕</button>
            </div>
          ))}
        </div>
      )}
      <SectionAlerts alerts={sectionAlerts} onAction={onNavigate} />




      {customMeds.length > 0 && (
        <div className="card">
          <div className="card-header">{t('meds.custom.title')} ({customMeds.length})</div>
          {customMeds.map(m => (
            <div className="log-item" key={m.id}>
              <div className="log-icon">{m.emoji}</div>
              <div className="log-body">
                <div className="log-name">{m.name}</div>
                <div className="log-detail">{m.dosage || 'Wg ulotki / zalecenia lekarza'}</div>
              </div>
              <button onClick={()=>setDoseModal({ med:m.name, suggestedDose:'', title:m.name, content:[m.dosage,m.notes].filter(Boolean) })} style={{background:'var(--blue-light)',color:'var(--blue)',border:'none',borderRadius:8,padding:'6px 10px',fontSize:12,fontWeight:600,minHeight:36,marginRight:4}}>Info</button>
              <button onClick={()=>setDeleteId(m.id)} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,minHeight:44,minWidth:36,cursor:'pointer'}}>✕</button>
            </div>
          ))}
        </div>
      )}

      <button className="btn-add" onClick={()=>{ setMedForm({name:'',emoji:'💊',dosage:'',notes:''}); setAddMedModal(true) }}>{t('meds.add_custom')}</button>

      {isPremium
        ? <InlineInsight insight={interpretMeds(logs)} />
        : <PremiumTeaser label="Informacje o lekach" onUpgrade={onUpgrade} />}

      <div className="card" style={{marginTop:8}}>
        <div className="card-header">{t('feed.today')}</div>
        {(() => {
          const today = todayDate()
          const todayMeds = logs.filter(l => l.date === today)
          if (todayMeds.length === 0) {
            return <div className="empty-state"><div className="empty-icon">💊</div><p>{t('meds.history.empty')}</p></div>
          }
          return todayMeds.map(l => (
            <div className="log-item" key={l.id} onClick={() => openEdit(l)} style={{cursor:'pointer'}}>
              <div className="log-icon">💊</div>
              <div className="log-body"><div className="log-name">{displayMedName(l.med)}{l.dose?` – ${l.dose}`:''}</div><div className="log-detail">{l.time}{l.note?` · ${l.note}`:''}</div></div>
              <button onClick={e => { e.stopPropagation(); remove(l.id) }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
            </div>
          ))
        })()}
      </div>

      {/* HISTORIA leków — wpisy z wczoraj i wcześniej */}
      <HistorySection
        logs={logs}
        renderItem={(l, { onDelete }) => (
          <div className="log-item" key={l.id} onClick={() => openEdit(l)} style={{cursor:'pointer'}}>
            <div className="log-icon">💊</div>
            <div className="log-body"><div className="log-name">{displayMedName(l.med)}{l.dose?` – ${l.dose}`:''}</div><div className="log-detail">{l.time}{l.note?` · ${l.note}`:''}</div></div>
            <button onClick={e => { e.stopPropagation(); onDelete?.() }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
          </div>
        )}
        summarize={entries => t('summary.meds_doses', { count: entries.length })}
        onDelete={(log) => setLogs(logs.filter(l => l.id !== log.id))}
      />
      <button className="btn-add" onClick={openAdd}>+ Zapisz podanie leku</button>

      <Modal open={addMedModal} onClose={()=>setAddMedModal(false)} title={t('meds.add_custom.modal')}>
        <div className="form-group">
          <label className="form-label">Emoji leku</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={()=>setMedForm(f=>({...f,emoji:e}))} style={{width:40,height:40,fontSize:20,borderRadius:8,cursor:'pointer',border:`1.5px solid ${medForm.emoji===e?'var(--green)':'var(--border)'}`,background:medForm.emoji===e?'var(--green-light)':'var(--surface)'}}>{e}</button>
            ))}
          </div>
        </div>
        <div className="form-group"><label className="form-label">{t('meds.add_custom.name')}</label><input className="form-input" type="text" maxLength={100} placeholder={t("meds.custom.name_ph")} value={medForm.name} onChange={e=>setMedForm(f=>({...f,name:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">{t('meds.add_custom.dosage')}</label><input className="form-input" type="text" maxLength={100} placeholder={t("meds.custom.dosage_ph")} value={medForm.dosage} onChange={e=>setMedForm(f=>({...f,dosage:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">{t('meds.add_custom.notes')}</label><input className="form-input" type="text" maxLength={200} placeholder={t('meds.add_custom.notes_ph')} value={medForm.notes} onChange={e=>setMedForm(f=>({...f,notes:e.target.value}))} /></div>
        <div className="modal-btns"><button className="btn-secondary" onClick={()=>setAddMedModal(false)}>{t('common.cancel')}</button><button className="btn-primary" onClick={addCustomMed}>{t('common.save')}</button></div>
      </Modal>

      <Modal open={modal} onClose={() => { setModal(false); setEditingId(null) }} title={editingId ? t('common.edit') : t('meds.modal.title')}>
        <div className="form-group"><label className="form-label">{t('meds.modal.drug')}</label><select className="form-select" value={form.med} onChange={e=>setForm(f=>({...f,med:e.target.value}))}>{allMedNames.map(mn => (
            <option key={mn} value={mn}>
              {mn === 'Paracetamol'        ? t('med.name.paracetamol')
               : mn === 'Ibuprofen'        ? t('med.name.ibuprofen')
               : mn === 'Sól fizjologiczna'? t('med.name.saline')
               : mn === 'Probiotyk'        ? t('med.name.probiotic')
               : mn}
            </option>
          ))}</select></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t('meds.modal.dose')}</label><input className="form-input" type="text" maxLength={100} placeholder={t("meds.custom.dose_ph")} value={form.dose} onChange={e=>setForm(f=>({...f,dose:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">{t('common.time')}</label><input className="form-input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} /></div>
        </div>
        <div className="form-group"><label className="form-label">{t('common.date')}</label><input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Notatka</label><input className="form-input" type="text" maxLength={200} placeholder={t("common.optional_ph")} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} /></div>
        <div className="modal-btns"><button className="btn-secondary" onClick={() => { setModal(false); setEditingId(null) }}>{t('common.cancel')}</button><button className="btn-primary" onClick={save}>{t('common.save')}</button></div>
      </Modal>

      <Modal open={!!doseModal} onClose={()=>setDoseModal(null)} title={doseModal?.title}>
        {/* Prominent warning AT TOP of dose modal */}
        <div style={{
          background:'#FEF3EE', border:'1.5px solid #F0997B', borderRadius:10,
          padding:'12px 14px', marginBottom:14, fontSize:13, lineHeight:1.5,
          color:'#712B13', fontWeight:600,
        }}>
          {t('dose.modal.warning')}
        </div>

        {doseModal?.content.map((line,i) => (
          <div key={i} style={{fontSize:14,color:'var(--text)',padding:'6px 0',borderBottom:i<doseModal.content.length-1?'0.5px solid var(--border)':'none'}}>
            {line}
          </div>
        ))}

        {/* Footer disclaimer */}
        <div style={{
          marginTop:16, padding:'10px 12px',
          background:'#F7F7F5', borderRadius:8,
          fontSize:11, lineHeight:1.45, color:'var(--text-3)',
        }}>
          {t('dose.modal.footer')}
        </div>

        <div className="modal-btns" style={{marginTop:16, gap:8, flexDirection:'column'}}>
          {doseModal?.med && (
            <button
              onClick={logDoseFromModal}
              style={{
                width:'100%', background:'var(--green)', color:'#fff',
                border:'none', borderRadius:12, padding:'12px 16px',
                fontSize:14, fontWeight:700, cursor:'pointer', minHeight:48,
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}
            >
              ✓ {t('dose.modal.log_btn', { dose: doseModal.suggestedDose || '' })}
            </button>
          )}
          <button
            className="btn-secondary"
            style={{width:'100%'}}
            onClick={()=>setDoseModal(null)}
          >
            {t('common.close')}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title={t('meds.custom.delete_title')}>
        <p style={{fontSize:14,color:'var(--text-2)',lineHeight:1.6}}>{t('meds.custom.delete_msg')}</p>
        <div className="modal-btns"><button className="btn-secondary" onClick={()=>setDeleteId(null)}>{t('common.cancel')}</button><button className="btn-primary" style={{background:'var(--coral)'}} onClick={()=>removeCustomMed(deleteId)}>{t('common.delete')}</button></div>
      </Modal>
    </>
  )
}
