import React, { useState, Suspense } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { nowTime, todayDate, genId, getTempClass, getTempLabel, displayMethod } from '../utils/helpers'
import Modal from './Modal'
import { toast } from './Toast'
import { SectionAlerts } from './AlertBanner'
import InlineInsight from './InlineInsight'
import PremiumTeaser from './PremiumTeaser'
const TempChart = React.lazy(() => import('./TempChart'))
import { interpretTemp } from '../engine/interpretations'
import HistorySection from './HistorySection'
import { t, useLocale } from '../i18n'

export default function TempTab({uid, babyId, sectionAlerts = [], onNavigate, onDataChange, isPremium, onUpgrade }) {
  useLocale()
  const [logs, setLogs] = useFirestore(uid, `temp_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ temp:'37.0', time:nowTime(), date:todayDate(), method:'Odbytniczo', note:'' })

  const openAdd = () => {
    setEditingId(null)
    setForm({ temp:'37.0', time:nowTime(), date:todayDate(), method:'Odbytniczo', note:'' })
    setModal(true)
  }

  const openEdit = (entry) => {
    setEditingId(entry.id)
    setForm({
      temp: String(entry.temp),
      time: entry.time,
      date: entry.date,
      method: entry.method || 'Odbytniczo',
      note: entry.note || '',
    })
    setModal(true)
  }

  const save = () => {
    const tempValue = Number(form.temp)
    if (isNaN(tempValue) || tempValue < 30 || tempValue > 45) {
      toast(t('temp.invalid'))
      return
    }
    if (editingId) {
      setLogs(logs.map(l => l.id === editingId ? { ...l, ...form, temp: tempValue } : l))
      toast(t('common.saved'))
    } else {
      setLogs([{ id: genId(), ...form, temp: tempValue }, ...logs])
      toast(`${t('toast.temp')}: ${tempValue.toFixed(1)}°C`)
    }
    setModal(false)
    setEditingId(null)
    setForm({ temp:'37.0', time:nowTime(), date:todayDate(), method:'Odbytniczo', note:'' })
    onDataChange?.()
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
              <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{last.time} · {displayMethod(last.method)}</div>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={<div style={{padding:'20px',textAlign:'center',color:'var(--text-3)',fontSize:13}}>{t('chart.loading')}</div>}>
        <TempChart logs={logs} />
      </Suspense>

      {isPremium
        ? <InlineInsight insight={interpretTemp(logs)} />
        : <PremiumTeaser label={t('temp.premium.analysis')} onUpgrade={onUpgrade} />}

      <div className="card">
        <div className="card-header">{t('feed.today')}</div>
        {todayLogs.length === 0
          ? <div className="empty-state"><div className="empty-icon">🌡️</div><p>{t('temp.empty')}</p></div>
          : todayLogs.map(l => (
            <div className="log-item" key={l.id} onClick={() => openEdit(l)} style={{cursor:'pointer'}}>
              <div className="log-icon">🌡️</div>
              <div className="log-body">
                <div className={`log-name ${getTempClass(l.temp)}`}>{Number(l.temp).toFixed(1)}°C — {getTempLabel(l.temp)}</div>
                <div className="log-detail">{l.time} · {displayMethod(l.method)}{l.note?` · ${l.note}`:''}</div>
              </div>
              <button aria-label="Usuń wpis" onClick={e => { e.stopPropagation(); setLogs(logs.filter(x=>x.id!==l.id)); onDataChange?.() }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
            </div>
          ))
        }
      </div>

      {/* HISTORIA pomiarów temperatury — wpisy z wczoraj i wcześniej */}
      <HistorySection
        logs={logs}
        renderItem={(l, { onDelete }) => (
          <div className="log-item" key={l.id} onClick={() => openEdit(l)} style={{cursor:'pointer'}}>
            <div className="log-icon">🌡️</div>
            <div className="log-body">
              <div className={`log-name ${getTempClass(l.temp)}`}>{Number(l.temp).toFixed(1)}°C — {getTempLabel(l.temp)}</div>
              <div className="log-detail">{l.time} · {displayMethod(l.method)}{l.note?` · ${l.note}`:''}</div>
            </div>
            <button aria-label="Usuń wpis" onClick={e => { e.stopPropagation(); onDelete?.() }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
          </div>
        )}
        summarize={entries => {
          const max = Math.max(...entries.map(e => Number(e.temp) || 0))
          return `${entries.length}× · max ${max.toFixed(1)}°C`
        }}
        onDelete={(log) => { setLogs(logs.filter(x => x.id !== log.id)); onDataChange?.() }}
      />

      <button className="btn-add" onClick={openAdd}>
        {t('temp.add')}
      </button>

      <Modal open={modal} onClose={() => { setModal(false); setEditingId(null) }} title={editingId ? t('common.edit') : t('temp.modal.title')}>
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
        <div className="form-group"><label className="form-label">{t('temp.note_label')}</label><input className="form-input" type="text" maxLength={200} placeholder={t("temp.note_after_med_ph")} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} /></div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={() => { setModal(false); setEditingId(null) }}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={save}>{t('common.save')}</button>
        </div>
      </Modal>
    </>
  )
}
