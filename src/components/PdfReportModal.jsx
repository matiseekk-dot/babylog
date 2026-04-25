import React, { useState } from 'react'
import Modal from './Modal'
import { toast } from './Toast'
import { t, useLocale } from '../i18n'
import { buildAndDownloadPdf } from '../utils/pdfReport'
import { todayDate, dateYMD } from '../utils/helpers'

/**
 * PdfReportModal — Premium feature
 *
 * User wybiera zakres (7/14/30 dni lub custom) → generuje PDF → pobiera.
 * Dane ładowane są przez prop `loadData` (async callback zwracający obiekt
 * { feed, sleep, temp, meds, diaper, symptoms, cough, growth, questions, doctorNotes })
 * żeby modal był stateless i nie duplikował Firestore hooków.
 */
export default function PdfReportModal({ open, onClose, profile, loadData }) {
  useLocale()
  const [range, setRange] = useState('14')
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return dateYMD(d)
  })
  const [customEnd, setCustomEnd] = useState(todayDate())
  const [generating, setGenerating] = useState(false)

  const getDateRange = () => {
    const end = new Date()
    const start = new Date()
    if (range === 'custom') {
      return { startDate: customStart, endDate: customEnd }
    }
    const days = parseInt(range, 10)
    start.setDate(end.getDate() - days + 1)  // +1 bo inclusive
    return {
      startDate: dateYMD(start),
      endDate: dateYMD(end),
    }
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const { startDate, endDate } = getDateRange()
      const data = await loadData()
      await buildAndDownloadPdf({ profile, startDate, endDate, data })
      toast(t('pdf.saved'))
      onClose()
    } catch (e) {
      console.error('PDF generation failed:', e)
      toast(t('pdf.error'), 'error')
    } finally {
      setGenerating(false)
    }
  }

  const options = [
    { id: '7',      label: t('pdf.range.7') },
    { id: '14',     label: t('pdf.range.14') },
    { id: '30',     label: t('pdf.range.30') },
    { id: 'custom', label: t('pdf.range.custom') },
  ]

  return (
    <Modal open={open} onClose={onClose} title={t('pdf.title')}>
      <div className="form-group">
        <label className="form-label">{t('pdf.range.label')}</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:6 }}>
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setRange(opt.id)}
              style={{
                padding: '10px',
                minHeight: 44,
                borderRadius: 10,
                border: range === opt.id ? '2px solid #1D9E75' : '0.5px solid var(--border)',
                background: range === opt.id ? '#E1F5EE' : '#fff',
                color: range === opt.id ? '#085041' : 'var(--text-2)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('pdf.range.from')}</label>
            <input
              className="form-input"
              type="date"
              value={customStart}
              max={customEnd}
              onChange={e => setCustomStart(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('pdf.range.to')}</label>
            <input
              className="form-input"
              type="date"
              value={customEnd}
              min={customStart}
              max={todayDate()}
              onChange={e => setCustomEnd(e.target.value)}
            />
          </div>
        </div>
      )}

      <div style={{
        padding: '10px 12px', marginTop: 8,
        background: '#FAEEDA', border: '1px solid #EACE95',
        borderRadius: 10, fontSize: 12, color: '#633806', lineHeight: 1.5,
      }}>
        📋 {t('pdf.footer.disclaimer')}
      </div>

      <div className="modal-btns">
        <button className="btn-secondary" onClick={onClose} disabled={generating}>
          {t('common.cancel')}
        </button>
        <button className="btn-primary" onClick={generate} disabled={generating}>
          {generating ? t('pdf.btn.generating') : t('pdf.btn.generate')}
        </button>
      </div>
    </Modal>
  )
}
