import React, { useState } from 'react'
import { t, useLocale, isEN } from '../i18n'

function getTestimonials() {
  if (isEN()) {
    return [
      { name: 'Sarah M.', child: 'mom of 4-month-old', quote: 'Share with my husband changed everything — we both see feedings in real time.', rating: 5 },
      { name: 'Emily R.', child: 'mom of twins',       quote: 'Growth charts with percentiles save us a visit to the pediatrician every month.', rating: 5 },
      { name: 'James K.', child: 'dad of 7-month-old', quote: 'Questions for pediatrician — no more forgetting what to ask during the visit.', rating: 5 },
    ]
  }
  return [
    { name: 'Ania K.',    child: 'mama 4-miesięcznej Zosi',  quote: 'Share z mężem to game changer — oboje widzimy karmienia w czasie rzeczywistym.', rating: 5 },
    { name: 'Martyna P.', child: 'mama bliźniaków',          quote: 'Wykresy wzrostu z percentylami oszczędzają nam wizytę u pediatry co miesiąc.', rating: 5 },
    { name: 'Kuba D.',    child: 'tata 7-miesięcznego Adama',quote: 'Pytania do pediatry — żadnych zapomnianych tematów na wizycie.', rating: 5 },
  ]
}

/**
 * NOWA OFERTA PREMIUM (2026-04-21, v2):
 *
 * UWAGA — sync między urządzeniami i backup Firestore są AUTOMATYCZNE dla
 * każdego zalogowanego usera. To NIE są Premium features. Nie można ich
 * tutaj sprzedawać (false advertising).
 *
 * Bezpieczeństwo ZAWSZE za darmo:
 *   - Kalkulator dawek paracetamolu/ibuprofenu
 *   - Alerty temperatury + crisis detection
 *   - Podstawowe tracking (karmienie, sen, pieluchy, temp, kaszel)
 *   - CSV export (RODO — prawo do danych)
 *   - Cross-device sync (automatyczne dla zalogowanych)
 *
 * Premium = WARTOŚĆ DODANA (nie fundament):
 *   - Share z partnerem (współdzielone konto — inny UID, inny flow)
 *   - Wykresy wzrostu z percentylami WHO
 *   - Unlimited dzieci
 *   - PDF raport dla pediatry (formatowanie, nie sam eksport)
 *   - Notatki z wizyt + pytania do pediatry
 *   - (w przyszłości) AI chat z Claude API
 */
function getFeatures() {
  if (isEN()) {
    return [
      { icon:'👨‍👩‍👧', title:'Share with partner',        desc:'Both parents track together in real time. One child, two accounts.', comingSoon:true },
      { icon:'📊', title:'Growth charts with WHO percentiles', desc:'See where your child ranks compared to WHO norms.' },
      { icon:'📈', title:'Analytics & norms',           desc:'Trend charts and comparison with WHO development norms for teeth, cough, milestones.', comingSoon:true },
      { icon:'👶', title:'Unlimited children',          desc:'Twins, siblings — one subscription, no limits.' },
      { icon:'📄', title:'PDF report for pediatrician', desc:'Formatted summary: temperatures, doses, feedings for any date range.' },
      { icon:'🩺', title:'Doctor notes & questions',    desc:'Visit history, prescriptions, questions to ask next time.' },
      { icon:'🎯', title:'Priority support',            desc:'Direct line to me (solo founder). You ask, I answer within 24h.' },
    ]
  }
  return [
    { icon:'👨‍👩‍👧', title:'Udostępnij partnerowi',     desc:'Oboje rodziców śledzi razem w czasie rzeczywistym. Jedno dziecko, dwa konta.', comingSoon:true },
    { icon:'📊', title:'Wykresy wzrostu z percentylami WHO', desc:'Zobacz w którym percentylu jest twoje dziecko wg norm WHO.' },
    { icon:'📈', title:'Analityka i normy',             desc:'Wykresy trendów i porównanie do norm WHO dla ząbków, kaszlu, milestone\'ów.', comingSoon:true },
    { icon:'👶', title:'Nielimitowane dzieci',          desc:'Bliźnięta, rodzeństwo — jedna subskrypcja, bez limitów.' },
    { icon:'📄', title:'Raport PDF dla pediatry',       desc:'Sformatowane podsumowanie: temperatury, dawki, karmienia za dowolny okres.' },
    { icon:'🩺', title:'Notatki i pytania do pediatry', desc:'Historia wizyt, recepty, pytania do zadania na następnej wizycie.' },
    { icon:'🎯', title:'Priorytetowe wsparcie',         desc:'Bezpośredni kontakt ze mną (solo founder). Pytasz, odpowiadam w 24h.' },
  ]
}

