import React, { useState } from 'react'
import { t, useLocale } from '../i18n'

function getSlides() {
  return [
    { emoji:'📋', accentColor:'#1D9E75', accentLight:'#E1F5EE',
      title: t('onb.slide1.title'), body: t('onb.slide1.body'), note: null },
    { emoji:'🔍', accentColor:'#185FA5', accentLight:'#E6F1FB',
      title: t('onb.slide2.title'), body: t('onb.slide2.body'), note: t('onb.slide2.note') },
    { emoji:'💡', accentColor:'#BA7517', accentLight:'#FAEEDA',
      title: t('onb.slide3.title'), body: t('onb.slide3.body'), note: t('onb.slide3.note') },
  ]
}

const AVATARS = ['👶','🍼','⭐','🌙','🌈','🦋','🐣','🌸']

function Dot({ active, color }) {
  return (
    <div style={{
      width: active ? 20 : 7, height: 7, borderRadius: 4,
      background: active ? color : 'rgba(0,0,0,0.12)',
      transition: 'width 0.25s ease, background 0.25s ease',
    }} />
  )
}

/**
 * OnboardingScreen
 * Props:
 *   onComplete(profileData) – called with { name, months, weight, avatar, toiletMode } on finish
 *
 * ZMIANY 2026-04-21:
 *   - Wymuszenie wagi (required) — bez tego kalkulator leków nie działa
 *   - Skip USUNIĘTY z setup screen — user musi wypełnić, nie może uciec
 *   - Auto-toiletMode na podstawie wieku (diapers < 18m < potty < 42m < toilet)
 */
