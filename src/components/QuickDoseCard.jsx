import React, { useState } from 'react'
import { t, useLocale } from '../i18n'

/**
 * QuickDoseCard — informacje o lekach przeciwgorączkowych
 *
 * UWAGA: W v2.7.1 usunięto kalkulator dawek (wyliczanie mg/kg).
 * Powód: apka nie jest wyrobem medycznym i nie powinna liczyć dawek
 * leków. Zamiast tego pokazuje INFORMACJE REFERENCYJNE z ulotki leku
 * (ChPL): kiedy można podać kolejną dawkę, maksymalna liczba dawek,
 * minimalny wiek, kontraindykacje.
 *
 * Rodzic powinien wyliczyć dawkę:
 *   - z ulotki leku (która jest w pudełku)
 *   - w aptece (farmaceuta)
 *   - u pediatry
 *
 * Apka pozwala tylko ZAPISAĆ że lek został podany (o której godzinie,
 * ile ml) — bez jakiejkolwiek rekomendacji ile powinno być.
 *
 * Props:
 *   - ageMonths: wiek (tylko do ostrzeżeń wiekowych, brak wyliczeń)
 *   - onNavigateToMeds: callback → pełna zakładka leków
 */
export default function QuickDoseCard({ ageMonths, onNavigateToMeds }) {
  useLocale()
  const [expanded, setExpanded] = useState(null) // 'paracetamol' | 'ibuprofen' | null

  // Ostrzeżenia wiekowe (nie są rekomendacją, tylko przepisaniem z ChPL)
  const isNewborn = ageMonths != null && ageMonths < 1
  const isInfant = ageMonths != null && ageMonths < 3
  const ibuAllowedByAge = ageMonths != null && ageMonths >= 6 // z ChPL Ibufen, Nurofen
  const ibuAgeText = ageMonths == null ? t('dose.ref.ibu_age_unknown')
    : ageMonths >= 6 ? t('dose.ref.ibu_age_ok')
    : t('dose.ref.ibu_age_block', { months: ageMonths })

  const MedRow = ({ med, emoji, title, disabled, disabledReason, info }) => {
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
                {t('dose.ref.tap_for_info')}
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
            {info}
            <button
              onClick={(e) => { e.stopPropagation(); onNavigateToMeds?.() }}
              style={{
                marginTop:10,
                background:'#E6F1FB',
                color:'#185FA5',
                border:'none', borderRadius:8,
                padding:'8px 14px', fontSize:12, fontWeight:600,
                cursor:'pointer', minHeight:36,
              }}
            >
              {t('dose.ref.save_action')}
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
        <span>{t('dose.ref.title')}</span>
      </div>

      {/* Główny disclaimer - zawsze widoczny */}
      <div style={{
        padding:'12px 14px',
        background:'#F7F7F5',
        borderBottom:'0.5px solid rgba(0,0,0,0.06)',
        fontSize:12,
        color:'#3a3a36',
        lineHeight:1.5,
      }}>
        📋 {t('dose.ref.main_disclaimer')}
      </div>

      {/* Ostrzeżenie dla noworodków / niemowląt < 3 mies */}
      {(isNewborn || isInfant) && (
        <div style={{
          padding:'10px 14px',
          background:'#FEE7DF',
          borderBottom:'0.5px solid #E05D44',
          fontSize:12,
          color:'#7A1F0C',
          lineHeight:1.5,
          display:'flex',
          alignItems:'flex-start',
          gap:8,
        }}>
          <span style={{fontSize:16,flexShrink:0,marginTop:-1}}>⚠️</span>
          <span>
            {isNewborn ? t('dose.ref.warn_newborn') : t('dose.ref.warn_infant')}
          </span>
        </div>
      )}

      <MedRow
        med="paracetamol"
        emoji="🌡️"
        title="Paracetamol"
        info={(
          <>
            <div style={{marginBottom:6, fontWeight:600, color:'#1a1a18'}}>
              {t('dose.ref.package_info')}
            </div>
            <div>🟡 {t('dose.ref.para.interval')}</div>
            <div>🟡 {t('dose.ref.para.max_doses')}</div>
            <div>🟡 {t('dose.ref.para.age')}</div>
            {isInfant && (
              <div style={{marginTop:6, fontSize:11, color:'#7A1F0C', fontWeight:600}}>
                ⚠️ {t('dose.ref.para.infant_warn')}
              </div>
            )}
            <div style={{marginTop:8, fontSize:11, color:'#5a5a56', fontStyle:'italic'}}>
              {t('dose.ref.read_package')}
            </div>
          </>
        )}
      />

      <MedRow
        med="ibuprofen"
        emoji="💊"
        title="Ibuprofen"
        disabled={!ibuAllowedByAge}
        disabledReason={ibuAgeText}
        info={(
          <>
            <div style={{marginBottom:6, fontWeight:600, color:'#1a1a18'}}>
              {t('dose.ref.package_info')}
            </div>
            <div>🟡 {t('dose.ref.ibu.interval')}</div>
            <div>🟡 {t('dose.ref.ibu.max_doses')}</div>
            <div>🟡 {t('dose.ref.ibu.age')}</div>
            <div style={{marginTop:6, fontSize:11, color:'#8A3E1F'}}>
              ⚠️ {t('dose.ref.ibu.contraindications')}
            </div>
            <div style={{marginTop:8, fontSize:11, color:'#5a5a56', fontStyle:'italic'}}>
              {t('dose.ref.read_package')}
            </div>
          </>
        )}
      />

      <div style={{
        padding:'10px 14px',
        background:'#F7F7F5',
        fontSize:11,
        color:'#5a5a56',
        lineHeight:1.5,
        borderTop:'0.5px solid rgba(0,0,0,0.05)',
      }}>
        ℹ️ {t('dose.ref.footer_disclaimer')}
      </div>
    </div>
  )
}
