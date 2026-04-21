import React, { useState, Suspense } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { todayDate, genId} from '../utils/helpers'
import Modal from './Modal'
import { toast } from './Toast'
import { t, useLocale } from '../i18n'
const GrowthChart = React.lazy(() => import('./GrowthChart'))

export default function GrowthTab({uid, babyId }) {
  useLocale()
  const [logs, setLogs] = useFirestore(uid, `growth_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ date: todayDate(), weight:'', height:'', headCirc:'' })
  const [view, setView] = useState('weight')

  const openAdd = () => {
    setEditingId(null)
    setForm({ date: todayDate(), weight:'', height:'', headCirc:'' })
    setModal(true)
  }

  const openEdit = (entry) => {
    setEditingId(entry.id)
    setForm({
      date: entry.date,
      weight: entry.weight ? String(entry.weight) : '',
      height: entry.height ? String(entry.height) : '',
      headCirc: entry.headCirc ? String(entry.headCirc) : '',
    })
    setModal(true)
  }

  const save = () => {
    if (!form.weight && !form.height && !form.headCirc) return
    if (editingId) {
      setLogs(logs.map(l => l.id === editingId ? { ...l, ...form } : l))
      toast(t('common.saved'))
    } else {
      setLogs([{ id: genId(), ...form }, ...logs])
    }
    setModal(false)
    setEditingId(null)
    setForm({ date: todayDate(), weight:'', height:'', headCirc:'' })
  }

  const sorted = [...logs].sort((a,b)=>a.date.localeCompare(b.date))
  const chartData = sorted.map(l=>({
    date: l.date.slice(5),
    weight: l.weight ? Number(l.weight) : undefined,
    height: l.height ? Number(l.height) : undefined,
    headCirc: l.headCirc ? Number(l.headCirc) : undefined,
  }))

  const last = sorted[sorted.length-1]

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('growth.title')}</div>
        <div className="section-desc">{t('growth.desc')}</div>
      </div>

      {last && (
        <div className="stat-row">
          <div className="stat-card"><div className="stat-val">{last.weight||'—'}</div><div className="stat-lbl">kg (ostatni)</div></div>
          <div className="stat-card"><div className="stat-val">{last.height||'—'}</div><div className="stat-lbl">cm (ostatni)</div></div>
          <div className="stat-card"><div className="stat-val">{last.headCirc||'—'}</div><div className="stat-lbl">{t('growth.stat.head')}</div></div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="card" style={{padding:'12px 8px'}}>
          <div className="segment" style={{margin:'0 0 8px'}}>
            <button className={`seg-btn ${view==='weight'?'active':''}`} onClick={()=>setView('weight')}>{t('growth.view.weight')}</button>
            <button className={`seg-btn ${view==='height'?'active':''}`} onClick={()=>setView('height')}>{t('growth.view.height')}</button>
            <button className={`seg-btn ${view==='headCirc'?'active':''}`} onClick={()=>setView('headCirc')}>{t('growth.view.head')}</button>
          </div>
          <div className="chart-wrap">
            <Suspense fallback={<div style={{padding:'20px',textAlign:'center',color:'var(--text-3)',fontSize:13}}>{t('chart.loading')}</div>}>
              <GrowthChart data={chartData} dataKey={view} />
            </Suspense>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">{t('growth.history')}</div>
        {logs.length === 0
          ? <div className="empty-state"><div className="empty-icon">📏</div><p>{t('growth.empty')}</p></div>
          : [...logs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20).map(l => (
            <div className="log-item" key={l.id} onClick={() => openEdit(l)} style={{cursor:'pointer'}}>
              <div className="log-icon">📏</div>
              <div className="log-body">
                <div className="log-name">{l.date}</div>
                <div className="log-detail">
                  {l.weight && `${l.weight} kg`}{l.weight && l.height ? ' · ' : ''}{l.height && `${l.height} cm`}{l.headCirc ? ` · ${t('growth.head_short')} ${l.headCirc} cm` : ''}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); setLogs(logs.filter(x=>x.id!==l.id)) }} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
            </div>
          ))
        }
      </div>

      <button className="btn-add" onClick={openAdd}>
        {t('growth.add')}
      </button>

      <Modal open={modal} onClose={() => { setModal(false); setEditingId(null) }} title={editingId ? t('common.edit') : t('growth.modal.title')}>
        <div className="form-group">
          <label className="form-label">{t('growth.modal.date')}</label>
          <input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('growth.modal.weight')}</label>
            <input className="form-input" type="number" step="0.1" placeholder={t('growth.weight_ph')} value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('growth.modal.height')}</label>
            <input className="form-input" type="number" step="0.5" placeholder={t('growth.height_ph')} value={form.height} onChange={e=>setForm(f=>({...f,height:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('growth.modal.head')}</label>
          <input className="form-input" type="number" step="0.5" placeholder={t('growth.head_ph')} value={form.headCirc} onChange={e=>setForm(f=>({...f,headCirc:e.target.value}))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={() => { setModal(false); setEditingId(null) }}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={save}>{t('common.save')}</button>
        </div>
      </Modal>
    </>
  )
}