export default function OnboardingScreen({ onComplete }) {
  useLocale()
  const SLIDES = getSlides()
  const [current, setCurrent] = useState(0)
  // Setup screen data
  const [name, setName] = useState('')
  const [years, setYears] = useState('0')
  const [months, setMonths] = useState('4')
  const [weight, setWeight] = useState('')
  const [avatar, setAvatar] = useState('👶')
  const [sex, setSex] = useState('M')  // M / F — potrzebne do percentyli WHO
  const [weightError, setWeightError] = useState('')

  const totalSlides = SLIDES.length + 1 // +1 for setup screen
  const isSetup = current === SLIDES.length
  const slide = SLIDES[current]

  // Waga musi być liczbą w rozsądnym zakresie 1-50 kg
  const weightNum = Number(weight.replace(',', '.'))
  const weightValid = !isNaN(weightNum) && weightNum >= 1 && weightNum <= 50

  const next = () => {
    if (current < SLIDES.length) {
      setCurrent(c => c + 1)
      return
    }
    // Setup screen → walidacja
    if (!name.trim()) {
      return
    }
    if (!weight.trim() || !weightValid) {
      setWeightError(t('onb.setup.weight_error') || 'Waga jest wymagana (1-50 kg)')
      return
    }
    const totalMonths = (Number(years) || 0) * 12 + (Number(months) || 0)
    onComplete({
      name: name.trim(),
      months: totalMonths,
      weight: weightNum,
      avatar,
      sex,
      toiletMode: totalMonths < 18 ? 'diapers' : totalMonths < 42 ? 'potty' : 'toilet',
    })
  }

  // Skip TYLKO dla slide'ów edukacyjnych, NIE dla setup
  const skip = () => {
    if (!isSetup) setCurrent(SLIDES.length)  // idź do setup, nie pomiń całkowicie
  }

  const canProceed = !isSetup
    ? true
    : (name.trim().length > 0 && weightValid)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#fff', userSelect:'none' }}>

      {!isSetup && (
        <button onClick={skip} style={{
          position:'absolute', top:16, right:16,
          background:'transparent', border:'none', fontSize:14,
          color:'#9a9a94', cursor:'pointer', padding:'8px 4px', fontFamily:'inherit',
        }}>{t('onb.skip')}</button>
      )}

      {/* Hero / Setup header */}
      {!isSetup ? (
        <div style={{
          flex:'0 0 auto',
          background: slide.accentLight,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'60px 32px 48px',
          transition:'background 0.3s ease',
        }}>
          <div style={{
            width:96, height:96, borderRadius:'50%', background:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:48, boxShadow:`0 4px 20px ${slide.accentColor}22`, marginBottom:28,
          }}>
            {slide.emoji}
          </div>
          <div style={{
            fontSize:26, fontWeight:800, color:'#1a1a18', textAlign:'center',
            lineHeight:1.2, letterSpacing:-0.5, whiteSpace:'pre-line',
          }}>
            {slide.title}
          </div>
        </div>
      ) : (
        <div style={{
          flex:'0 0 auto',
          background:'linear-gradient(160deg,#0F6E56,#1D9E75)',
          padding:'48px 32px 32px', textAlign:'center',
        }}>
          <div style={{fontSize:48,marginBottom:12}}>{avatar}</div>
          <div style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:-0.5}}>
            {t('onb.setup.title')}
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.8)',marginTop:8}}>
            {t('onb.setup.subtitle')}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex:1, padding:'28px 28px 0', display:'flex', flexDirection:'column', overflowY:'auto' }}>
        {!isSetup ? (
          <>
            <p style={{ fontSize:16, color:'#3a3a36', lineHeight:1.65, margin:0 }}>
              {slide.body}
            </p>
            {slide.note && (
              <p style={{ fontSize:14, fontWeight:700, color:slide.accentColor, marginTop:16, lineHeight:1.4 }}>
                {slide.note}
              </p>
            )}
          </>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Avatar picker */}
            <div>
              <div style={{fontSize:13,color:'var(--text-2)',fontWeight:500,marginBottom:8}}>{t('onb.setup.avatar')}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {AVATARS.map(a => (
                  <button key={a} onClick={()=>setAvatar(a)} style={{
                    width:48,height:48,fontSize:24,borderRadius:'50%',cursor:'pointer',
                    border:`2px solid ${avatar===a?'#1D9E75':'transparent'}`,
                    background:avatar===a?'#E1F5EE':'#f7f7f5',
                  }}>{a}</button>
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
                onChange={e=>setName(e.target.value)}
                autoFocus
                style={{fontSize:16}}
              />
            </div>

            {/* Sex — WYMAGANE do percentyli WHO */}
            <div className="form-group">
              <label className="form-label">Płeć *</label>
              <div style={{display:'flex',gap:8,marginTop:4}}>
                <button
                  onClick={()=>setSex('M')}
                  style={{
                    flex:1,padding:'12px',minHeight:48,
                    borderRadius:12,
                    border:sex==='M' ? '2px solid #185FA5' : '0.5px solid var(--border)',
                    background:sex==='M' ? '#E6F1FB' : '#fff',
                    fontSize:14,fontWeight:700,color:sex==='M'?'#0C447C':'var(--text-2)',
                    cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                  }}
                >
                  👦 Chłopiec
                </button>
                <button
                  onClick={()=>setSex('F')}
                  style={{
                    flex:1,padding:'12px',minHeight:48,
                    borderRadius:12,
                    border:sex==='F' ? '2px solid #C95A48' : '0.5px solid var(--border)',
                    background:sex==='F' ? '#FEE7DF' : '#fff',
                    fontSize:14,fontWeight:700,color:sex==='F'?'#7A1F0C':'var(--text-2)',
                    cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                  }}
                >
                  👧 Dziewczynka
                </button>
              </div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>
                Potrzebne do poprawnego porównania wzrostu z normami WHO.
              </div>
            </div>

            {/* Age: years + months */}
            <div>
              <label className="form-label">{t('onb.setup.age')}</label>
              <div className="form-row" style={{marginTop:4}}>
                <div className="form-group" style={{marginTop:0}}>
                  <input
                    className="form-input"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="10"
                    value={years}
                    onChange={e=>setYears(e.target.value)}
                    placeholder={t("onb.years_ph")}
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
                    onChange={e=>setMonths(e.target.value)}
                    placeholder={t("onb.months_ph")}
                  />
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
                    {t('age.unit.months')}
                  </div>
                </div>
              </div>
            </div>

            {/* Weight — REQUIRED, z komunikatem */}
            <div className="form-group">
              <label className="form-label">
                {t('onb.setup.weight')} *
              </label>
              <input
                className="form-input"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                max="50"
                value={weight}
                onChange={e=>{
                  setWeight(e.target.value.replace(",","."))
                  if (weightError) setWeightError('')
                }}
                placeholder={t("onb.weight_ph")}
                style={{
                  borderColor: weightError ? '#E05D44' : undefined,
                }}
              />
              {weightError && (
                <div style={{fontSize:12, color:'#E05D44', marginTop:6, fontWeight:500}}>
                  ⚠️ {weightError}
                </div>
              )}
              <div style={{fontSize:11, color:'var(--text-3)', marginTop:6, lineHeight:1.5}}>
                💊 Waga jest niezbędna do poprawnego liczenia dawek paracetamolu i ibuprofenu.
              </div>
            </div>

            <div style={{fontSize:12,color:'var(--text-3)',lineHeight:1.5}}>
              {t('onb.setup.hint')}
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{
        padding:'20px 28px',
        paddingBottom:'max(20px, env(safe-area-inset-bottom))',
        display:'flex', flexDirection:'column', gap:14, alignItems:'center',
        background: '#fff',
        borderTop: isSetup ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
      }}>
        {/* Dots */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {Array.from({length:totalSlides}).map((_,i) => (
            <Dot key={i} active={i===current} color={isSetup?'#1D9E75':slide.accentColor} />
          ))}
        </div>

        <button
          onClick={next}
          disabled={!canProceed}
          style={{
            width:'100%', padding:'16px', minHeight:54,
            background: !canProceed ? '#ccc' : isSetup ? 'linear-gradient(135deg,#0F6E56,#1D9E75)' : slide.accentColor,
            color:'#fff', border:'none', borderRadius:14,
            fontSize:17, fontWeight:800, cursor: canProceed ? 'pointer' : 'default',
            letterSpacing:-0.2,
          }}
        >
          {isSetup ? `${t('onb.setup.cta')}, ${name.trim() || '👶'}! 🍼` : t('onb.next')}
        </button>

        {isSetup && (
          <p style={{fontSize:11,color:'#9a9a94',textAlign:'center',margin:0,lineHeight:1.5}}>
            {t('app.tagline')}
          </p>
        )}
      </div>
    </div>
  )
}
