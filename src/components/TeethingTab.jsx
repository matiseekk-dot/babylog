import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { todayDate, formatDate, genId } from '../utils/helpers'
import Modal from './Modal'
import { toast, toastWithUndo } from './Toast'
import { t, useLocale } from '../i18n'

/**
 * Teething tracker — log baby's teeth eruption.
 *
 * Visual: stylized mouth with 20 baby teeth positions (10 upper + 10 lower).
 * Each tooth has a standard name/position. User taps to mark erupted + date.
 *
 * Typical order (WHO reference):
 *  1. Lower central incisors (6-10 mo)
 *  2. Upper central incisors (8-12 mo)
 *  3. Upper lateral incisors (9-13 mo)
 *  4. Lower lateral incisors (10-16 mo)
 *  5. Upper first molars (13-19 mo)
 *  6. Lower first molars (14-18 mo)
 *  7. Upper canines (16-22 mo)
 *  8. Lower canines (17-23 mo)
 *  9. Lower second molars (23-31 mo)
 * 10. Upper second molars (25-33 mo)
 */

// Tooth positions: upper arch (1-10), lower arch (11-20)
// Numbered L→R from baby's perspective
const TEETH = [
  // UPPER (top row, visible when baby smiles)
  { id:'u-r2-molar',   position:'upper', col:1, nameKey:'teeth.upper.second_molar_r', typical:'25-33' },
  { id:'u-r1-molar',   position:'upper', col:2, nameKey:'teeth.upper.first_molar_r',  typical:'13-19' },
  { id:'u-r-canine',   position:'upper', col:3, nameKey:'teeth.upper.canine_r',       typical:'16-22' },
  { id:'u-r-lateral',  position:'upper', col:4, nameKey:'teeth.upper.lateral_r',      typical:'9-13' },
  { id:'u-r-central',  position:'upper', col:5, nameKey:'teeth.upper.central_r',      typical:'8-12' },
  { id:'u-l-central',  position:'upper', col:6, nameKey:'teeth.upper.central_l',      typical:'8-12' },
  { id:'u-l-lateral',  position:'upper', col:7, nameKey:'teeth.upper.lateral_l',      typical:'9-13' },
  { id:'u-l-canine',   position:'upper', col:8, nameKey:'teeth.upper.canine_l',       typical:'16-22' },
  { id:'u-l1-molar',   position:'upper', col:9, nameKey:'teeth.upper.first_molar_l',  typical:'13-19' },
  { id:'u-l2-molar',   position:'upper', col:10,nameKey:'teeth.upper.second_molar_l', typical:'25-33' },
  // LOWER (bottom row)
  { id:'l-r2-molar',   position:'lower', col:1, nameKey:'teeth.lower.second_molar_r', typical:'23-31' },
  { id:'l-r1-molar',   position:'lower', col:2, nameKey:'teeth.lower.first_molar_r',  typical:'14-18' },
  { id:'l-r-canine',   position:'lower', col:3, nameKey:'teeth.lower.canine_r',       typical:'17-23' },
  { id:'l-r-lateral',  position:'lower', col:4, nameKey:'teeth.lower.lateral_r',      typical:'10-16' },
  { id:'l-r-central',  position:'lower', col:5, nameKey:'teeth.lower.central_r',      typical:'6-10' },
  { id:'l-l-central',  position:'lower', col:6, nameKey:'teeth.lower.central_l',      typical:'6-10' },
  { id:'l-l-lateral',  position:'lower', col:7, nameKey:'teeth.lower.lateral_l',      typical:'10-16' },
  { id:'l-l-canine',   position:'lower', col:8, nameKey:'teeth.lower.canine_l',       typical:'17-23' },
  { id:'l-l1-molar',   position:'lower', col:9, nameKey:'teeth.lower.first_molar_l',  typical:'14-18' },
  { id:'l-l2-molar',   position:'lower', col:10,nameKey:'teeth.lower.second_molar_l', typical:'23-31' },
]

