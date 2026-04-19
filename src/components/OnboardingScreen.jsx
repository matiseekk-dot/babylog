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
 *   onComplete(profileData) – called with { name, months, weight, avatar } on finish
 */
export default function OnboardingScreen({ onComplete }) {
  useLocale()
  const SLIDES = getSlides()
  const [current, setCurrent] = useState(0)
  // Setup screen data
  const [name, setName] = useState('')
  const [months, setMonths] = useState('4')
  const [weight, setWeight] = useState('')
  const [avatar, setAvatar] = useState('👶')

  const totalSlides = SLIDES.length + 1 // +1 for setup screen
  const isSetup = current === SLIDES.length
  const slide = SLIDES[current]

  const next = () => {
    if (current < SLIDES.length) {
      setCurrent(c => c + 1)
    } else {
      // Setup screen → complete
      onComplete({
        name: name.trim() || (t('app.title') === 'Calm Parent' ? 'My baby' : 'Moje dziecko'),
        months: Number(months) || 4,
        weight: Number(weight) || 6.5,
        avatar,
      })
    }
  }

  const skip = () => onComplete({ name: t('app.title') === 'Calm Parent' ? 'My baby' : 'Moje dziecko', months:4, weight:0, avatar:'👶' })

  const canProceed = !isSetup || name.trim().length > 0

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
      <div style={{ flex:1, padding:'28px 28px 0', display:'flex', flexDirection:'column' }}>
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
              <label className="form-label">{t('onb.setup.name')}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t('onb.setup.name_ph')}
                value={name}
                onChange={e=>setName(e.target.value)}
                autoFocus
                style={{fontSize:16}}
              />
            </div>

            {/* Age + weight */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('onb.setup.age')}</label>
                <input className="form-input" type="number" inputMode="numeric" min="0" max="60" value={months} onChange={e=>setMonths(e.target.value)} placeholder="np. 4" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('onb.setup.weight')}</label>
                <input className="form-input" type="number" inputMode="decimal" step="0.1" min="1" max="30" value={weight} onChange={e=>setWeight(e.target.value.replace(",","."))} placeholder="np. 6.5" />
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
        padding:'24px 28px',
        paddingBottom:'max(28px, env(safe-area-inset-bottom))',
        display:'flex', flexDirection:'column', gap:16, alignItems:'center',
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
