import React, { useState, useMemo } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { nowTime, todayDate, genId, formatDate } from '../utils/helpers'
import Modal from './Modal'
import { toast, toastWithUndo } from './Toast'
import { t, useLocale } from '../i18n'

/**
 * CoughTab — tracker kaszlu u dziecka
 *
 * CEL: Dać rodzicowi narzędzie do zapisania "kaszle od 3 dni, suchy, głównie wieczorem"
 * żeby mógł pokazać pediatrze konkretne dane zamiast mgliste wrażenia.
 *
 * TYPY KASZLU:
 *   - Suchy (dry)       — bez wydzieliny, podrażnienie, początek infekcji / alergii
 *   - Mokry (wet)       — z wydzieliną, flegmowy, infekcja w fazie produktywnej
 *   - Świszczący (wheezing) — świsty/furczenia, potencjalnie obturacja
 *   - Szczekający (barking) — charakterystyczny dla krupu (pseudo-laryngitis)
 *
 * CRISIS DETECTION (ostrzeżenia):
 *   - Kaszel szczekający + wysoka gorączka = podejrzenie krupu → kontakt z pediatrą
 *   - Kaszel >5 dni = warto pójść na wizytę
 *   - Kaszel z dusznością (świszczący) = pilna wizyta
 *
 * UI:
 *   - Quick buttons na 4 typy kaszlu
 *   - Stats: dzisiaj / 7 dni / pattern (głównie wieczorem?)
 *   - Historia z edycją (tap) + usuń (✕)
 */

const COUGH_TYPES = [
  { key: 'dry',      label: 'Suchy',       emoji: '🌵', color: '#FAEEDA', textColor: '#633806',
    desc: 'Bez wydzieliny, podrażnienie gardła' },
  { key: 'wet',      label: 'Mokry',       emoji: '💧', color: '#E6F1FB', textColor: '#0C447C',
    desc: 'Z wydzieliną, flegma' },
  { key: 'wheezing', label: 'Świszczący',  emoji: '🫁', color: '#EEEDFE', textColor: '#3C3489',
    desc: 'Ze świstami, ciężki oddech' },
  { key: 'barking',  label: 'Szczekający', emoji: '🐕', color: '#FAECE7', textColor: '#712B13',
    desc: 'Jak szczekanie psa (krup)' },
]

const TIME_OF_DAY = [
  { key: 'morning', label: 'Rano' },
  { key: 'day',     label: 'W ciągu dnia' },
  { key: 'evening', label: 'Wieczorem' },
  { key: 'night',   label: 'W nocy' },
]

function typeMeta(key) {
  return COUGH_TYPES.find(t => t.key === key) || COUGH_TYPES[0]
}

