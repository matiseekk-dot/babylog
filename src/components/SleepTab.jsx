import React, { useState, useEffect, useRef } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { formatDuration, todayDate, genId } from '../utils/helpers'
import Modal from './Modal'
import { toast } from './Toast'
import { t, useLocale } from '../i18n'
import { SectionAlerts } from './AlertBanner'
import InlineInsight from './InlineInsight'
import PremiumTeaser from './PremiumTeaser'
import { interpretSleep } from '../engine/interpretations'

export default function SleepTab({uid, babyId, ageMonths, sectionAlerts = [], onNavigate, onDataChange, isPremium, onUpgrade }) {
  useLocale()
  const [logs, setLogs] = useFirestore(uid, `sleep_${babyId}`, [])
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startTs, setStartTs] = useFirestore(uid, `sleep_timer_${babyId}`, null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ date: todayDate(), startTime: '20:00', endTime: '07:00', label: 'Drzemka' })
  const intervalRef = useRef(null)

  useEffect(() => {
    if (startTs) {
      setRunning(true)
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTs) / 1000))
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [])

  const toggle = () => {
    if (!running) {
      const ts = Date.now()
      setStartTs(ts)
      setRunning(true)
      setElapsed(0)
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - ts) / 1000))
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
      const dur = Math.floor((Date.now() - startTs) / 1000)
      const mins = Math.round(dur / 60)
      // Use SLEEP START date, not wake-up date — so sleep crossing midnight
      // is attributed to the day you went to bed, not the day you woke up
      const startDate = new Date(startTs).toISOString().slice(0,10)
      const entry = { id: genId(), date: startDate, durationMin: mins, label: 'Drzemka', manual: false, startTs, endTs: Date.now() }
      setLogs([entry, ...logs])
      setStartTs(null)
      setRunning(false)
      setElapsed(0)
      onDataChange?.()
      // Enhanced: show total daily sleep after wake-up
      const today = todayDate()
      const updatedLogs = [entry, ...logs]
      const todaysTotalMin = updatedLogs
        .filter(l => l.date === today)
        .reduce((s, l) => s + (l.durationMin || 0), 0)
      const h = Math.floor(todaysTotalMin / 60)
      const m = todaysTotalMin % 60
      const sessionH = Math.floor(dur / 3600)
      const sessionM = Math.floor((dur % 3600) / 60)
      const sessionStr = sessionH > 0 ? `${sessionH}h ${sessionM}m` : `${sessionM}m`
      const totalStr = h > 0 ? `${h}h ${m}m` : `${m}m`
      toast(`${t('toast.sleep_ended')}: ${sessionStr} • ${t('sleep.today_total')}: ${totalStr}`)
    }
  }

  const today = todayDate()
  const todayLogs = logs.filter(l => l.date === today)
  const totalMin = todayLogs.reduce((s,l)=>s+(l.durationMin||0),0)
  const norm = ageMonths < 3 ? 16 : ageMonths < 6 ? 14 : ageMonths < 12 ? 12 : 11

  const addManual = () => {
    const [sh,sm] = form.startTime.split(':').map(Number)
    const [eh,em] = form.endTime.split(':').map(Number)
    let mins = (eh*60+em) - (sh*60+sm)
    if (mins < 0) mins += 24*60
    const entry = { id: genId(), date: form.date, durationMin: mins, label: form.label, manual: true }
    setLogs([entry, ...logs])
    setModal(false)
    onDataChange?.()
  }

  const remove = (id) => setLogs(logs.filter(l=>l.id!==id))

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('sleep.title')}</div>
        <div className="section-desc">{t('sleep.desc')}</div>
      </div>

      <SectionAlerts alerts={sectionAlerts} onAction={onNavigate} />

      <div className="card">
        <div className="timer-display">
          <div className="timer-digits">{formatDuration(elapsed)}</div>
          <div className="timer-label">{running ? t('sleep.timer_running') : t('sleep.timer_idle')}</div>
          <button className={`timer-btn ${running?'stop':'start'}`} onClick={toggle}>
            {running ? t('sleep.btn.wake') : t('sleep.btn.sleep')}
          </button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-val">{totalMin >= 60 ? `${Math.floor(totalMin/60)}h${totalMin%60>0?` ${totalMin%60}m`:''}` : `${totalMin}m`}</div>
          <div className="stat-lbl">{t('sleep.today_total')}</div>
        </div>
        <div className="stat-card"><div className="stat-val">{todayLogs.length}</div><div className="stat-lbl">sesje snu</div></div>
        <div className="stat-card"><div className="stat-val">{norm}h</div><div className="stat-lbl">{t('sleep.norm_label')}</div></div>
      </div>

      {isPremium
        ? <InlineInsight insight={interpretSleep(logs, ageMonths)} />
        : <PremiumTeaser label={t('sleep.premium.quality')} onUpgrade={onUpgrade} />}

      <div className="card">
        <div className="card-header">Historia snu</div>
        {logs.slice(0,20).length === 0
          ? <div className="empty-state"><div className="empty-icon">🌙</div><p>{t('sleep.empty')}</p></div>
          : logs.slice(0,20).map(l => {
              const h = Math.floor(l.durationMin/60)
              const m = l.durationMin % 60
              return (
                <div className="log-item" key={l.id}>
                  <div className="log-icon">🌙</div>
                  <div className="log-body">
                    <div className="log-name">{l.label}</div>
                    <div className="log-detail">{h > 0 ? `${h}h ` : ''}{m > 0 ? `${m} min` : ''} · {l.date}</div>
                  </div>
                  <button onClick={()=>remove(l.id)} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
                </div>
              )
            })
        }
      </div>

      <button className="btn-add" onClick={() => { setForm(f=>({...f,date:todayDate()})); setModal(true) }}>
        {t('sleep.add_manual')}
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title={t('sleep.modal.title')}>
        <div className="form-group">
          <label className="form-label">{t('sleep.modal.type')}</label>
          <select className="form-select" value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))}>
            <option value="Drzemka">{t('sleep.type.nap')}</option>
            <option value="Sen nocny">{t('sleep.type.night')}</option>
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.fell_asleep')}</label>
            <input className="form-input" type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.woke_up')}</label>
            <input className="form-input" type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('common.date')}</label>
          <input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={addManual}>{t('common.save')}</button>
        </div>
      </Modal>
    </>
  )
}
