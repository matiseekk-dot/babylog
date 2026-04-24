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
import HistorySection from './HistorySection'

export default function SleepTab({uid, babyId, ageMonths, sectionAlerts = [], onNavigate, onDataChange, isPremium, onUpgrade }) {
  useLocale()
  const [logs, setLogs] = useFirestore(uid, `sleep_${babyId}`, [])
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startTs, setStartTs] = useFirestore(uid, `sleep_timer_${babyId}`, null)
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ date: todayDate(), startTime: '20:00', endTime: '07:00', label: 'Drzemka' })
  const intervalRef = useRef(null)

  // FIX: Dependency [startTs] zamiast [] — żeby effect reagował gdy Firestore
  // załaduje zapisany timestamp async (po otwarciu apki). Bez tego stoper
  // po re-otwarciu apki nie widział że sesja trwa i pokazywał 0.
  useEffect(() => {
    clearInterval(intervalRef.current)

    if (startTs) {
      setRunning(true)
      setElapsed(Math.floor((Date.now() - startTs) / 1000))
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTs) / 1000))
      }, 1000)
    } else {
      setRunning(false)
      setElapsed(0)
    }
    return () => clearInterval(intervalRef.current)
  }, [startTs])

  const toggle = () => {
    if (!running) {
      setStartTs(Date.now())
    } else {
      const dur = Math.floor((Date.now() - startTs) / 1000)
      const mins = Math.round(dur / 60)
      const startDate = new Date(startTs).toISOString().slice(0,10)
      const entry = { id: genId(), date: startDate, durationMin: mins, label: 'Drzemka', manual: false, startTs, endTs: Date.now() }
      setLogs([entry, ...logs])
      setStartTs(null)
      onDataChange?.()
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

  // Pomocnik: z durationMin + ewentualnego startTs wyciągnij startTime/endTime
  // do wyświetlenia w modalu edycji. Jeśli wpis był manualny, rekonstruujemy
  // na podstawie durationMin (start = 20:00 domyślnie, end = start + duration).
  const durationToTimes = (entry) => {
    if (entry.startTs && entry.endTs) {
      const s = new Date(entry.startTs)
      const e = new Date(entry.endTs)
      return {
        startTime: `${String(s.getHours()).padStart(2,'0')}:${String(s.getMinutes()).padStart(2,'0')}`,
        endTime:   `${String(e.getHours()).padStart(2,'0')}:${String(e.getMinutes()).padStart(2,'0')}`,
      }
    }
    // Fallback dla starych manualnych wpisów: zakładamy start 20:00
    const startH = 20
    const startM = 0
    const totalM = startH * 60 + startM + (entry.durationMin || 0)
    const endH = Math.floor((totalM / 60) % 24)
    const endM = totalM % 60
    return {
      startTime: `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`,
      endTime:   `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`,
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({ date: todayDate(), startTime: '20:00', endTime: '07:00', label: 'Drzemka' })
    setModal(true)
  }

  const openEdit = (entry) => {
    setEditingId(entry.id)
    const { startTime, endTime } = durationToTimes(entry)
    setForm({
      date: entry.date,
      startTime,
      endTime,
      label: entry.label || 'Drzemka',
    })
    setModal(true)
  }

  const save = () => {
    const [sh,sm] = form.startTime.split(':').map(Number)
    const [eh,em] = form.endTime.split(':').map(Number)
    let mins = (eh*60+em) - (sh*60+sm)
    if (mins < 0) mins += 24*60

    if (editingId) {
      // Przy edycji: zachowujemy startTs/endTs jeśli oryginalnie były (ze stopera),
      // ale aktualizujemy durationMin + label + date na podstawie nowych wartości
      setLogs(logs.map(l => {
        if (l.id !== editingId) return l
        const updated = { ...l, date: form.date, durationMin: mins, label: form.label }
        // Jeśli wpis miał startTs/endTs — przeliczamy na nowe godziny z form
        if (l.startTs) {
          const newStart = new Date(form.date + 'T' + form.startTime + ':00').getTime()
          const newEnd = newStart + mins * 60000
          updated.startTs = newStart
          updated.endTs = newEnd
        }
        return updated
      }))
      toast(t('common.saved'))
    } else {
      const entry = { id: genId(), date: form.date, durationMin: mins, label: form.label, manual: true }
      setLogs([entry, ...logs])
    }
    setModal(false)
    setEditingId(null)
    setForm({ date: todayDate(), startTime: '20:00', endTime: '07:00', label: 'Drzemka' })
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
        <div className="card-header">{t('feed.today')}</div>
        {todayLogs.length === 0
          ? <div className="empty-state"><div className="empty-icon">🌙</div><p>{t('sleep.empty')}</p></div>
          : todayLogs.map(l => {
              const h = Math.floor(l.durationMin/60)
              const m = l.durationMin % 60
              return (
                <div className="log-item" key={l.id} onClick={() => openEdit(l)} style={{cursor:'pointer'}}>
                  <div className="log-icon">🌙</div>
                  <div className="log-body">
                    <div className="log-name">{l.label}</div>
                    <div className="log-detail">{h > 0 ? `${h}h ` : ''}{m > 0 ? `${m} min` : ''}</div>
                  </div>
                  <button aria-label="Usuń wpis" onClick={e => { e.stopPropagation(); remove(l.id) }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
                </div>
              )
            })
        }
      </div>

      {/* HISTORIA snu — wpisy z wczoraj i wcześniej */}
      <HistorySection
        logs={logs}
        renderItem={(l, { onDelete }) => {
          const h = Math.floor(l.durationMin/60)
          const m = l.durationMin % 60
          return (
            <div className="log-item" key={l.id} onClick={() => openEdit(l)} style={{cursor:'pointer'}}>
              <div className="log-icon">🌙</div>
              <div className="log-body">
                <div className="log-name">{l.label}</div>
                <div className="log-detail">{h > 0 ? `${h}h ` : ''}{m > 0 ? `${m} min` : ''}</div>
              </div>
              <button aria-label="Usuń wpis" onClick={e => { e.stopPropagation(); onDelete?.() }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
            </div>
          )
        }}
        summarize={entries => {
          const totalMin = entries.reduce((s, e) => s + (e.durationMin || 0), 0)
          const h = Math.floor(totalMin / 60)
          const m = totalMin % 60
          return `${entries.length}× · ${h}h ${m}m`
        }}
        onDelete={(log) => setLogs(logs.filter(l => l.id !== log.id))}
      />

      <button className="btn-add" onClick={openAdd}>
        {t('sleep.add_manual')}
      </button>

      <Modal open={modal} onClose={() => { setModal(false); setEditingId(null) }} title={editingId ? t('common.edit') : t('sleep.modal.title')}>
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
          <button className="btn-secondary" onClick={() => { setModal(false); setEditingId(null) }}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={save}>{t('common.save')}</button>
        </div>
      </Modal>
    </>
  )
}
