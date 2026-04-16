import React, { useState, useEffect, useRef } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { formatDuration, todayDate, uid } from '../utils/helpers'
import Modal from './Modal'
import { SectionAlerts } from './AlertBanner'
import InlineInsight from './InlineInsight'
import PremiumTeaser from './PremiumTeaser'
import { interpretSleep } from '../engine/interpretations'

export default function SleepTab({uid,  babyId, ageMonths, sectionAlerts = [], onNavigate, onDataChange, isPremium, onUpgrade }) {
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
      const entry = { id: uid(), date: todayDate(), durationMin: mins, label: 'Drzemka', manual: false }
      setLogs([entry, ...logs])
      setStartTs(null)
      setRunning(false)
      setElapsed(0)
      onDataChange?.()
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
    const entry = { id: uid(), date: form.date, durationMin: mins, label: form.label, manual: true }
    setLogs([entry, ...logs])
    setModal(false)
    onDataChange?.()
  }

  const remove = (id) => setLogs(logs.filter(l=>l.id!==id))

  return (
    <>
      <div className="section-header">
        <div className="section-title">Sen i drzemki</div>
        <div className="section-desc">Śledź czas snu dziecka</div>
      </div>

      <SectionAlerts alerts={sectionAlerts} onAction={onNavigate} />

      <div className="card">
        <div className="timer-display">
          <div className="timer-digits">{formatDuration(elapsed)}</div>
          <div className="timer-label">{running ? 'Trwa pomiar snu...' : 'Naciśnij, aby rozpocząć'}</div>
          <button className={`timer-btn ${running?'stop':'start'}`} onClick={toggle}>
            {running ? 'Obudził/-a się ☀️' : 'Zasnął/-a 🌙'}
          </button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-val">{totalMin >= 60 ? `${Math.floor(totalMin/60)}h${totalMin%60>0?` ${totalMin%60}m`:''}` : `${totalMin}m`}</div>
          <div className="stat-lbl">łącznie dziś</div>
        </div>
        <div className="stat-card"><div className="stat-val">{todayLogs.length}</div><div className="stat-lbl">sesje snu</div></div>
        <div className="stat-card"><div className="stat-val">{norm}h</div><div className="stat-lbl">norma wiekowa</div></div>
      </div>

      {isPremium
        ? <InlineInsight insight={interpretSleep(logs, ageMonths)} />
        : <PremiumTeaser label="Ocena jakości snu" onUpgrade={onUpgrade} />}

      <div className="card">
        <div className="card-header">Historia snu</div>
        {logs.slice(0,20).length === 0
          ? <div className="empty-state"><div className="empty-icon">🌙</div><p>Brak zapisanych drzemek</p></div>
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
        + Dodaj ręcznie
      </button>

      <Modal open={modal} onClose={() => setModal(false)} title="Dodaj sen">
        <div className="form-group">
          <label className="form-label">Typ</label>
          <select className="form-select" value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))}>
            <option>Drzemka</option>
            <option>Sen nocny</option>
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Zasnął/-a</label>
            <input className="form-input" type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Obudził/-a się</label>
            <input className="form-input" type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Data</label>
          <input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>Anuluj</button>
          <button className="btn-primary" onClick={addManual}>Zapisz</button>
        </div>
      </Modal>
    </>
  )
}