function getPlans() {
  const prices = isEN()
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
  const isEnglish = isEN()

  const freeBanner = isEnglish
    ? 'Medicine calculator, temperature alerts, CSV export and cloud sync — always FREE.'
    : 'Kalkulator leków, alerty temperatury, CSV export i sync chmurowy — zawsze ZA DARMO.'

  return (
    // JEDNA kolumna flex, JEDEN scroll na całość (z wyjątkiem sticky header + footer)
    <div style={{
      display:'flex',
      flexDirection:'column',
      minHeight:'100vh',
      background:'#fff',
      paddingBottom:110, // miejsce na sticky footer z buttonem
    }}>
      {/* X close — sticky w prawym górnym rogu */}
      <button onClick={onClose} style={{
        position:'fixed',top:16,right:16,background:'rgba(0,0,0,0.25)',
        border:'none',borderRadius:'50%',width:36,height:36,fontSize:16,
        cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
        color:'#fff',zIndex:10,
      }}>✕</button>

      {/* HEADER */}
      <div style={{
        background:'linear-gradient(160deg,#0F6E56 0%,#1D9E75 60%,#5DCAA5 100%)',
        padding:'48px 24px 28px',textAlign:'center',
      }}>
        <div style={{fontSize:44,marginBottom:10}}>🍼</div>
        <div style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:-0.5,lineHeight:1.2}}>
          {t('paywall.title')}
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',marginTop:8,lineHeight:1.5}}>
          {t('paywall.subtitle')}
        </div>
      </div>

      {/* FREE banner */}
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
        alignItems:'flex-start',
        gap:8,
      }}>
        <span style={{fontSize:16,flexShrink:0,marginTop:-2}}>✅</span>
        <span>{freeBanner}</span>
      </div>

      {/* CO DOSTAJESZ W PREMIUM — nagłówek */}
      <div style={{
        padding:'18px 20px 6px',
        fontSize:11, fontWeight:700, color:'#5a5a56',
        textTransform:'uppercase', letterSpacing:0.5,
      }}>
        {isEN ? "What you get with Premium" : "Co dostajesz w Premium"}
      </div>

      {/* FEATURES */}
      <div style={{padding:'0 20px'}}>
        {FEATURES.map((f,i) => (
          <div key={i} style={{
            display:'flex',alignItems:'flex-start',gap:12,padding:'12px 0',
            borderBottom:i<FEATURES.length-1?'0.5px solid rgba(0,0,0,0.06)':'none',
          }}>
            <div style={{width:40,height:40,borderRadius:10,background:'#E1F5EE',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
              {f.icon}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:'#1a1a18',marginBottom:3,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                {f.title}
                {f.comingSoon && (
                  <span style={{
                    fontSize:9,fontWeight:700,
                    background:'#FAEEDA',color:'#8A5A12',
                    borderRadius:20,padding:'1px 7px',
                    textTransform:'uppercase',letterSpacing:0.3,
                    whiteSpace:'nowrap',
                  }}>
                    {isEnglish ? 'Coming soon' : 'Już wkrótce'}
                  </span>
                )}
              </div>
              <div style={{fontSize:12,color:'#5a5a56',lineHeight:1.45}}>{f.desc}</div>
            </div>
            <div style={{color:f.comingSoon?'#c0c0b8':'#1D9E75',fontSize:16,marginTop:10,flexShrink:0,fontWeight:700}}>
              {f.comingSoon ? '⏳' : '✓'}
            </div>
          </div>
        ))}
      </div>

      {/* PLANS */}
      <div style={{padding:'22px 20px 8px',display:'flex',flexDirection:'column',gap:10}}>
        <div style={{
          fontSize:11, fontWeight:700, color:'#5a5a56',
          textTransform:'uppercase', letterSpacing:0.5, marginBottom:2,
        }}>
          {isEN ? "Choose a plan" : "Wybierz plan"}
        </div>
        {PLANS.map(plan => (
          <div key={plan.id} onClick={() => setSelected(plan.id)} style={{
            padding:'14px',cursor:'pointer',borderRadius:12,position:'relative',
            border:selected===plan.id?'2px solid #1D9E75':'0.5px solid rgba(0,0,0,0.12)',
            background:selected===plan.id?'#F4FCF9':'#fff',
            display:'flex',alignItems:'center',gap:10,
          }}>
            <div style={{
              width:20,height:20,borderRadius:'50%',flexShrink:0,background:'#fff',
              border:selected===plan.id?'6px solid #1D9E75':'1.5px solid #ccc',
            }}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:'#1a1a18'}}>{plan.label}</div>
              {plan.badge && <div style={{fontSize:11,color:'#0F6E56',fontWeight:600,marginTop:2}}>{plan.badge}</div>}
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:17,fontWeight:800,color:'#1a1a18'}}>{plan.price}</div>
              <div style={{fontSize:11,color:'#9a9a94'}}>{plan.period}</div>
            </div>
            {plan.popular && (
              <div style={{
                position:'absolute',top:-10,right:14,
                background:'#1D9E75',color:'#fff',
                fontSize:10,fontWeight:700,borderRadius:20,padding:'2px 10px',
              }}>{t('paywall.badge.popular')}</div>
            )}
          </div>
        ))}
      </div>

      {/* TESTIMONIALS */}
      <div style={{ padding:'18px 20px 12px' }}>
        <div style={{
          fontSize:11, fontWeight:700, color:'#5a5a56',
          textTransform:'uppercase', letterSpacing:0.5, marginBottom:10,
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

      {/* STICKY FOOTER — button na dole zawsze widoczny */}
      <div style={{
        position:'fixed',
        bottom:0, left:0, right:0,
        padding:'14px 20px',
        paddingBottom:'max(14px, env(safe-area-inset-bottom))',
        background:'#fff',
        borderTop:'0.5px solid rgba(0,0,0,0.08)',
        boxShadow:'0 -2px 10px rgba(0,0,0,0.04)',
      }}>
        <button onClick={() => onActivate(selected)} disabled={checking} style={{
          width:'100%',padding:'15px',minHeight:54,letterSpacing:-0.2,
          background:checking?'#9a9a94':'linear-gradient(135deg,#0F6E56,#1D9E75)',
          color:'#fff',border:'none',borderRadius:14,fontSize:17,fontWeight:800,
          cursor:checking?'default':'pointer',
        }}>
          {checking ? t('paywall.cta.loading') : t('paywall.cta')}
        </button>
        <div style={{textAlign:'center',fontSize:11,color:'#9a9a94',marginTop:8,lineHeight:1.4}}>
          {t('paywall.footer')}
        </div>
      </div>
    </div>
  )
}
