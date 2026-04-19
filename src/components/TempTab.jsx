import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { nowTime, todayDate, genId, getTempClass, getTempLabel } from '../utils/helpers'
import Modal from './Modal'
import { toast } from './Toast'
import { SectionAlerts } from './AlertBanner'
import InlineInsight from './InlineInsight'
import PremiumTeaser from './PremiumTeaser'
import TempChart from './TempChart'
import { interpretTemp } from '../engine/interpretations'
import { t, useLocale } from '../i18n'

export default function TempTab({uid, babyId, sectionAlerts = [], onNavigate, onDataChange, isPremium, onUpgrade }) {
  useLocale()
  const [logs, setLogs] = useFirestore(uid, `temp_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ temp:'37.0', time:nowTime(), date:todayDate(), method:'Odbytniczo', note:'' })

  const add = () => {
    setLogs([{ id:genId(), ...form, temp:Number(form.temp) }, ...logs])
    setModal(false)
    setForm({ temp:'37.0', time:nowTime(), date:todayDate(), method:'Odbytniczo', note:'' })
    onDataChange?.()
    toast(`${t('toast.temp')}: ${Number(form.temp).toFixed(1)}°C`)
  }

  const today = todayDate()
  const todayLogs = logs.filter(l=>l.date===today).sort((a,b)=>b.time.localeCompare(a.time))
  const last = todayLogs[0]


  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('temp.title')}</div>
        <div className="section-desc">{t('temp.desc')}</div>
      </div>

      <SectionAlerts alerts={sectionAlerts} onAction={onNavigate} />

      {last && (
        <div className="card" style={{padding:'16px 14px',margin:'8px 16px 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:40,fontWeight:700}} className={getTempClass(last.temp)}>{last.temp.toFixed(1)}°C</div>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:'var(--text)'}}>{getTempLabel(last.temp)}</div>
              <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{last.time} · {last.method}</div>
            </div>
          </div>
        </div>
      )}

      <TempChart logs={logs} />

      {isPremium
        ? <InlineInsight insight={interpretTemp(logs)} />
        : <PremiumTeaser label={t('temp.premium.analysis')} onUpgrade={onUpgrade} />}

      <div className="card">
        <div className="card-header">{t('temp.history')}</div>
        {logs.length === 0
          ? <div className="empty-state"><div className="empty-icon">🌡️</div><p>{t('temp.empty')}</p></div>
          : [...logs].sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time)).slice(0,20).map(l => (
            <div className="log-item" key={l.id}>
              <div className="log-icon">🌡️</div>
              <div className="log-body">
                <div className={`log-name ${getTempClass(l.temp)}`}>{Number(l.temp).toFixed(1)}°C — {getTempLabel(l.temp)}</div>
                <div className="log-detail">{l.date} {l.time} · {displayMethod(l.method)}{l.note?` · ${l.note}`:''}</div>
              </div>
              <button onClick={()=>{ setLogs(logs.filter(x=>x.id!==l.id)); onDataChange?.() }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
            </div>
          ))
        }
      </div>

      <button className="btn-add" onClick={()=>{ setForm(f=>({...f,time:nowTime(),date:todayDate()})); setModal(true) }}>
        {t('temp.add')}
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title={t('temp.modal.title')}>
        <div className="form-group">
          <label className="form-label">{t('temp.modal.value')}</label>
          <input className="form-input" type="number" step="0.1" min="35" max="42" value={form.temp} onChange={e=>setForm(f=>({...f,temp:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('temp.modal.method')}</label>
          <select className="form-select" value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}>
            <option value="Odbytniczo">{t('temp.method.rectal')}</option><option value="Pod pachą">{t('temp.method.axillary')}</option><option value="W uchu">{t('temp.method.ear')}</option><option value="Na czole">{t('temp.method.forehead')}</option>
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t('common.time')}</label><input className="form-input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">{t('common.date')}</label><input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
        </div>
        <div className="form-group"><label className="form-label">{t('temp.note_label')}</label><input className="form-input" type="text" placeholder="np. po Paracetamolu" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} /></div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={add}>{t('common.save')}</button>
        </div>
      </Modal>
    </>
  )
}
