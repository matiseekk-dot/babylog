import React, { useState } from 'react'
import { t, useLocale } from '../i18n'

const AVATARS = ['👶','🍼','⭐','🌙','🌈','🦋','🐣','🌸']

/**
 * OnboardingScreen
 *
 * v2.9.2 (kwiecień 2026):
 *   - Single step: imię + DOB + avatar + płeć (wszystko required)
 *   - Wagi NIE pytamy w onboardingu — feature-gated później (np. siatki WHO
 *     promptują "Dodaj pierwszy pomiar wagi" przy braku wpisów)
 *   - 3 slidy edukacyjne PRZESUNIĘTE z onboardingu na dashboard jako
 *     OnboardingTipsBanner (dismissable, jednorazowy)
 *
 * v2.9.0:
 *   - Połączenie z MedicalDisclaimerScreen → jeden ekran consent
 *   - Step 2 (waga) opcjonalny [→ usunięty całkowicie w 2.9.2]
 *   - Data urodzenia (input type="date") zamiast lat+miesięcy
 *
 * Props:
 *   onComplete(profileData) — wywoływane z {
 *     name, months, weight (zawsze null po 2.9.2), avatar, sex, toiletMode
 *   }
 */
export default function OnboardingScreen({ onComplete }) {
  useLocale()

  const [name, setName] = useState('')
  const [dob, setDob] = useState('')   // YYYY-MM-DD
  const [avatar, setAvatar] = useState('👶')
  const [sex, setSex] = useState('M')

  const todayStr = new Date().toISOString().slice(0, 10)

  // ── Walidacje ─────────────────────────────────────────────────────────────
  const nameValid = name.trim().length > 0
  const dobValid = (() => {
    if (!dob) return false
    const d = new Date(dob)
    if (isNaN(d.getTime())) return false
    const now = new Date()
    if (d > now) return false
    const eighteenYearsAgo = new Date(now)
    eighteenYearsAgo.setFullYear(now.getFullYear() - 18)
    if (d < eighteenYearsAgo) return false
    return true
  })()
  const canSubmit = nameValid && dobValid

  // ── Konwersja DOB → months ────────────────────────────────────────────────
  function dobToMonths(dobStr) {
    const d = new Date(dobStr)
    const now = new Date()
    let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (now.getDate() < d.getDate()) months--
    return Math.max(0, months)
  }

  const finish = () => {
    if (!canSubmit) return
    const months = dobToMonths(dob)
    onComplete({
      name: name.trim(),
      months,
      weight: null,  // v2.9.2: waga feature-gated później
      avatar,
      sex,
      toiletMode: months < 18 ? 'diapers' : months < 42 ? 'potty' : 'toilet',
    })
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100%',
      background:'#fff', userSelect:'none',
    }}>
      {/* Header */}
      <div style={{
        flex:'0 0 auto',
        background: 'linear-gradient(160deg,#0F6E56,#1D9E75)',
        padding:'40px 28px 28px',
        textAlign:'center',
        paddingTop: 'max(40px, calc(env(safe-area-inset-top) + 24px))',
      }}>
        <div style={{fontSize:44,marginBottom:8}}>{avatar}</div>
        <div style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:-0.5,lineHeight:1.2}}>
          {t('onb.setup.title')}
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',marginTop:8,lineHeight:1.4}}>
          {t('onb.setup.subtitle')}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex:1, padding:'24px 28px 0',
        display:'flex', flexDirection:'column',
        overflowY:'auto',
      }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Avatar */}
          <div>
            <div style={{fontSize:13,color:'var(--text-2)',fontWeight:500,marginBottom:8}}>
              {t('onb.setup.avatar')}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {AVATARS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  style={{
                    width:48, height:48, fontSize:24, borderRadius:'50%',
                    cursor:'pointer',
                    border: `2px solid ${avatar === a ? '#1D9E75' : 'transparent'}`,
                    background: avatar === a ? '#E1F5EE' : '#f7f7f5',
                  }}
                >{a}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="form-group">
            <label className="form-label">{t('onb.setup.name')} *</label>
            <input
              className="form-input"
              type="text" maxLength={40}
              placeholder={t('onb.setup.name_ph')}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              style={{fontSize:16}}
            />
          </div>

          {/* DOB */}
          <div className="form-group">
            <label className="form-label">{t('onb.setup.dob')} *</label>
            <input
              className="form-input"
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={todayStr}
              style={{
                fontSize:16,
                borderColor: (dob.length > 0 && !dobValid) ? '#E05D44' : undefined,
              }}
            />
            {dob.length > 0 && !dobValid && (
              <div style={{fontSize:12, color:'#E05D44', marginTop:6, fontWeight:500}}>
                ⚠️ {t('onb.setup.dob_error')}
              </div>
            )}
          </div>

          {/* Sex */}
          <div className="form-group">
            <label className="form-label">{t('onb.sex_label')}</label>
            <div style={{display:'flex',gap:8,marginTop:4}}>
              <button
                type="button"
                onClick={() => setSex('M')}
                style={{
                  flex:1, padding:'12px', minHeight:48,
                  borderRadius:12,
                  border: sex === 'M' ? '2px solid #185FA5' : '0.5px solid var(--border)',
                  background: sex === 'M' ? '#E6F1FB' : '#fff',
                  fontSize:14, fontWeight:700,
                  color: sex === 'M' ? '#0C447C' : 'var(--text-2)',
                  cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}
              >
                {t('onb.sex_boy')}
              </button>
              <button
                type="button"
                onClick={() => setSex('F')}
                style={{
                  flex:1, padding:'12px', minHeight:48,
                  borderRadius:12,
                  border: sex === 'F' ? '2px solid #C95A48' : '0.5px solid var(--border)',
                  background: sex === 'F' ? '#FEE7DF' : '#fff',
                  fontSize:14, fontWeight:700,
                  color: sex === 'F' ? '#7A1F0C' : 'var(--text-2)',
                  cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}
              >
                {t('onb.sex_girl')}
              </button>
            </div>
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>
              {t('onb.sex_hint')}
            </div>
          </div>

          <div style={{
            marginTop:8,
            padding:'10px 14px',
            background:'#F7F7F5',
            borderRadius:10,
            fontSize:11,
            color:'var(--text-3)',
            lineHeight:1.5,
          }}>
            💡 {t('onb.setup.weight_later_hint')}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div style={{
        padding:'16px 28px',
        paddingBottom:'max(20px, env(safe-area-inset-bottom))',
        display:'flex', flexDirection:'column', gap:10,
        background: '#fff',
        borderTop: '0.5px solid rgba(0,0,0,0.06)',
      }}>
        <button
          type="button"
          onClick={finish}
          disabled={!canSubmit}
          style={{
            width:'100%', padding:'16px', minHeight:54,
            background: canSubmit
              ? 'linear-gradient(135deg,#0F6E56,#1D9E75)'
              : '#c0c0bc',
            color:'#fff', border:'none', borderRadius:14,
            fontSize:16, fontWeight:800,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            letterSpacing:-0.2,
            transition: 'background 0.2s',
          }}
        >
          {`${t('onb.setup.cta')}, ${name.trim() || '👶'}! 🍼`}
        </button>
        <p style={{fontSize:11,color:'#9a9a94',textAlign:'center',margin:'4px 0 0',lineHeight:1.5}}>
          {t('app.tagline')}
        </p>
      </div>
    </div>
  )
}
