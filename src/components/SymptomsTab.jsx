import React, { useState, useMemo } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { todayDate, nowTime, genId, formatDate } from '../utils/helpers'
import Modal from './Modal'
import { toast, toastWithUndo } from './Toast'
import { t, tPlural, useLocale } from '../i18n'
import HistorySection from './HistorySection'

/**
 * SymptomsTab — dziennik objawów (wymioty, biegunka, wysypka, katar, inny).
 *
 * Inspiracja: CoughTab, ale:
 * - 5 typów zamiast 4
 * - custom nazwa dla "Inny"
 * - pole notatki (free text)
 * - inne crisis alerts (ryzyko odwodnienia, wysypka + gorączka)
 *
 * Crisis rules (evaluowane w sectionAlerts):
 * - ≥3 wymioty w 24h → warning (odwodnienie)
 * - ≥5 biegunki w 24h → warning
 * - wysypka + aktualna temp ≥ 38 (jeśli ktoś niedawno zmierzył) → critical
 *   → na razie zostawiam prostsze: nowa wysypka → info, aby nie zalewać
 * - objawy na 4+/7 dni → warning
 *
 * Props:
 *  - uid, babyId
 *  - currentTemp (opcjonalnie, dla alertu wysypka+gorączka)
 */

// Stałe style per klucz (nie tłumaczy się)
const SYMPTOM_STYLES = {
  vomit:      { emoji: '🤮', color: '#FEE7DF', textColor: '#7A1F0C' },
  diarrhea:   { emoji: '💩', color: '#FAEEDA', textColor: '#633806' },
  rash:       { emoji: '🔴', color: '#FAECE7', textColor: '#712B13' },
  runny_nose: { emoji: '🤧', color: '#E6F1FB', textColor: '#0C447C' },
  other:      { emoji: '📝', color: '#EEEDFE', textColor: '#3C3489' },
}

const TIME_KEYS = ['morning', 'day', 'evening', 'night']

