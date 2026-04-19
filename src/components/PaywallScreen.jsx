import React, { useState } from 'react'
import { t, useLocale } from '../i18n'

function getTestimonials() {
  const locale = t('app.title') === 'Calm Parent' ? 'en' : 'pl'
  if (locale === 'en') {
    return [
      { name: 'Sarah M.', child: 'mom of 4-month-old', quote: 'The fever alerts probably saved us a trip to the ER. I knew exactly when to call the pediatrician.', rating: 5 },
      { name: 'Emily R.', child: 'mom of twins',       quote: 'Finally an app that tells me what to DO, not just tracks numbers.', rating: 5 },
      { name: 'James K.', child: 'dad of 7-month-old', quote: 'The medicine calculator alone is worth it. No more 3 AM Google searches.', rating: 5 },
    ]
  }
  return [
    { name: 'Ania K.',    child: 'mama 4-miesięcznej Zosi',  quote: 'Alerty temperatury uratowały nas przed wizytą na SOR. Wiedziałam kiedy dzwonić do pediatry.', rating: 5 },
    { name: 'Martyna P.', child: 'mama bliźniaków',          quote: 'Wreszcie aplikacja, która mówi CO zrobić, a nie tylko zbiera dane.', rating: 5 },
    { name: 'Kuba D.',    child: 'tata 7-miesięcznego Adama',quote: 'Sam kalkulator leków jest wart ceny. Koniec z szukaniem w Google o 3 nad ranem.', rating: 5 },
  ]
}

function getFeatures() {
  return [
    { icon:'🌡️', title:t('paywall.feat1.title'), desc:t('paywall.feat1.desc') },
    { icon:'🚨', title:t('paywall.feat2.title'), desc:t('paywall.feat2.desc') },
    { icon:'💡', title:t('paywall.feat3.title'), desc:t('paywall.feat3.desc') },
    { icon:'💊', title:t('paywall.feat4.title'), desc:t('paywall.feat4.desc') },
    { icon:'☁️', title:t('paywall.feat5.title'), desc:t('paywall.feat5.desc') },
    { icon:'🩺', title:t('paywall.feat6.title'), desc:t('paywall.feat6.desc') },
  ]
}

function getPlans() {
  // Ceny różnią się dla rynku PL/EN
  const locale = t('app.title') === 'Calm Parent' ? 'en' : 'pl'
  const prices = locale === 'en'
    ? { monthly:'$6.99', yearly:'$49.99', lifetime:'$99.99' }
    : { monthly:'14,99 zł', yearly:'99,99 zł', lifetime:'199,99 zł' }
  return [
    { id:'monthly',  label:t('paywall.plan.monthly'),  price:prices.monthly,  period:t('paywall.per.monthly'),  popular:false, badge:null },
    { id:'yearly',   label:t('paywall.plan.yearly'),   price:prices.yearly,   period:t('paywall.per.yearly'),   popular:true,  badge:t('paywall.badge.yearly') },
    { id:'lifetime', label:t('paywall.plan.lifetime'), price:prices.lifetime, period:t('paywall.per.lifetime'), popular:false, badge:null },
  ]
}

