import React, { useState } from 'react'
import { t, useLocale } from '../i18n'
import Modal from './Modal'
import { todayDate } from '../utils/helpers'
import { isValidBirthDate } from '../utils/pregnancy'
import { parseBirthWeight, parseBirthLength } from '../utils/birthSummary'

/**
 * Okienka trybu ciąży (v2.17.0): "Urodziło się", prezent 14 dni Premium
 * po porodzie i zakończenie trybu ciąży.
 */

/**
 * "Urodziło się": imię, data urodzenia i płeć, a od v2.17.7 opcjonalnie godzina,
 * waga i długość (do karty narodzin i pierwszego pomiaru na wykresie wzrostu).
 * onSave({ name, birthDate, sex, birthTime, weightG, lengthCm }).
 */
export function BirthModal({ open, profile, defaultName, onSave, onClose }) {
  useLocale()
  const [name, setName] = useState('')
  const [dob, setDob] = useState(todayDate())
  const [time, setTime] = useState('')
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [sex, setSex] = useState('M')
  const [tried, setTried] = useState(false)
  const [lastProfileId, setLastProfileId] = useState(null)
  // Nowe otwarcie dla innego profilu: świeże pola (imię z ciąży, jeśli nadane).
  if (open && profile && profile.id !== lastProfileId) {
    setLastProfileId(profile.id)
    setName(profile.name && profile.name !== defaultName ? profile.name : '')
    setDob(todayDate())
    setTime('')
    setWeight('')
    setLength('')
    setSex(profile.sex === 'F' ? 'F' : 'M')
    setTried(false)
  }
  if (!open || !profile) return null

  const dobValid = isValidBirthDate(dob, profile.dueDate)
  const weightG = parseBirthWeight(weight)
  const lengthCm = parseBirthLength(length)
  const measuresValid = !Number.isNaN(weightG) && !Number.isNaN(lengthCm)
  const save = () => {
    if (!dobValid || !measuresValid) { setTried(true); return }
    onSave({ name: name.trim(), birthDate: dob, sex, birthTime: /^\d\d:\d\d$/.test(time) ? time : null, weightG, lengthCm })
  }
  const half = { flex: 1, minWidth: 0, marginBottom: 0 }
  const sexBtn = (value, label) => (
    <button type="button" onClick={() => setSex(value)} aria-pressed={sex === value} style={{
      flex: 1, minHeight: 48, borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 14, fontWeight: 700,
      border: sex === value ? '2px solid var(--brand-500)' : '0.5px solid var(--border)',
      background: sex === value ? 'var(--brand-50)' : 'var(--surface)',
      color: sex === value ? 'var(--brand-700)' : 'var(--text-2)',
    }}>{label}</button>
  )

  return (
    <Modal open onClose={onClose} title={t('birth.title')}>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>{t('birth.desc')}</div>
      <div className="form-group">
        <label className="form-label" htmlFor="birth-name">{t('onb.setup.name')}</label>
        <input id="birth-name" className="form-input" type="text" maxLength={40} value={name}
          placeholder={t('onb.setup.name_ph')} onChange={e => setName(e.target.value)} style={{ fontSize: 16 }} />
      </div>
      <div className="form-group">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ ...half, flex: 1.4 }}>
            <label className="form-label" htmlFor="birth-dob">{t('onb.setup.dob')}</label>
            <input id="birth-dob" className="form-input" type="date" value={dob} max={todayDate()}
              onChange={e => setDob(e.target.value)} aria-invalid={tried && !dobValid}
              style={{ fontSize: 16, borderColor: tried && !dobValid ? 'var(--alert-500)' : undefined }} />
          </div>
          <div style={half}>
            <label className="form-label" htmlFor="birth-time">{t('birth.time')}</label>
            <input id="birth-time" className="form-input" type="time" value={time}
              onChange={e => setTime(e.target.value)} style={{ fontSize: 16 }} />
          </div>
        </div>
        {tried && !dobValid && (
          <div role="alert" style={{ fontSize: 12, color: 'var(--alert-500)', marginTop: 4, fontWeight: 500 }}>
            ⚠️ {t('birth.date_invalid')}
          </div>
        )}
      </div>
      <div className="form-group">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={half}>
            <label className="form-label" htmlFor="birth-weight">{t('birth.weight')}</label>
            <input id="birth-weight" className="form-input" type="text" inputMode="decimal" maxLength={6} value={weight}
              placeholder="3400" onChange={e => setWeight(e.target.value)} aria-invalid={tried && Number.isNaN(weightG)}
              style={{ fontSize: 16, borderColor: tried && Number.isNaN(weightG) ? 'var(--alert-500)' : undefined }} />
          </div>
          <div style={half}>
            <label className="form-label" htmlFor="birth-length">{t('birth.length')}</label>
            <input id="birth-length" className="form-input" type="text" inputMode="decimal" maxLength={5} value={length}
              placeholder="54" onChange={e => setLength(e.target.value)} aria-invalid={tried && Number.isNaN(lengthCm)}
              style={{ fontSize: 16, borderColor: tried && Number.isNaN(lengthCm) ? 'var(--alert-500)' : undefined }} />
          </div>
        </div>
        {tried && !measuresValid && (
          <div role="alert" style={{ fontSize: 12, color: 'var(--alert-500)', marginTop: 4, fontWeight: 500 }}>
            ⚠️ {t('birth.measure_invalid')}
          </div>
        )}
      </div>
      <div className="form-group">
        <div className="form-label">{t('onb.sex_label')}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {sexBtn('M', t('onb.sex_boy'))}
          {sexBtn('F', t('onb.sex_girl'))}
        </div>
      </div>
      <button type="button" className="btn-primary" onClick={save} style={{ width: '100%', marginTop: 8 }}>
        {t('common.save')}
      </button>
    </Modal>
  )
}

/** Prezent po porodzie: 14 dni Premium. */
export function BirthGiftModal({ open, onClose }) {
  useLocale()
  if (!open) return null
  return (
    <Modal open onClose={onClose} title={`🎁 ${t('birth.gift_title')}`}>
      <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 16 }}>{t('birth.gift_desc')}</div>
      <button type="button" className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
        {t('birth.gift_ok')}
      </button>
    </Modal>
  )
}

/**
 * Zakończenie trybu ciąży. Spokojny język, bez emotek i bez kolorów alarmu:
 * ktoś może to klikać w bardzo trudnym momencie.
 */
export function PregnancyEndModal({ open, onConfirm, onClose }) {
  useLocale()
  if (!open) return null
  return (
    <Modal open onClose={onClose} title={t('preg_end.title')}>
      <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 10 }}>{t('preg_end.body')}</div>
      <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 18 }}>{t('preg_end.support')}</div>
      <button type="button" onClick={onConfirm} style={{
        width: '100%', minHeight: 48, borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
        background: 'var(--text-2)', color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 8,
      }}>
        {t('preg.end_link')}
      </button>
      <button type="button" onClick={onClose} style={{
        width: '100%', minHeight: 48, borderRadius: 'var(--radius)', cursor: 'pointer',
        background: 'none', border: '0.5px solid var(--border-med)', color: 'var(--text)', fontSize: 15, fontWeight: 600,
      }}>
        {t('common.cancel')}
      </button>
    </Modal>
  )
}
