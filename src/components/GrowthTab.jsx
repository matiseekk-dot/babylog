import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { todayDate, genId} from '../utils/helpers'
import Modal from './Modal'
import { toast } from './Toast'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function GrowthTab({uid, babyId }) {
  const [logs, setLogs] = useFirestore(uid, `growth_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ date: todayDate(), weight:'', height:'', headCirc:'' })
  const [view, setView] = useState('weight')

  const add = () => {
    if (!form.weight && !form.height) return
    setLogs([{ id:genId(), ...form }, ...logs])
    setModal(false)
    setForm({ date:todayDate(), weight:'', height:'', headCirc:'' })
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
        <div className="section-title">Wzrost i waga</div>
        <div className="section-desc">Śledź rozwój fizyczny dziecka</div>
      </div>

      {last && (
        <div className="stat-row">
          <div className="stat-card"><div className="stat-val">{last.weight||'—'}</div><div className="stat-lbl">kg (ostatni)</div></div>
          <div className="stat-card"><div className="stat-val">{last.height||'—'}</div><div className="stat-lbl">cm (ostatni)</div></div>
          <div className="stat-card"><div className="stat-val">{last.headCirc||'—'}</div><div className="stat-lbl">cm głowa</div></div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="card" style={{padding:'12px 8px'}}>
          <div className="segment" style={{margin:'0 0 8px'}}>
            <button className={`seg-btn ${view==='weight'?'active':''}`} onClick={()=>setView('weight')}>Waga</button>
            <button className={`seg-btn ${view==='height'?'active':''}`} onClick={()=>setView('height')}>Wzrost</button>
            <button className={`seg-btn ${view==='headCirc'?'active':''}`} onClick={()=>setView('headCirc')}>Głowa</button>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} width={36} />
                <Tooltip />
                <Line type="monotone" dataKey={view} stroke="var(--green)" strokeWidth={2} dot={{ r:4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">Historia pomiarów</div>
        {logs.length === 0
          ? <div className="empty-state"><div className="empty-icon">📏</div><p>Dodaj pierwszy pomiar</p></div>
          : [...logs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20).map(l => (
            <div className="log-item" key={l.id}>
              <div className="log-icon">📏</div>
              <div className="log-body">
                <div className="log-name">{l.date}</div>
                <div className="log-detail">
                  {l.weight && `${l.weight} kg`}{l.weight && l.height ? ' · ' : ''}{l.height && `${l.height} cm`}{l.headCirc ? ` · głowa ${l.headCirc} cm` : ''}
                </div>
              </div>
              <button onClick={()=>setLogs(logs.filter(x=>x.id!==l.id))} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
            </div>
          ))
        }
      </div>

      <button className="btn-add" onClick={()=>{ setForm(f=>({...f,date:todayDate()})); setModal(true) }}>
        + Dodaj pomiar
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nowy pomiar">
        <div className="form-group">
          <label className="form-label">Data pomiaru</label>
          <input className="form-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Waga (kg)</label>
            <input className="form-input" type="number" step="0.1" placeholder="np. 6.5" value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Wzrost (cm)</label>
            <input className="form-input" type="number" step="0.5" placeholder="np. 65" value={form.height} onChange={e=>setForm(f=>({...f,height:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Obwód głowy (cm)</label>
          <input className="form-input" type="number" step="0.5" placeholder="np. 41" value={form.headCirc} onChange={e=>setForm(f=>({...f,headCirc:e.target.value}))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={()=>setModal(false)}>Anuluj</button>
          <button className="btn-primary" onClick={add}>Zapisz</button>
        </div>
      </Modal>
    </>
  )
}