export default function TeethingTab({ uid, babyId }) {
  useLocale()
  const [teeth, setTeeth] = useFirestore(uid, `teething_${babyId}`, {})
  // teeth = { [toothId]: { date: 'YYYY-MM-DD', note: '' } }

  const [modal, setModal] = useState(null)  // which tooth id is being edited
  const [form, setForm] = useState({ date: todayDate(), note: '' })

  const erupted = Object.keys(teeth).length

  const openTooth = (tooth) => {
    const existing = teeth[tooth.id]
    setForm({
      date: existing?.date || todayDate(),
      note: existing?.note || '',
    })
    setModal(tooth)
  }

  const save = () => {
    const next = { ...teeth, [modal.id]: { date: form.date, note: form.note } }
    setTeeth(next)
    setModal(null)
    toast(t('teething.toast.saved'))
  }

  const removeTooth = () => {
    const next = { ...teeth }
    const removed = next[modal.id]
    delete next[modal.id]
    setTeeth(next)
    const tooth = modal
    setModal(null)
    toastWithUndo(t('common.deleted'), () => {
      setTeeth(prev => ({ ...prev, [tooth.id]: removed }))
    })
  }

  const upperTeeth = TEETH.filter(t => t.position === 'upper').sort((a,b) => a.col - b.col)
  const lowerTeeth = TEETH.filter(t => t.position === 'lower').sort((a,b) => a.col - b.col)

  const renderTooth = (tooth) => {
    const isErupted = !!teeth[tooth.id]
    return (
      <button
        key={tooth.id}
        onClick={() => openTooth(tooth)}
        aria-label={t(tooth.nameKey)}
        style={{
          width: 28, height: 34,
          border: isErupted ? '2px solid #0F6E56' : '1.5px solid #C5C3BD',
          borderRadius: '6px 6px 4px 4px',
          background: isErupted ? '#FFFCF2' : '#F5F4F0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontSize: 16,
          position: 'relative',
          transition: 'transform 0.1s',
        }}
        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.92)' }}
        onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {isErupted ? '🦷' : ''}
      </button>
    )
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('teething.title')}</div>
        <div className="section-desc">
          {t('teething.desc', { count: erupted, total: 20 })}
        </div>
      </div>

      {/* Mouth visualization */}
      <div className="card" style={{ padding: '20px 14px', margin: '8px 16px 0' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          {/* Upper arch */}
          <div style={{
            display: 'flex', gap: 4, justifyContent: 'center',
            padding: '8px 12px',
            background: 'linear-gradient(180deg, #FDE8E8 0%, #FAD0D0 100%)',
            borderRadius: '50px 50px 10px 10px',
            minHeight: 48,
          }}>
            {upperTeeth.map(renderTooth)}
          </div>

          {/* Label */}
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: 0.5 }}>
            {t('teething.upper')} ↑ · ↓ {t('teething.lower')}
          </div>

          {/* Lower arch */}
          <div style={{
            display: 'flex', gap: 4, justifyContent: 'center',
            padding: '8px 12px',
            background: 'linear-gradient(0deg, #FDE8E8 0%, #FAD0D0 100%)',
            borderRadius: '10px 10px 50px 50px',
            minHeight: 48,
          }}>
            {lowerTeeth.map(renderTooth)}
          </div>
        </div>

        <div style={{
          marginTop: 16,
          padding: '10px 12px',
          background: '#F7F7F5',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--text-3)',
          textAlign: 'center',
          lineHeight: 1.45,
        }}>
          {t('teething.hint')}
        </div>
      </div>

      {/* Recent teeth list */}
      {erupted > 0 && (
        <div className="card">
          <div className="card-header">{t('teething.history')}</div>
          {Object.entries(teeth)
            .sort((a, b) => b[1].date.localeCompare(a[1].date))
            .map(([toothId, data]) => {
              const tooth = TEETH.find(t => t.id === toothId)
              if (!tooth) return null
              return (
                <div className="log-item" key={toothId}>
                  <div className="log-icon">🦷</div>
                  <div className="log-body">
                    <div className="log-name">{t(tooth.nameKey)}</div>
                    {data.note && <div className="log-detail">{data.note}</div>}
                  </div>
                  <div className="log-time">{formatDate(data.date)}</div>
                </div>
              )
            })}
        </div>
      )}

      {/* Edit modal for single tooth */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal ? t(modal.nameKey) : ''}
      >
        {modal && (
          <>
            <div style={{
              padding: '10px 12px',
              background: '#E6F1FB',
              borderRadius: 8,
              fontSize: 12,
              color: '#0C447C',
              marginBottom: 14,
            }}>
              {t('teething.typical_age', { range: modal.typical })}
            </div>

            <div className="form-group">
              <label className="form-label">{t('teething.erupted_on')}</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('teething.note')}</label>
              <input
                className="form-input"
                type="text"
                maxLength={200}
                placeholder={t('teething.note_ph')}
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>

            <div className="modal-btns" style={{ flexDirection: 'column', gap: 8 }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={save}>
                {t('common.save')}
              </button>
              {teeth[modal.id] && (
                <button
                  className="btn-secondary"
                  style={{ width: '100%', background: 'var(--coral-light)', color: 'var(--coral)', border: 'none' }}
                  onClick={removeTooth}
                >
                  {t('teething.remove')}
                </button>
              )}
              <button
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setModal(null)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
