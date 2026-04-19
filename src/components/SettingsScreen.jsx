import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { t, useLocale } from '../i18n'
import { exportChildReport } from '../utils/pdfExport'
import { toast } from './Toast'

const AVATARS = ['👶','🍼','⭐','🌙','🌈','🦋','🐣','🌸']

/**
 * SettingsScreen
 *
 * Props:
 *   profile, onUpdate, onDelete
 *   isPremium, trialDaysLeft, onUpgrade
 *   user, onLogout
 *   onClose
 */
export default function SettingsScreen({
  profile, onUpdate, onDelete,
  isPremium, isOnTrial, trialDaysLeft,
  onUpgrade, user, onLogout, onClose, uid,
}) {
  // Pobierz dane dziecka żeby móc wygenerować PDF
  const [tempLogs]  = useFirestore(uid, `temp_${profile.id}`,  [])
  const [medLogs]   = useFirestore(uid, `meds_${profile.id}`,  [])
  const [feedLogs]  = useFirestore(uid, `feed_${profile.id}`,  [])
  const [sleepLogs] = useFirestore(uid, `sleep_${profile.id}`, [])
  const [doctorNotes] = useFirestore(uid, `doctor_notes_${profile.id}`, [])
  const { locale } = useLocale()
  const [name, setName] = useState(profile.name)
  const totalMonths = profile.months || 0
  const initYears = Math.floor(totalMonths / 12)
  const initRemainderMonths = totalMonths % 12
  const [years, setYears] = useState(String(initYears))
  const [months, setMonths] = useState(String(initRemainderMonths))
  const [weight, setWeight] = useState(String(profile.weight))
  const [avatar, setAvatar] = useState(profile.avatar)
  const [exporting, setExporting] = useState(false)

  const save = () => {
    onUpdate(profile.id, {
      name: name.trim() || profile.name,
      months: (Number(years) || 0) * 12 + (Number(months) || 0),
      weight: Number(weight) || 0,
      avatar,
    })
    toast(t('settings.saved'))
    onClose()
  }

  const handleExport = async () => {
    if (!isPremium) { onUpgrade(); return }
    setExporting(true)
    try {
      const updatedProfile = { ...profile, name, months: (Number(years) || 0) * 12 + (Number(months) || 0), weight: Number(weight), avatar }
      const data = { tempLogs, medLogs, feedLogs, sleepLogs, doctorNotes }
      await exportChildReport(updatedProfile, data, locale)
      toast(t('settings.export.success'))
    } catch (e) {
      console.error(e)
      toast(t('settings.export.error'), 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ minHeight: '100%', background: '#F7F7F5' }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: '#3a3a36', padding: 4, minHeight: 36,
        }}>←</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a18' }}>
          {t('settings.title')}
        </div>
      </div>

      {/* Trial banner */}
      {isOnTrial && (
        <div style={{
          margin: '12px 16px 0', padding: '12px 14px',
          background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
          borderRadius: 12, color: '#fff',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
            ⏱ {t('settings.trial.title', { days: trialDaysLeft })}
          </div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            {t('settings.trial.desc')}
          </div>
          <button onClick={onUpgrade} style={{
            marginTop: 10, width: '100%', padding: '8px',
            background: '#fff', color: '#0F6E56',
            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>
            {t('settings.trial.cta')}
          </button>
        </div>
      )}

      {/* Child profile */}
      <div style={card}>
        <div style={cardHeader}>{t('settings.child.title')}</div>

        <div style={{ padding: '12px 14px' }}>
          {/* Avatar */}
          <div style={{ fontSize: 12, color: '#5a5a56', fontWeight: 500, marginBottom: 8 }}>
            {t('onb.setup.avatar')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)} style={{
                width: 44, height: 44, fontSize: 22, borderRadius: '50%', cursor: 'pointer',
                border: `2px solid ${avatar === a ? '#1D9E75' : 'transparent'}`,
                background: avatar === a ? '#E1F5EE' : '#f7f7f5',
              }}>{a}</button>
            ))}
          </div>

          {/* Fields */}
          <div className="form-group">
            <label className="form-label">{t('onb.setup.name')}</label>
            <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('onb.setup.age')}</label>
            <div className="form-row" style={{marginTop:0}}>
              <div className="form-group" style={{marginTop:0}}>
                <input
                  className="form-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="10"
                  value={years}
                  onChange={e => setYears(e.target.value)}
                />
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
                  {t('age.unit.years')}
                </div>
              </div>
              <div className="form-group" style={{marginTop:0}}>
                <input
                  className="form-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="11"
                  value={months}
                  onChange={e => setMonths(e.target.value)}
                />
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
                  {t('age.unit.months')}
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('onb.setup.weight')}</label>
            <input className="form-input" type="number" inputMode="decimal" step="0.1" min="1" max="50" value={weight} onChange={e => setWeight(e.target.value.replace(",","."))} />
          </div>

          <button onClick={save} style={{
            width: '100%', marginTop: 8, padding: '12px',
            background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* Export PDF */}
      <div style={card}>
        <div style={cardHeader}>{t('settings.export.title')}</div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, color: '#5a5a56', marginBottom: 10, lineHeight: 1.45 }}>
            {t('settings.export.desc')}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              width: '100%', padding: '12px', minHeight: 44,
              background: isPremium ? '#185FA5' : '#E6F1FB',
              color: isPremium ? '#fff' : '#185FA5',
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              cursor: exporting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {!isPremium && '🔒 '}
            📄 {exporting ? t('settings.export.loading') : t('settings.export.cta')}
          </button>
        </div>
      </div>

      {/* Account */}
      <div style={card}>
        <div style={cardHeader}>{t('settings.account.title')}</div>
        <div style={{ padding: '12px 14px' }}>
          {user ? (
            <>
              <div style={{ fontSize: 13, color: '#3a3a36', marginBottom: 4 }}>
                {user.email || user.displayName || '—'}
              </div>
              <div style={{ fontSize: 11, color: '#9a9a94', marginBottom: 12 }}>
                {isPremium ? t('settings.account.premium') : t('settings.account.free')}
              </div>
              <button onClick={onLogout} style={dangerBtn}>
                {t('topbar.logout')}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#3a3a36', marginBottom: 8 }}>
                {t('settings.account.guest')}
              </div>
              <button onClick={onLogout} style={{
                width: '100%', padding: '12px',
                background: '#1D9E75', color: '#fff',
                border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
                {t('login.guest_upgrade')}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', fontSize: 10, color: '#9a9a94', textAlign: 'center' }}>
        Spokojny Rodzic v1.0 · SkuDev
      </div>
    </div>
  )
}

const card = {
  margin: '12px 16px 0',
  background: '#fff',
  borderRadius: 14,
  overflow: 'hidden',
}

const cardHeader = {
  padding: '12px 14px',
  fontSize: 11, fontWeight: 700, color: '#5a5a56',
  textTransform: 'uppercase', letterSpacing: 0.5,
  borderBottom: '0.5px solid rgba(0,0,0,0.06)',
}

const dangerBtn = {
  width: '100%', padding: '12px',
  background: '#FAECE7', color: '#712B13',
  border: 'none', borderRadius: 10,
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
