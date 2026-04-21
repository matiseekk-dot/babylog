import React, { useState } from 'react'
import { calcParacetamol, calcIbuprofen } from '../utils/helpers'
import { t, useLocale } from '../i18n'

/**
 * QuickDoseCard — kalkulator leków NA HOME, nie w "More"
 *
 * Rozwiązanie problemu z audytu: killer feature (kalkulator dawek dla wagi
 * dziecka) był ukryty pod Menu > Meds > tap na med > modal. 4 tapnięcia.
 *
 * Teraz: Home screen → widać dawkę dla dziecka → 1 tap rozwija szczegóły.
 *
 * Props:
 *   - weightKg: waga dziecka (z profilu)
 *   - ageMonths: wiek (ibuprofen wymaga ≥3 mies)
 *   - onNavigateToMeds: callback → idź do pełnej zakładki Meds (historia podań)
 */
export default function QuickDoseCard({ weightKg, ageMonths, onNavigateToMeds }) {
  useLocale()
  const [expanded, setExpanded] = useState(null) // 'paracetamol' | 'ibuprofen' | null

  // Brak wagi — pokaż CTA żeby ją ustawić
  if (!weightKg || weightKg <= 0) {
    return (
      <div style={{
        margin:'12px 16px 0',
        padding:'14px 16px',
        background:'#FEF3EE',
        border:'1px solid #F0997B',
        borderRadius:14,
        display:'flex',
        alignItems:'center',
        gap:12,
      }}>
        <span style={{fontSize:24}}>⚠️</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:700, color:'#712B13', marginBottom:2}}>
            Kalkulator dawek — ustaw wagę
          </div>
          <div style={{fontSize:12, color:'#8A3E1F', lineHeight:1.4}}>
            Bez wagi dziecka nie wyliczę bezpiecznej dawki leku
          </div>
        </div>
        <button
          onClick={onNavigateToMeds}
          style={{
            background:'#C95A48', color:'#fff', border:'none',
            borderRadius:8, padding:'8px 12px', fontSize:12,
            fontWeight:700, cursor:'pointer', minHeight:36, whiteSpace:'nowrap',
          }}
        >
          Ustaw
        </button>
      </div>
    )
  }

  const parac = calcParacetamol(weightKg)
  const ibu = calcIbuprofen(weightKg, ageMonths)

  const DoseRow = ({ med, emoji, title, dose, ml, maxDaily, disabled, disabledReason }) => {
    const isExpanded = expanded === med

    return (
      <div style={{
        borderBottom: med === 'paracetamol' ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
      }}>
        <button
          onClick={() => !disabled && setExpanded(isExpanded ? null : med)}
          disabled={disabled}
          style={{
            width:'100%',
            padding:'12px 14px',
            background:'transparent',
            border:'none',
            display:'flex',
            alignItems:'center',
            gap:12,
            cursor: disabled ? 'default' : 'pointer',
            textAlign:'left',
            opacity: disabled ? 0.55 : 1,
          }}
        >
          <div style={{
            fontSize:22,
            width:36, height:36,
            background:'#FEF3EE',
            borderRadius:8,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            {emoji}
          </div>

          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:14, fontWeight:700, color:'#1a1a18', marginBottom:2}}>
              {title}
            </div>
            {disabled ? (
              <div style={{fontSize:12, color:'#9a9a94', lineHeight:1.3}}>
                {disabledReason}
              </div>
            ) : (
              <div style={{fontSize:12, color:'#5a5a56'}}>
                <strong style={{color:'#1a1a18', fontSize:14}}>{ml} ml</strong>
                <span style={{margin:'0 6px', color:'#c0c0b8'}}>·</span>
                {dose} mg dla {weightKg} kg
              </div>
            )}
          </div>

          {!disabled && (
            <div style={{
              color:'#9a9a94',
              fontSize:18,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}>›</div>
          )}
        </button>

        {isExpanded && !disabled && (
          <div style={{
            padding:'0 14px 12px 62px',
            fontSize:12,
            color:'#3a3a36',
            lineHeight:1.6,
          }}>
            {med === 'paracetamol' && (
              <>
                <div>🟢 Pojedyncza dawka: <strong>{parac.dose} mg</strong> (15 mg/kg)</div>
                <div>🟢 Zawiesina 120mg/5ml: <strong>{parac.mlStd} ml</strong></div>
                <div>🟢 Zawiesina 240mg/5ml: <strong>{parac.mlFort} ml</strong></div>
                <div>🔴 Max dobowa: <strong>{parac.maxDaily} mg</strong> (4× dziennie co 6h)</div>
              </>
            )}
            {med === 'ibuprofen' && ibu && (
              <>
                <div>🟢 Pojedyncza dawka: <strong>{ibu.dose} mg</strong> (10 mg/kg)</div>
                <div>🟢 Zawiesina 100mg/5ml: <strong>{ibu.ml} ml</strong></div>
                <div>🔴 Max dobowa: <strong>{ibu.maxDaily} mg</strong> (3× dziennie co 8h)</div>
                <div style={{marginTop:4, fontSize:11, color:'#8A3E1F'}}>⚠️ Ibuprofen tylko od 3. miesiąca życia</div>
              </>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onNavigateToMeds?.() }}
              style={{
                marginTop:10,
                background:'var(--blue-light, #E6F1FB)',
                color:'var(--blue, #185FA5)',
                border:'none', borderRadius:8,
                padding:'6px 12px', fontSize:11, fontWeight:600,
                cursor:'pointer', minHeight:32,
              }}
            >
              Zapisz podanie
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      margin:'10px 16px 0',
      background:'#fff',
      border:'0.5px solid rgba(0,0,0,0.06)',
      borderRadius:14,
      overflow:'hidden',
    }}>
      <div style={{
        padding:'10px 14px',
        background:'#FEF3EE',
        borderBottom:'0.5px solid #F0997B',
        fontSize:11,
        fontWeight:700,
        color:'#712B13',
        textTransform:'uppercase',
        letterSpacing:0.4,
        display:'flex',
        alignItems:'center',
        gap:6,
      }}>
        <span>💊</span>
        <span>Szybka dawka — dla {weightKg} kg</span>
      </div>

      <DoseRow
        med="paracetamol"
        emoji="🌡️"
        title="Paracetamol"
        dose={parac.dose}
        ml={parac.mlStd}
        maxDaily={parac.maxDaily}
        disabled={false}
      />

      <DoseRow
        med="ibuprofen"
        emoji="💊"
        title="Ibuprofen"
        dose={ibu?.dose}
        ml={ibu?.ml}
        maxDaily={ibu?.maxDaily}
        disabled={!ibu}
        disabledReason={`Tylko od 3. miesiąca (obecnie ${ageMonths} mies.)`}
      />

      <div style={{
        padding:'8px 14px',
        background:'#F7F7F5',
        fontSize:10,
        color:'#9a9a94',
        lineHeight:1.4,
        borderTop:'0.5px solid rgba(0,0,0,0.05)',
      }}>
        ℹ️ Kalkulator informacyjny. Zawsze weryfikuj dawki z pediatrą lub farmaceutą.
      </div>
    </div>
  )
}