export default function CoughTab({ uid, babyId, ageMonths }) {
  useLocale()
  const [logs, setLogs] = useFirestore(uid, `cough_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultForm())

  function defaultForm() {
    return {
      type: 'dry',
      severity: 2,
      timeOfDay: 'day',
      note: '',
      time: nowTime(),
      date: todayDate(),
    }
  }

  const openAdd = (preType) => {
    setEditingId(null)
    setForm({ ...defaultForm(), type: preType || 'dry' })
    setModal(true)
  }

  const openEdit = (log) => {
    setEditingId(log.id)
    setForm({
      type: log.type || 'dry',
      severity: log.severity || 2,
      timeOfDay: log.timeOfDay || 'day',
      note: log.note || '',
      time: log.time || nowTime(),
      date: log.date || todayDate(),
    })
    setModal(true)
  }

  const save = () => {
    if (editingId) {
      setLogs(logs.map(l => l.id === editingId ? { ...l, ...form } : l))
      toast('Wpis zaktualizowany')
    } else {
      setLogs([{ id: genId(), ...form }, ...logs])
      toast('Epizod kaszlu zapisany')
    }
    setModal(false)
    setEditingId(null)
  }

  const quickAdd = (typeKey) => {
    setLogs([
      { id: genId(), ...defaultForm(), type: typeKey },
      ...logs,
    ])
    toast(`${typeMeta(typeKey).label} — zapisane`)
  }

  const remove = (id) => {
    const removed = logs.find(l => l.id === id)
    if (!removed) return
    setLogs(logs.filter(l => l.id !== id))
    toastWithUndo('Usunięto', () => setLogs(prev => [removed, ...prev]))
  }

  // ── STATS ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = todayDate()
    const todayCount = logs.filter(l => l.date === today).length

    // 7 dni
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoISO = weekAgo.toISOString().slice(0, 10)
    const last7 = logs.filter(l => l.date >= weekAgoISO)

    // Liczba dni z kaszlem w ciągu ostatnich 7
    const uniqueDays = new Set(last7.map(l => l.date)).size

    // Pattern: kiedy kaszle najczęściej?
    const timeBuckets = { morning: 0, day: 0, evening: 0, night: 0 }
    last7.forEach(l => { timeBuckets[l.timeOfDay] = (timeBuckets[l.timeOfDay] || 0) + 1 })
    const dominantTime = Object.entries(timeBuckets).sort((a,b) => b[1] - a[1])[0]

    // Dominujący typ
    const typeBuckets = {}
    last7.forEach(l => { typeBuckets[l.type] = (typeBuckets[l.type] || 0) + 1 })
    const dominantType = Object.entries(typeBuckets).sort((a,b) => b[1] - a[1])[0]

    return { todayCount, last7Count: last7.length, uniqueDays, dominantTime, dominantType }
  }, [logs])

  // ── CRISIS CHECKS ────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const out = []

    // Kaszel szczekający dzisiaj → krup podejrzenie
    const today = todayDate()
    const barkingToday = logs.some(l => l.date === today && l.type === 'barking')
    if (barkingToday) {
      out.push({
        level: 'high',
        text: '🐕 Kaszel szczekający — może wskazywać na krup (zapalenie krtani). Zadzwoń do pediatry, szczególnie jeśli jest gorączka lub świsty.',
      })
    }

    // Kaszel świszczący dzisiaj → obturacja
    const wheezingToday = logs.some(l => l.date === today && l.type === 'wheezing')
    if (wheezingToday) {
      out.push({
        level: 'high',
        text: '🫁 Kaszel świszczący — świsty mogą oznaczać obturację oskrzeli. W przypadku duszności natychmiast zgłoś się do pediatry.',
      })
    }

    // Kaszel >5 dni → wizyta
    if (stats.uniqueDays >= 5) {
      out.push({
        level: 'medium',
        text: `⚠️ Dziecko kaszle od ${stats.uniqueDays} z ostatnich 7 dni — warto umówić wizytę u pediatry.`,
      })
    }

    return out
  }, [logs, stats])

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="section-header">
        <div className="section-title">🫁 Kaszel</div>
        <div className="section-desc">
          {logs.length === 0
            ? 'Zapisuj epizody kaszlu — pokażesz pediatrze konkretne dane'
            : `${stats.todayCount} dziś · ${stats.uniqueDays}/7 dni z kaszlem`}
        </div>
      </div>

      {/* ALERTY */}
      {alerts.length > 0 && (
        <div style={{margin:'8px 16px 0',display:'flex',flexDirection:'column',gap:6}}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              padding:'10px 12px',
              borderRadius:10,
              background: a.level === 'high' ? '#FEE7DF' : '#FEF3EE',
              border: `1px solid ${a.level === 'high' ? '#E05D44' : '#F0997B'}`,
              fontSize:12,
              color: a.level === 'high' ? '#7A1F0C' : '#712B13',
              lineHeight:1.5,
            }}>
              {a.text}
            </div>
          ))}
        </div>
      )}

      {/* QUICK BUTTONS */}
      <div style={{margin:'10px 16px 0'}}>
        <div style={{
          fontSize:11,fontWeight:700,color:'var(--text-3)',
          textTransform:'uppercase',letterSpacing:0.4,marginBottom:8,
        }}>
          Szybki zapis
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {COUGH_TYPES.map(type => (
            <button
              key={type.key}
              onClick={() => quickAdd(type.key)}
              style={{
                background: type.color,
                border:'none',
                borderRadius:12,
                padding:'12px',
                minHeight:64,
                cursor:'pointer',
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                gap:4,
              }}
            >
              <div style={{fontSize:22}}>{type.emoji}</div>
              <div style={{fontSize:13,fontWeight:700,color:type.textColor}}>
                {type.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* STATS 7-DNI */}
      {stats.last7Count > 0 && (
        <div className="card" style={{margin:'12px 16px 0',padding:'12px 14px'}}>
          <div style={{
            fontSize:11,fontWeight:700,color:'var(--text-3)',
            textTransform:'uppercase',letterSpacing:0.4,marginBottom:8,
          }}>
            Ostatnie 7 dni
          </div>
          <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:'var(--text)',lineHeight:1}}>
                {stats.last7Count}
              </div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>epizodów</div>
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:'var(--text)',lineHeight:1}}>
                {stats.uniqueDays}
              </div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>dni z kaszlem</div>
            </div>
            {stats.dominantType && stats.dominantType[1] >= 2 && (
              <div>
                <div style={{fontSize:15,fontWeight:700,color:'var(--text)',lineHeight:1.2}}>
                  {typeMeta(stats.dominantType[0]).emoji} {typeMeta(stats.dominantType[0]).label}
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>dominujący typ</div>
              </div>
            )}
            {stats.dominantTime && stats.dominantTime[1] >= 2 && (
              <div>
                <div style={{fontSize:15,fontWeight:700,color:'var(--text)',lineHeight:1.2}}>
                  {TIME_OF_DAY.find(t => t.key === stats.dominantTime[0])?.label}
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>najczęściej</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORIA */}
      <div className="section-header" style={{marginTop:16}}>
        <div className="section-title" style={{fontSize:15}}>Historia</div>
      </div>

      {logs.length === 0 ? (
        <div className="card" style={{margin:'8px 16px 0'}}>
          <div className="empty-state">
            <div className="empty-icon">🫁</div>
            <p>Brak zapisanych epizodów. Dotknij któregoś z przycisków powyżej, żeby dodać.</p>
          </div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:6,margin:'8px 16px 0'}}>
          {logs.slice(0, 50).map(log => {
            const meta = typeMeta(log.type)
            const timeLabel = TIME_OF_DAY.find(t => t.key === log.timeOfDay)?.label
            return (
              <div
                key={log.id}
                className="log-item"
                onClick={() => openEdit(log)}
                style={{
                  background:'var(--surface)',
                  border:'0.5px solid var(--border)',
                  borderRadius:12,
                  padding:'10px 12px',
                  display:'flex',
                  alignItems:'center',
                  gap:10,
                  cursor:'pointer',
                }}
              >
                <div style={{
                  width:36,height:36,borderRadius:8,
                  background:meta.color,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:18,flexShrink:0,
                }}>
                  {meta.emoji}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>
                    {meta.label}
                    {log.severity >= 4 && <span style={{marginLeft:6,fontSize:11,color:'#C95A48'}}>• silny</span>}
                  </div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                    {formatDate(log.date)} · {log.time}
                    {timeLabel && ` · ${timeLabel}`}
                  </div>
                  {log.note && (
                    <div style={{fontSize:12,color:'var(--text-2)',marginTop:4,lineHeight:1.4}}>
                      {log.note}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(log.id) }}
                  style={{
                    background:'none',border:'none',color:'var(--text-3)',
                    fontSize:16,cursor:'pointer',
                    minHeight:44,minWidth:44,
                    display:'flex',alignItems:'center',justifyContent:'center',
                  }}
                  aria-label="Usuń"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      <button className="btn-add" onClick={() => openAdd()}>
        + Dodaj epizod kaszlu
      </button>

      {/* Modal dodawania/edycji */}
      <Modal
        open={modal}
        onClose={() => { setModal(false); setEditingId(null) }}
        title={editingId ? 'Edytuj epizod' : 'Dodaj epizod kaszlu'}
      >
        <div className="form-group">
          <label className="form-label">Typ kaszlu</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:4}}>
            {COUGH_TYPES.map(type => (
              <button
                key={type.key}
                onClick={() => setForm(f => ({ ...f, type: type.key }))}
                style={{
                  padding:'10px',
                  borderRadius:10,
                  border: form.type === type.key ? `2px solid ${type.textColor}` : '0.5px solid var(--border)',
                  background: form.type === type.key ? type.color : '#fff',
                  cursor:'pointer',
                  textAlign:'left',
                  minHeight:56,
                }}
              >
                <div style={{fontSize:14,fontWeight:700,color:type.textColor,marginBottom:2}}>
                  {type.emoji} {type.label}
                </div>
                <div style={{fontSize:10,color:'var(--text-3)',lineHeight:1.3}}>
                  {type.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nasilenie</label>
          <div style={{display:'flex',gap:4,marginTop:4}}>
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                onClick={() => setForm(f => ({ ...f, severity: n }))}
                style={{
                  flex:1,padding:'10px',minHeight:44,
                  borderRadius:8,
                  border: form.severity === n ? '2px solid var(--green)' : '0.5px solid var(--border)',
                  background: form.severity === n ? '#E1F5EE' : '#fff',
                  fontSize:13,fontWeight:700,color:'var(--text)',
                  cursor:'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{fontSize:10,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
            1 = lekki, 5 = bardzo silny / męczący
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Pora dnia</label>
          <select
            className="form-select"
            value={form.timeOfDay}
            onChange={e => setForm(f => ({ ...f, timeOfDay: e.target.value }))}
          >
            {TIME_OF_DAY.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Data</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Godzina</label>
            <input
              className="form-input"
              type="time"
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notatka (opcjonalnie)</label>
          <textarea
            className="form-input"
            rows={2}
            placeholder="np. po spacerze, w zimnym powietrzu"
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            style={{resize:'none'}}
          />
        </div>

        <div className="modal-btns">
          <button
            className="btn-secondary"
            onClick={() => { setModal(false); setEditingId(null) }}
          >
            {t('common.cancel')}
          </button>
          <button className="btn-primary" onClick={save}>
            {t('common.save')}
          </button>
        </div>
      </Modal>
    </>
  )
}
