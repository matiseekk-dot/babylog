import React, { useState } from 'react'
import { t, useLocale } from '../i18n'
import { trackOnboardingCompleted } from '../utils/analytics'

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
    // v2.11.32 P1-6: funnel event — onboarding complete.
    // Mierzymy ageMonths + sex (no PII — imię nie idzie do analytics).
    trackOnboardingCompleted({ ageMonths: months, sex })
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
    // v2.11.29: outer-scroll architecture (jak consent v2.11.26).
    //
    // Wcześniej: outer flex column z height:100%, inner content z flex:1
    // + overflowY:auto. Na Android Chrome WebView TWA inner overflow:auto
    // łapał touch i nie propagował do parent — scroll w ogóle nie działał.
    // User mógł "zaginąć" w avatarach lub date input bez możliwości
    // dotarcia do button "Zaczynamy" na dole.
    //
    // Fix identyczny jak consent: outer JEST scroller'em, content jako
    // flow, button bottom jako sticky footer (zawsze widoczny).
    <div style={{
      position:'fixed', inset:0,
      overflowY:'auto',
      WebkitOverflowScrolling:'touch',
      background:'var(--surface)', userSelect:'none',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, var(--brand-600), var(--brand-500))',
        padding:'var(--space-spacious) var(--space-comfortable) var(--space-comfortable)',
        textAlign:'center',
        paddingTop: 'max(var(--space-spacious), calc(env(safe-area-inset-top) + var(--space-comfortable)))',
      }}>
        <div style={{fontSize:44,marginBottom:'var(--space-snug)'}}>{avatar}</div>
        <div style={{fontSize:22,fontWeight:800,color:'var(--surface)',letterSpacing:-0.5,lineHeight:1.2}}>
          {t('onb.setup.title')}
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',marginTop:'var(--space-snug)',lineHeight:1.4}}>
          {t('onb.setup.subtitle')}
        </div>
      </div>

      {/* Content — zwykły div bez własnego overflow */}
      <div style={{
        padding:'var(--space-comfortable) var(--space-comfortable) 0',
      }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space)' }}>
          {/* Avatar */}
          <div>
            <div style={{fontSize:13,color:'var(--text-2)',fontWeight:500,marginBottom:'var(--space-snug)'}}>
              {t('onb.setup.avatar')}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'var(--space-snug)'}}>
              {AVATARS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  style={{
                    width:48, height:48, fontSize:24, borderRadius:'var(--radius-round)',
                    cursor:'pointer',
                    border: `2px solid ${avatar === a ? 'var(--brand-500)' : 'transparent'}`,
                    background: avatar === a ? 'var(--brand-50)' : 'var(--bg)',
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
                borderColor: (dob.length > 0 && !dobValid) ? 'var(--alert-500)' : undefined,
              }}
            />
            {dob.length > 0 && !dobValid && (
              <div style={{fontSize:12, color:'var(--alert-500)', marginTop:'var(--space-tight)', fontWeight:500}}>
                ⚠️ {t('onb.setup.dob_error')}
              </div>
            )}
          </div>

          {/* Sex */}
          <div className="form-group">
            <label className="form-label">{t('onb.sex_label')}</label>
            <div style={{display:'flex',gap:'var(--space-snug)',marginTop:'var(--space-tight)'}}>
              <button
                type="button"
                onClick={() => setSex('M')}
                style={{
                  flex:1, padding:'var(--space-snug)', minHeight:48,
                  borderRadius:'var(--radius)',
                  border: sex === 'M' ? '2px solid var(--info-500)' : '0.5px solid var(--border)',
                  background: sex === 'M' ? 'var(--info-50)' : 'var(--surface)',
                  fontSize:14, fontWeight:700,
                  color: sex === 'M' ? 'var(--info-700)' : 'var(--text-2)',
                  cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-tight)',
                }}
              >
                {t('onb.sex_boy')}
              </button>
              <button
                type="button"
                onClick={() => setSex('F')}
                style={{
                  flex:1, padding:'var(--space-snug)', minHeight:48,
                  borderRadius:'var(--radius)',
                  border: sex === 'F' ? '2px solid var(--alert-100)' : '0.5px solid var(--border)',
                  background: sex === 'F' ? 'var(--alert-50)' : 'var(--surface)',
                  fontSize:14, fontWeight:700,
                  color: sex === 'F' ? 'var(--alert-700)' : 'var(--text-2)',
                  cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-tight)',
                }}
              >
                {t('onb.sex_girl')}
              </button>
            </div>
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:'var(--space-tight)'}}>
              {t('onb.sex_hint')}
            </div>
          </div>

          <div style={{
            marginTop:'var(--space-snug)',
            padding:'var(--space-snug) var(--space)',
            background:'var(--bg)',
            borderRadius:'var(--radius-tight)',
            fontSize:11,
            color:'var(--text-3)',
            lineHeight:1.5,
          }}>
            💡 {t('onb.setup.weight_later_hint')}
          </div>
        </div>
      </div>

      {/* Bottom — v2.11.29 sticky footer, button zawsze widoczny */}
      <div style={{
        position:'sticky', bottom:0,
        padding:'var(--space) var(--space-comfortable)',
        paddingBottom:'max(var(--space-comfortable), env(safe-area-inset-bottom))',
        display:'flex', flexDirection:'column', gap:'var(--space-snug)',
        background: 'var(--surface)',
        borderTop: '0.5px solid rgba(0,0,0,0.06)',
      }}>
        <button
          type="button"
          onClick={finish}
          disabled={!canSubmit}
          style={{
            width:'100%', padding:'var(--space)', minHeight:54,
            background: canSubmit
              ? 'linear-gradient(135deg, var(--brand-600), var(--brand-500))'
              : 'var(--text-3)',
            color:'var(--surface)', border:'none', borderRadius:'var(--radius-comfortable)',
            fontSize:16, fontWeight:800,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            letterSpacing:-0.2,
            transition: 'background 0.2s',
          }}
        >
          {`${t('onb.setup.cta')}, ${name.trim() || '👶'}! 🍼`}
        </button>
        <p style={{fontSize:11,color:'var(--text-3)',textAlign:'center',margin:'var(--space-tight) 0 0',lineHeight:1.5}}>
          {t('app.tagline')}
        </p>
      </div>
    </div>
  )
}
