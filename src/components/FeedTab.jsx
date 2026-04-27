import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { nowTime, todayDate, genId } from '../utils/helpers'
import Modal from './Modal'
import { SectionAlerts } from './AlertBanner'
import { toast, toastWithUndo } from './Toast'
import { t, tPlural, useLocale } from '../i18n'
import HistorySection from './HistorySection'

const TYPES = ['Pierś lewa','Pierś prawa','Butelka','Odciągnięte mleko']

// Szybkie przyciski — jedno tapnięcie zapisuje z aktualną godziną
function getQuickBtns() {
  return [
    { type:'Pierś lewa',  emoji:'🤱', label:t('feed.quick.left'),   amount:'15', color:'#E1F5EE', textColor:'#085041' },
    { type:'Pierś prawa', emoji:'🤱', label:t('feed.quick.right'),  amount:'15', color:'#E1F5EE', textColor:'#085041' },
    { type:'Butelka',     emoji:'🍼', label:t('feed.quick.bottle'), amount:'120',color:'#E6F1FB', textColor:'#0C447C' },
  ]
}

export default function FeedTab({uid, babyId, sectionAlerts = [], onNavigate, onDataChange }) {
  useLocale()
  const QUICK_BTNS = getQuickBtns()
  const [logs, setLogs] = useFirestore(uid, `feed_${babyId}`, [])

  // Smart suggestion — suggest opposite breast from last feed
  const lastBreastFeed = logs.find(l => l.type?.startsWith('Pierś'))
  const suggestedType = lastBreastFeed
    ? (lastBreastFeed.type === 'Pierś lewa' ? 'Pierś prawa' : 'Pierś lewa')
    : null
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ type:'Pierś lewa', amount:'15', time: nowTime(), date: todayDate() })

  const today = todayDate()
  const todayLogs = logs.filter(l => l.date === today).sort((a,b) => b.time.localeCompare(a.time))
  const totalMl = todayLogs.filter(l=>l.type==='Butelka'||l.type==='Odciągnięte mleko').reduce((s,l)=>s+Number(l.amount||0),0)
  const breastCount = todayLogs.filter(l=>l.type.startsWith('Pierś')).length
  const lastLog = todayLogs[0]
  const lastAgo = lastLog ? (() => {
    const [h,m] = lastLog.time.split(':').map(Number)
    const now = new Date(); const then = new Date(); then.setHours(h,m,0,0)
    const diff = Math.floor((now-then)/60000)
    if (diff < 60) return `${diff} min`
    return `${Math.floor(diff/60)}h ${diff%60}m`
  })() : '—'

  const quickAdd = (type, amount) => {
    const entry = { id: genId(), type, amount, time: nowTime(), date: todayDate() }
    setLogs([entry, ...logs])
    onDataChange?.()
    toast(`${t('common.saved')}: ${type}`)
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({ type:'Pierś lewa', amount:'15', time: nowTime(), date: todayDate() })
    setModal(true)
  }

  const openEdit = (entry) => {
    setEditingId(entry.id)
    setForm({
      type: entry.type,
      amount: String(entry.amount ?? ''),
      time: entry.time,
      date: entry.date,
    })
    setModal(true)
  }

  const save = () => {
    if (editingId) {
      setLogs(logs.map(l => l.id === editingId ? { ...l, ...form } : l))
      toast(t('common.saved'))
    } else {
      setLogs([{ id: genId(), ...form }, ...logs])
      toast(t('feed.toast.saved'))
    }
    setModal(false)
    setEditingId(null)
    setForm({ type:'Pierś lewa', amount:'15', time: nowTime(), date: todayDate() })
    onDataChange?.()
  }

  const remove = (id) => {
    const removed = logs.find(l => l.id === id)
    if (!removed) return
    setLogs(logs.filter(l => l.id !== id))
    onDataChange?.()
    toastWithUndo(t('common.deleted'), () => {
      setLogs(prev => [removed, ...prev])
      onDataChange?.()
    })
  }
  const isBottle = form.type==='Butelka'||form.type==='Odciągnięte mleko'

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('feed.title')}</div>
        <div className="section-desc">{t('feed.desc')}</div>
      </div>

      <SectionAlerts alerts={sectionAlerts} onAction={onNavigate} />

      {/* Szybkie przyciski — jedno tapnięcie */}
      <div style={{ display:'flex', gap:8, margin:'10px 16px 0' }}>
        {QUICK_BTNS.map(b => {
          const isSuggested = b.type === suggestedType
          return (
            <button
              key={b.type}
              onClick={() => quickAdd(b.type, b.amount)}
              style={{
                flex:1, minHeight:64, border: isSuggested ? '2px solid #1D9E75' : 'none',
                borderRadius:14,
                background: isSuggested ? '#C5E8D9' : b.color,
                color:b.textColor,
                fontSize:12, fontWeight:700, cursor:'pointer',
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:2,
                whiteSpace:'pre-line', lineHeight:1.2, position:'relative',
              }}
            >
              {isSuggested && (
                <div style={{
                  position:'absolute', top:-7, right:-4,
                  fontSize:9, fontWeight:800, color:'#fff',
                  background:'#1D9E75', borderRadius:10,
                  padding:'2px 6px',
                }}>
                  ↻
                </div>
              )}
              <span style={{fontSize:22}}>{b.emoji}</span>
              {b.label}
            </button>
          )
        })}
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="stat-val">{todayLogs.length}</div><div className="stat-lbl">{t('feed.stat.count')}</div></div>
        <div className="stat-card"><div className="stat-val">{totalMl > 0 ? `${totalMl}ml` : `${breastCount}×`}</div><div className="stat-lbl">{totalMl > 0 ? t('feed.stat.bottle') : t('feed.stat.breast')}</div></div>
        <div className="stat-card"><div className="stat-val">{lastAgo}</div><div className="stat-lbl">{t('feed.stat.ago')}</div></div>
      </div>

      <div className="card">
        <div className="card-header">{t('feed.today')}</div>
        {todayLogs.length === 0
          ? <div className="empty-state">
              <div className="empty-icon">🍼</div>
              <p>{t('feed.empty')}</p>
            </div>
          : todayLogs.map(l => (
            <div className="log-item" key={l.id} onClick={() => openEdit(l)} style={{cursor:'pointer'}}>
              <div className="log-icon">{l.type.startsWith('Pierś') ? '🤱' : '🍼'}</div>
              <div className="log-body">
                <div className="log-name">{
                  l.type === 'Pierś lewa'       ? t('feed.type.left')
                : l.type === 'Pierś prawa'      ? t('feed.type.right')
                : l.type === 'Butelka'          ? t('feed.type.bottle')
                : l.type === 'Odciągnięte mleko'? t('feed.type.pumped')
                : l.type
              }</div>
                <div className="log-detail">{l.type==='Butelka'||l.type==='Odciągnięte mleko' ? `${l.amount} ml` : `${l.amount} min`}</div>
              </div>
              <div className="log-time">{l.time}</div>
              <button aria-label={t('common.delete_aria')} onClick={e => { e.stopPropagation(); remove(l.id) }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
            </div>
          ))
        }
      </div>

      {/* HISTORIA — wpisy z wczoraj i wcześniej, collapsible */}
      <HistorySection
        logs={logs}
        renderItem={(l, { onDelete }) => (
          <div className="log-item" key={l.id} onClick={() => openEdit(l)} style={{cursor:'pointer'}}>
            <div className="log-icon">{l.type.startsWith('Pierś') ? '🤱' : '🍼'}</div>
            <div className="log-body">
              <div className="log-name">{
                l.type === 'Pierś lewa'       ? t('feed.type.left')
              : l.type === 'Pierś prawa'      ? t('feed.type.right')
              : l.type === 'Butelka'          ? t('feed.type.bottle')
              : l.type === 'Odciągnięte mleko'? t('feed.type.pumped')
              : l.type
            }</div>
              <div className="log-detail">{l.type==='Butelka'||l.type==='Odciągnięte mleko' ? `${l.amount} ml` : `${l.amount} min`}</div>
            </div>
            <div className="log-time">{l.time}</div>
            <button aria-label={t('common.delete_aria')} onClick={e => { e.stopPropagation(); onDelete?.() }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
          </div>
        )}
        summarize={entries => {
          const breast = entries.filter(e => e.type.startsWith('Pierś')).length
          const ml = entries.filter(e => e.type === 'Butelka' || e.type === 'Odciągnięte mleko')
                            .reduce((s, e) => s + Number(e.amount || 0), 0)
          const parts = []
          if (breast > 0) parts.push(t('summary.feed_breast', { count: breast }))
          if (ml > 0) parts.push(t('summary.feed_bottle_ml', { ml }))
          return parts.join(' · ') || tPlural('summary.entries', entries.length)
        }}
        onDelete={(log) => setLogs(logs.filter(l => l.id !== log.id))}
      />

      <button className="btn-add" onClick={openAdd}>
        {t('feed.add_detail')}
      </button>

      <Modal open={modal} onClose={() => { setModal(false); setEditingId(null) }} title={editingId ? t('common.edit') : t('feed.modal.title')}>
        <div className="form-group">
          <label className="form-label">{t('feed.modal.type')}</label>
          <select className="form-select" value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value,amount:e.target.value.startsWith('Pierś')?'15':'120'}))}>
            {TYPES.map(type => (
              <option key={type} value={type}>
                {type === 'Pierś lewa'       ? t('feed.type.left')
                 : type === 'Pierś prawa'    ? t('feed.type.right')
                 : type === 'Butelka'        ? t('feed.type.bottle')
                 : type === 'Odciągnięte mleko' ? t('feed.type.pumped')
                 : type}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{isBottle ? t('common.amount_ml') : t('common.amount_min')}</label>
            <input className="form-input" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.time')}</label>
            <input className="form-input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} />
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
