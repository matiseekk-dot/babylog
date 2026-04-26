import React, { useState } from 'react'
import { t, useLocale, getLocale } from '../i18n'
import { getReferenceTables } from '../data/referenceTables'

/**
 * WhenToSeekHelpCard — STATYCZNA karta z warning signs (v2.10.5 MDR EXIT).
 *
 * Zastępuje: CallDoctorCard (active alarm trigger by useCrisisDetection
 * = MDR-classified active diagnostic feature).
 *
 * Klucz prawny: ten komponent NIE jest aktywowany przez dane dziecka. Jest
 * STAŁĄ pozycją w More tab — user otwiera go gdy chce, nie gdy apka uznaje
 * że ma "kryzys". Pokazuje statyczną listę warning signs z PTP/AAP.
 *
 * To jest jak ulotka leku — informacja dostępna do przeczytania, nie active
 * medical advice.
 *
 * Props:
 *   onClose          — fn() — opcjonalny, dla overlay mode
 *   onPrepNotes      — fn() — opcjonalny, otwiera CallDoctorPrep (lista
 *                      pytań do pediatry — pure data export, nie clinical)
 */
export default function WhenToSeekHelpCard({ onClose, onPrepNotes }) {
  useLocale()
  const locale = getLocale()
  const tables = getReferenceTables(locale)
  const [expanded, setExpanded] = useState(false)

  const visibleSigns = expanded ? tables.warningSigns : tables.warningSigns.slice(0, 4)

  return (
    <div style={{
      padding: 'var(--space) var(--space) var(--space-comfortable)',
      maxWidth: 600,
      margin: '0 auto',
    }}>
      {/* Header */}
      <h1 style={{
        fontSize: 22,
        fontWeight: 800,
        color: 'var(--text)',
        letterSpacing: -0.5,
        marginBottom: 'var(--space-tight)',
      }}>
        {t('seek_help.title')}
      </h1>
      <p style={{
        fontSize: 13,
        color: 'var(--text-2)',
        lineHeight: 1.5,
        marginBottom: 'var(--space)',
      }}>
        {t('seek_help.intro')}
      </p>

      {/* Lista warning signs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-snug)',
      }}>
        {visibleSigns.map((sign, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 'var(--space-snug)',
            padding: 'var(--space-snug) var(--space)',
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-tight)',
            alignItems: 'flex-start',
          }}>
            <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>
              {sign.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 'var(--space-tight)',
                lineHeight: 1.35,
              }}>
                {sign.title}
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--text-2)',
                lineHeight: 1.45,
              }}>
                {sign.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pokaż wszystkie / zwiń */}
      {tables.warningSigns.length > 4 && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            marginTop: 'var(--space-snug)',
            padding: 'var(--space-snug) 0',
            background: 'none',
            border: 'none',
            fontSize: 13,
            color: 'var(--text-2)',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {expanded ? t('seek_help.collapse') : t('seek_help.expand', { count: tables.warningSigns.length - 4 })}
        </button>
      )}

      {/* EMERGENCY NUMBER */}
      <div style={{
        marginTop: 'var(--space)',
        padding: 'var(--space-snug) var(--space)',
        background: 'var(--bg)',
        borderRadius: 'var(--radius-tight)',
        border: '0.5px solid var(--border)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 'var(--space-tight)',
        }}>
          {t('seek_help.emergency_label')}
        </div>
        <div style={{
          fontSize: 32, fontWeight: 800, color: 'var(--text)',
          letterSpacing: -1, marginBottom: 'var(--space-tight)',
        }}>
          {tables.emergency.primary.number}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {tables.emergency.primary.label}
        </div>
      </div>

      {/* CallDoctorPrep link — pasywne pomocnicze */}
      {onPrepNotes && (
        <button
          onClick={onPrepNotes}
          style={{
            marginTop: 'var(--space)',
            width: '100%',
            padding: 'var(--space-snug) var(--space)',
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{t('seek_help.prep_btn')}</span>
          <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
        </button>
      )}

      {/* Disclaimer stopka */}
      <div style={{
        marginTop: 'var(--space)',
        padding: 'var(--space-snug) var(--space)',
        background: 'var(--bg)',
        borderRadius: 'var(--radius-tight)',
        fontSize: 11,
        color: 'var(--text-3)',
        lineHeight: 1.5,
      }}>
        {t('seek_help.disclaimer')}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            marginTop: 'var(--space)',
            width: '100%',
            padding: 'var(--space-snug)',
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-2)',
            cursor: 'pointer',
          }}
        >
          {t('common.close')}
        </button>
      )}
    </div>
  )
}
