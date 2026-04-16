import React, { useState } from 'react'

const FEATURES = [
  { icon: '🌡️', title: 'Analiza temperatury',      desc: 'Trend rosnący / stabilny / spadający w czasie rzeczywistym' },
  { icon: '🚨', title: 'Alerty zdrowotne',          desc: 'Powiadomienia o gorączce, niedoborze snu i lekach' },
  { icon: '💡', title: 'Wskazówki co teraz zrobić', desc: 'Kontekstowe komunikaty dopasowane do stanu dziecka' },
  { icon: '💊', title: 'Kalkulator leków',           desc: 'Informacja kiedy można podać kolejną dawkę' },
  { icon: '☁️', title: 'Sync między urządzeniami',  desc: 'Dane dostępne na każdym telefonie' },
  { icon: '🩺', title: 'Notatki lekarskie',          desc: 'Diagnoza i zalecenia po każdej wizycie' },
]

const PLANS = [
  { id:'monthly',  label:'Miesięczny',  price:'14,99 zł', period:'/ miesiąc',    popular:true,  badge:null },
  { id:'yearly',   label:'Roczny',      price:'99,99 zł', period:'/ rok',         popular:false, badge:'Oszczędzasz 44%' },
  { id:'lifetime', label:'Dożywotni',   price:'199,99 zł',period:'jednorazowo',   popular:false, badge:null },
]

export default function PaywallScreen({ onActivate, onClose, checking }) {
  const [selected, setSelected] = useState('monthly')

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
          Spokojny Rodzic Premium
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.8)',marginTop:8,lineHeight:1.5}}>
          Pełna analiza. Jasne wskazówki. Spokój głowy.
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
                }}>Najpopularniejszy</div>
              )}
            </div>
          ))}
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
          {checking ? 'Weryfikowanie...' : 'Odblokuj spokój'}
        </button>
        <div style={{textAlign:'center',fontSize:11,color:'#9a9a94',marginTop:10,lineHeight:1.5}}>
          Płatność przez Google Play · Anuluj w każdej chwili
        </div>
      </div>
    </div>
  )
}