export default function PaywallScreen({ onActivate, onClose, checking }) {
  useLocale()
  const FEATURES = getFeatures()
  const PLANS = getPlans()
  const [selected, setSelected] = useState('yearly')

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#fff'}}>
      <button onClick={onClose} style={{
        position:'absolute',top:16,right:16,background:'rgba(0,0,0,0.06)',
        border:'none',borderRadius:'50%',width:36,height:36,fontSize:16,
        cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
        color:'#5a5a56',zIndex:1,
      }}>✕</button>

      <div style={{
        background:'linear-gradient(160deg,#0F6E56 0%,#1D9E75 60%,#5DCAA5 100%)',
        padding:'48px 24px 28px',textAlign:'center',flex:'0 0 auto',
      }}>
        <div style={{fontSize:44,marginBottom:10}}>🍼</div>
        <div style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:-0.5,lineHeight:1.2}}>
          {t('paywall.title')}
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.8)',marginTop:8,lineHeight:1.5}}>
          {t('paywall.subtitle')}
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
        <div style={{padding:'16px 20px 0'}}>
          {FEATURES.map((f,i) => (
            <div key={i} style={{
              display:'flex',alignItems:'flex-start',gap:12,padding:'10px 0',
              borderBottom:i<FEATURES.length-1?'0.5px solid rgba(0,0,0,0.06)':'none',
            }}>
              <div style={{width:36,height:36,borderRadius:8,background:'#E1F5EE',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                {f.icon}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'#1a1a18',marginBottom:2}}>{f.title}</div>
                <div style={{fontSize:12,color:'#5a5a56',lineHeight:1.4}}>{f.desc}</div>
              </div>
              <div style={{marginLeft:'auto',color:'#1D9E75',fontSize:14,marginTop:8,flexShrink:0}}>✓</div>
            </div>
          ))}
        </div>

        <div style={{padding:'16px 20px 0',display:'flex',flexDirection:'column',gap:8}}>
          {PLANS.map(plan => (
            <div key={plan.id} onClick={() => setSelected(plan.id)} style={{
              padding:'12px 14px',cursor:'pointer',borderRadius:12,position:'relative',
              border:selected===plan.id?'2px solid #1D9E75':'0.5px solid rgba(0,0,0,0.12)',
              background:selected===plan.id?'#F4FCF9':'#fff',
              display:'flex',alignItems:'center',gap:10,
            }}>
              <div style={{
                width:18,height:18,borderRadius:'50%',flexShrink:0,background:'#fff',
                border:selected===plan.id?'5px solid #1D9E75':'1.5px solid #ccc',
              }}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:'#1a1a18'}}>{plan.label}</div>
                {plan.badge && <div style={{fontSize:11,color:'#0F6E56',fontWeight:600}}>{plan.badge}</div>}
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:16,fontWeight:800,color:'#1a1a18'}}>{plan.price}</div>
                <div style={{fontSize:11,color:'#9a9a94'}}>{plan.period}</div>
              </div>
              {plan.popular && (
                <div style={{
                  position:'absolute',top:-10,right:12,
                  background:'#1D9E75',color:'#fff',
                  fontSize:10,fontWeight:700,borderRadius:20,padding:'2px 8px',
                }}>{t('paywall.badge.popular')}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ padding:'8px 20px 16px' }}>
        <div style={{
          fontSize:11, fontWeight:700, color:'#5a5a56',
          textTransform:'uppercase', letterSpacing:0.5,
          marginBottom:10, marginTop:8,
        }}>
          {t('paywall.testimonials.title')}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {getTestimonials().map((tst, i) => (
            <div key={i} style={{
              padding:'12px 14px',
              background:'#F7F7F5', borderRadius:12,
              border:'0.5px solid rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize:12, color:'#3a3a36', lineHeight:1.5, marginBottom:6, fontStyle:'italic' }}>
                "{tst.quote}"
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:11, color:'#EF9F27' }}>{'★'.repeat(tst.rating)}</span>
                <span style={{ fontSize:11, color:'#9a9a94' }}>— {tst.name}, {tst.child}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:9, color:'#c0c0b8', textAlign:'center', marginTop:8 }}>
          {t('paywall.testimonials.disclaimer')}
        </div>
      </div>

      <div style={{
        padding:'16px 20px',paddingBottom:'max(20px, env(safe-area-inset-bottom))',
        borderTop:'0.5px solid rgba(0,0,0,0.06)',
      }}>
        <button onClick={() => onActivate(selected)} disabled={checking} style={{
          width:'100%',padding:'15px',minHeight:54,letterSpacing:-0.2,
          background:checking?'#9a9a94':'linear-gradient(135deg,#0F6E56,#1D9E75)',
          color:'#fff',border:'none',borderRadius:14,fontSize:17,fontWeight:800,
          cursor:checking?'default':'pointer',
        }}>
          {checking ? t('paywall.cta.loading') : t('paywall.cta')}
        </button>
        <div style={{textAlign:'center',fontSize:11,color:'#9a9a94',marginTop:10,lineHeight:1.5}}>
          {t('paywall.footer')}
        </div>
      </div>
    </div>
  )
}