export default function SymptomsTab({ uid, babyId, currentTempC }) {
  useLocale()

  // Meta zależna od locale
  const SYMPTOM_TYPES = [
    { key: 'vomit',      label: t('sym.type.vomit'),      desc: t('sym.type.vomit.desc'),      ...SYMPTOM_STYLES.vomit },
    { key: 'diarrhea',   label: t('sym.type.diarrhea'),   desc: t('sym.type.diarrhea.desc'),   ...SYMPTOM_STYLES.diarrhea },
    { key: 'rash',       label: t('sym.type.rash'),       desc: t('sym.type.rash.desc'),       ...SYMPTOM_STYLES.rash },
    { key: 'runny_nose', label: t('sym.type.runny_nose'), desc: t('sym.type.runny_nose.desc'), ...SYMPTOM_STYLES.runny_nose },
    { key: 'other',      label: t('sym.type.other'),      desc: t('sym.type.other.desc'),      ...SYMPTOM_STYLES.other },
  ]
  const TIME_OF_DAY = TIME_KEYS.map(k => ({ key: k, label: t(`cough.time.${k}`) }))
  const typeMeta = (key) => SYMPTOM_TYPES.find(s => s.key === key) || SYMPTOM_TYPES[SYMPTOM_TYPES.length - 1]

  const [logs, setLogs] = useFirestore(uid, `symptoms_${babyId}`, [])

  // Modal state
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())

  function emptyForm() {
    return {
      type:       'vomit',
      customName: '',
      date:       todayDate(),
      time:       nowTime(),
      severity:   3,
      timeOfDay:  inferTimeOfDay(),
      note:       '',
    }
  }

  function inferTimeOfDay() {
    const h = new Date().getHours()
    if (h < 10) return 'morning'
    if (h < 17) return 'day'
    if (h < 21) return 'evening'
    return 'night'
  }

  // ── STATYSTYKI 7 dni + alerty ─────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!logs.length) return {
      todayCount: 0, uniqueDays: 0, dominantType: null, last24h: [],
    }
    const now = Date.now()
    const last7days = logs.filter(l => {
      const ts = new Date(`${l.date}T${l.time || '12:00'}`).getTime()
      return (now - ts) / (1000 * 60 * 60 * 24) <= 7
    })
    const last24h = logs.filter(l => {
      const ts = new Date(`${l.date}T${l.time || '12:00'}`).getTime()
      return (now - ts) / (1000 * 60 * 60) <= 24
    })
    const today = todayDate()
    const todayCount = last7days.filter(l => l.date === today).length
    const uniqueDays = new Set(last7days.map(l => l.date)).size

    // Dominant type
    const typeCounts = {}
    last7days.forEach(l => { typeCounts[l.type] = (typeCounts[l.type] || 0) + 1 })
    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]

    return { todayCount, uniqueDays, dominantType, last24h }
  }, [logs])

  // ── CRISIS ALERTS ─────────────────────────────────────────────────────────
  const sectionAlerts = useMemo(() => {
    const alerts = []
    const vomit24h = stats.last24h.filter(l => l.type === 'vomit').length
    const diarrhea24h = stats.last24h.filter(l => l.type === 'diarrhea').length
    const rashRecent = stats.last24h.filter(l => l.type === 'rash')

    if (vomit24h >= 3) {
      alerts.push({
        level: 'warning',
        text: t('sym.alert.vomit_risk', { count: vomit24h }),
      })
    }
    if (diarrhea24h >= 5) {
      alerts.push({
        level: 'warning',
        text: t('sym.alert.diarrhea_risk', { count: diarrhea24h }),
      })
    }
    if (rashRecent.length > 0 && currentTempC && currentTempC >= 38) {
      alerts.push({
        level: 'critical',
        text: t('sym.alert.rash_fever'),
      })
    } else if (rashRecent.length === 1) {
      // Dokładnie jeden świeży wpis wysypki — info (nie spamujemy)
      alerts.push({
        level: 'info',
        text: t('sym.alert.rash_new'),
      })
    }
    if (stats.uniqueDays >= 4) {
      alerts.push({
        level: 'warning',
        text: t('sym.alert.long', { days: stats.uniqueDays }),
      })
    }
    return alerts
  }, [stats, currentTempC])

  // ── ZAPIS ─────────────────────────────────────────────────────────────────
  const quickLog = (typeKey) => {
    const entry = {
      id:        genId(),
      type:      typeKey,
      customName:'',
      date:      todayDate(),
      time:      nowTime(),
      severity:  3,
      timeOfDay: inferTimeOfDay(),
      note:      '',
    }
    setLogs([entry, ...logs])
    toast(t('sym.toast.quick', { type: typeMeta(typeKey).label }))
  }

  const saveFull = () => {
    if (editingId) {
      setLogs(logs.map(l => l.id === editingId ? { ...l, ...form } : l))
      toast(t('sym.toast.updated'))
    } else {
      setLogs([{ id: genId(), ...form }, ...logs])
      toast(t('sym.toast.saved'))
    }
    setModal(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const openEdit = (log) => {
    setEditingId(log.id)
    setForm({
      type:       log.type || 'vomit',
      customName: log.customName || '',
      date:       log.date || todayDate(),
      time:       log.time || nowTime(),
      severity:   log.severity ?? 3,
      timeOfDay:  log.timeOfDay || inferTimeOfDay(),
      note:       log.note || '',
    })
    setModal(true)
  }

  const removeLog = (id) => {
    const removed = logs.find(l => l.id === id)
    if (!removed) return
    setLogs(logs.filter(l => l.id !== id))
    toastWithUndo(t('sym.toast.deleted'), () => setLogs(prev => [removed, ...prev]))
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('sym.title')}</div>
        <div className="section-desc">
          {logs.length === 0
            ? t('sym.desc.empty')
            : t('sym.desc.stats', { today: stats.todayCount, days: stats.uniqueDays })}
        </div>
      </div>

      {/* CRISIS ALERTS ────────────────────────────────────────────────────── */}
      {sectionAlerts.length > 0 && (
        <div style={{ margin: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sectionAlerts.map((a, i) => {
            const bg  = a.level === 'critical' ? '#FEE7DF' : a.level === 'warning' ? '#FAEEDA' : '#E6F1FB'
            const brd = a.level === 'critical' ? '#E05D44' : a.level === 'warning' ? '#E8B96A' : '#9FCBEA'
            const col = a.level === 'critical' ? '#7A1F0C' : a.level === 'warning' ? '#633806' : '#0C447C'
            return (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  background: bg,
                  border: `1px solid ${brd}`,
                  borderRadius: 10,
                  fontSize: 13,
                  color: col,
                  lineHeight: 1.5,
                }}
              >
                {a.text}
              </div>
            )
          })}
        </div>
      )}

      {/* QUICK LOG ────────────────────────────────────────────────────────── */}
      <div className="card" style={{ margin: '8px 16px 0' }}>
        <div className="card-header">{t('sym.quick')}</div>
        <div style={{
          padding: '10px 14px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}>
          {SYMPTOM_TYPES.slice(0, 4).map(typ => (
            <button
              key={typ.key}
              onClick={() => quickLog(typ.key)}
              style={{
                padding: '14px 10px',
                background: typ.color,
                color: typ.textColor,
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 60,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>{typ.emoji}</span>
              <span>{typ.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STATS 7 DNI ──────────────────────────────────────────────────────── */}
      {logs.length > 0 && (
        <div className="card" style={{ margin: '8px 16px 0' }}>
          <div className="card-header">{t('sym.last7')}</div>
          <div style={{ padding: '10px 14px', display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{logs.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{t('sym.stats.episodes')}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{stats.uniqueDays}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{t('sym.stats.days')}</div>
            </div>
            {stats.dominantType && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                  {typeMeta(stats.dominantType[0]).emoji}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {t('sym.stats.dominant_type')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DZISIAJ */}
      {(() => {
        const today = new Date().toISOString().slice(0, 10)
        const todayLogs = logs.filter(l => l.date === today)
        if (todayLogs.length === 0) return null
        return (
          <>
            <div className="section-header" style={{ marginTop: 16 }}>
              <div className="section-title" style={{ fontSize: 15 }}>{t('feed.today')}</div>
            </div>
            <div className="card" style={{ margin: '8px 16px 0' }}>
              {todayLogs.map(log => {
                const meta = typeMeta(log.type)
                const timeLabel = TIME_OF_DAY.find(tp => tp.key === log.timeOfDay)?.label || ''
                const displayName = log.type === 'other' && log.customName ? log.customName : meta.label
                return (
                  <div
                    key={log.id}
                    onClick={() => openEdit(log)}
                    style={{
                      padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
                      borderTop: '0.5px solid rgba(0,0,0,0.05)', cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{meta.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                        {displayName}
                        {log.severity >= 4 && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: '#C95A48' }}>• {t('sym.log.strong')}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                        {log.time} · {timeLabel}
                      </div>
                      {log.note && (
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>
                          „{log.note}"
                        </div>
                      )}
                    </div>
                    <button aria-label="Usuń wpis"
                      onClick={(e) => { e.stopPropagation(); removeLog(log.id) }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 14, cursor: 'pointer', padding: '4px 8px', minHeight: 32 }}
                    >✕</button>
                  </div>
                )
              })}
            </div>
          </>
        )
      })()}

      {/* Empty state gdy 0 wpisów */}
      {logs.length === 0 && (
        <div className="card" style={{ margin: '8px 16px 0' }}>
          <div className="empty-state">
            <div className="empty-icon">🤒</div>
            <p>{t('sym.empty')}</p>
          </div>
        </div>
      )}

      {/* HISTORIA — wpisy z wczoraj i wcześniej, collapsible */}
      <HistorySection
        logs={logs}
        renderItem={(log, { onDelete }) => {
          const meta = typeMeta(log.type)
          const timeLabel = TIME_OF_DAY.find(tp => tp.key === log.timeOfDay)?.label || ''
          const displayName = log.type === 'other' && log.customName ? log.customName : meta.label
          return (
            <div
              key={log.id}
              onClick={() => openEdit(log)}
              style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
            >
              <div style={{ fontSize: 22, flexShrink: 0 }}>{meta.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                  {displayName}
                  {log.severity >= 4 && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: '#C95A48' }}>• {t('sym.log.strong')}</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {log.time} · {timeLabel}
                </div>
                {log.note && (
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>
                    „{log.note}"
                  </div>
                )}
              </div>
              <button aria-label="Usuń wpis"
                onClick={(e) => { e.stopPropagation(); onDelete?.() }}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 14, cursor: 'pointer', padding: '4px 8px', minHeight: 32 }}
              >✕</button>
            </div>
          )
        }}
        summarize={entries => tPlural('summary.entries', entries.length)}
        onDelete={(log) => {
          const removed = logs.find(l => l.id === log.id)
          if (!removed) return
          setLogs(logs.filter(l => l.id !== log.id))
          toastWithUndo(t('sym.toast.deleted'), () => setLogs(prev => [removed, ...prev]))
        }}
      />

      <button className="btn-add" onClick={() => { setEditingId(null); setForm(emptyForm()); setModal(true) }}>
        {t('sym.add')}
      </button>

      {/* MODAL ────────────────────────────────────────────────────────────── */}
      <Modal
        open={modal}
        onClose={() => { setModal(false); setEditingId(null) }}
        title={editingId ? t('sym.modal.edit') : t('sym.modal.add')}
      >
        <div className="form-group">
          <label className="form-label">{t('sym.modal.type')}</label>
          <select
            className="form-select"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          >
            {SYMPTOM_TYPES.map(tp => (
              <option key={tp.key} value={tp.key}>
                {tp.emoji} {tp.label} — {tp.desc}
              </option>
            ))}
          </select>
        </div>

        {form.type === 'other' && (
          <div className="form-group">
            <label className="form-label">{t('sym.modal.custom_label')}</label>
            <input
              className="form-input"
              type="text"
              maxLength={60}
              placeholder={t('sym.modal.custom_ph')}
              value={form.customName}
              onChange={e => setForm(f => ({ ...f, customName: e.target.value }))}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.date')}</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.time')}</label>
            <input
              className="form-input"
              type="time"
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('sym.modal.severity')}</label>
          <input
            className="form-input"
            type="range"
            min={1}
            max={5}
            step={1}
            value={form.severity}
            onChange={e => setForm(f => ({ ...f, severity: Number(e.target.value) }))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            <span>1</span><span>{form.severity}</span><span>5</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {t('sym.modal.severity_hint')}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('sym.modal.time_of_day')}</label>
          <select
            className="form-select"
            value={form.timeOfDay}
            onChange={e => setForm(f => ({ ...f, timeOfDay: e.target.value }))}
          >
            {TIME_OF_DAY.map(tp => (
              <option key={tp.key} value={tp.key}>{tp.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t('sym.modal.note')}</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder={t('sym.modal.note_ph')}
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            style={{ resize: 'none' }}
          />
        </div>

        <div className="modal-btns">
          <button className="btn-secondary" onClick={() => { setModal(false); setEditingId(null) }}>
            {t('common.cancel')}
          </button>
          <button className="btn-primary" onClick={saveFull}>{t('common.save')}</button>
        </div>
      </Modal>
    </>
  )
}
