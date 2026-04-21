import React, { useState } from 'react'
import { t, useLocale } from '../i18n'

function getTestimonials() {
  const isEN = t('app.title') === 'Calm Parent'
  if (isEN) {
    return [
      { name: 'Sarah M.', child: 'mom of 4-month-old', quote: 'Share with my husband changed everything — we both see feedings in real time.', rating: 5 },
      { name: 'Emily R.', child: 'mom of twins',       quote: 'Growth charts with percentiles save us a visit to the pediatrician every month.', rating: 5 },
      { name: 'James K.', child: 'dad of 7-month-old', quote: 'Worth it just for the backup — I lost my phone, all data was safe.', rating: 5 },
    ]
  }
  return [
    { name: 'Ania K.',    child: 'mama 4-miesięcznej Zosi',  quote: 'Share z mężem to game changer — oboje widzimy karmienia w czasie rzeczywistym.', rating: 5 },
    { name: 'Martyna P.', child: 'mama bliźniaków',          quote: 'Wykresy wzrostu z percentylami oszczędzają nam wizytę u pediatry co miesiąc.', rating: 5 },
    { name: 'Kuba D.',    child: 'tata 7-miesięcznego Adama',quote: 'Sam backup jest wart ceny. Zgubiłem telefon, wszystkie dane bezpieczne.', rating: 5 },
  ]
}

/**
 * NOWA OFERTA PREMIUM (2026-04-21):
 *
 * Bezpieczeństwo ZAWSZE za darmo:
 *   - Kalkulator dawek paracetamolu/ibuprofenu
 *   - Alerty temperatury + crisis detection
 *   - Podstawowe tracking (karmienie, sen, pieluchy, temp)
 *
 * Premium = wartość dodana (nie etyczne minimum):
 *   - Share z partnerem (true killer feature)
 *   - Wykresy wzrostu z percentylami WHO
 *   - Unlimited dzieci (bliźnięta, rodzeństwo)
 *   - Eksport CSV + PDF raport
 *   - Backup chmurowy + sync między urządzeniami
 *   - Notatki z wizyt lekarskich
 */
function getFeatures() {
  const isEN = t('app.title') === 'Calm Parent'
  if (isEN) {
    return [
      { icon:'👨‍👩‍👧', title:'Share with partner',      desc:'Both parents see the same data in real time. One shared child.' },
      { icon:'📊', title:'Growth charts with WHO percentiles', desc:'See where your child ranks compared to the global norm.' },
      { icon:'👶', title:'Unlimited children',        desc:'Twins, siblings — one subscription, no limits.' },
      { icon:'📥', title:'Export & backup',           desc:'Full data export to CSV. Never lose what you tracked.' },
      { icon:'☁️', title:'Cross-device sync',         desc:'Phone, tablet, partner\'s phone — always up to date.' },
      { icon:'🩺', title:'Pediatrician notes',        desc:'Diagnoses and recommendations saved between visits.' },
    ]
  }
  return [
    { icon:'👨‍👩‍👧', title:'Udostępnij partnerowi',    desc:'Oboje rodziców widzi te same dane w czasie rzeczywistym. Jedno dziecko, dwa konta.' },
    { icon:'📊', title:'Wykresy wzrostu z percentylami', desc:'Zobacz w którym percentylu jest twoje dziecko wg WHO.' },
    { icon:'👶', title:'Nielimitowane dzieci',      desc:'Bliźnięta, rodzeństwo — jedna subskrypcja, bez limitów.' },
    { icon:'📥', title:'Eksport i backup',          desc:'Pełny eksport danych do CSV. Nigdy nie stracisz historii.' },
    { icon:'☁️', title:'Sync między urządzeniami', desc:'Telefon, tablet, telefon partnera — zawsze aktualne.' },
    { icon:'🩺', title:'Notatki lekarskie',         desc:'Diagnoza i zalecenia zapisane między wizytami.' },
  ]
}

function getPlans() {
  const isEN = t('app.title') === 'Calm Parent'
  const prices = isEN
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
  const isEN = t('app.title') === 'Calm Parent'

  // Komunikat o tym co jest za DARMO — żeby user nie czuł że kupuje "bezpieczeństwo"
  const freeBanner = isEN
    ? 'Medicine calculator, temperature alerts and basic tracking are always FREE.'
    : 'Kalkulator leków, alerty temperatury i podstawowy tracking zawsze ZA DARMO.'

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

        {/* FREE banner — kluczowy komunikat etyczny */}
        <div style={{
          margin:'14px 20px 0',
          padding:'10px 14px',
          background:'#E1F5EE',
          border:'0.5px solid #9FE1CB',
          borderRadius:10,
          fontSize:12,
          color:'#085041',
          lineHeight:1.5,
          display:'flex',
          alignItems:'center',
          gap:8,
        }}>
          <span style={{fontSize:16}}>✅</span>
          <span>{freeBanner}</span>
        </div>

        <div style={{padding:'8px 20px 0'}}>
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
