import React from 'react'
import { t, useLocale, getLocale } from '../i18n'
import { getReferenceTables } from '../data/referenceTables'

/**
 * ReferenceLibrary — STATYCZNA biblioteka wytycznych PTP/AAP (v2.10.5 MDR EXIT).
 *
 * Klucz prawny: ten komponent pokazuje IDENTYCZNĄ TREŚĆ niezależnie od danych
 * dziecka. Tu nie ma żadnej personalizacji. To jest cyfrowa kopia tabeli z
 * "KOMPAS GORĄCZKA" / AAP guidelines — dostępna do przeczytania.
 *
 * Wikipedia ma artykuł "Fever in infants" i nie jest MDR. Ten komponent
 * realizuje ten sam wzorzec.
 *
 * Uwaga: NIE podświetlamy żadnego wiersza ze względu na pomiar. NIE pokazujemy
 * "to dotyczy twojego dziecka". User sam czyta i sam wnioskuje.
 *
 * Wejście: z More tab → "Wytyczne PTP/AAP", lub z TempTab pasywny link
 * "Zobacz tabelę referencyjną".
 *
 * Props:
 *   onClose — fn() — zamknij sekcję (dla overlay mode)
 */
export default function ReferenceLibrary({ onClose }) {
  useLocale()
  const locale = getLocale()
  const tables = getReferenceTables(locale)
  const isEn = locale === 'en'

  return (
    <div style={{
      padding: 'var(--space) var(--space) 80px',
      maxWidth: 600,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space)' }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text)',
          letterSpacing: -0.5,
          marginBottom: 'var(--space-tight)',
        }}>
          {t('ref.title')}
        </h1>
        <p style={{
          fontSize: 13,
          color: 'var(--text-2)',
          lineHeight: 1.5,
        }}>
          {t('ref.intro')}
        </p>
      </div>

      {/* TABELA TEMPERATURY */}
      <Section title={t('ref.section.temp')}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-tight)',
          overflow: 'hidden',
          border: '0.5px solid var(--border)',
        }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              <Th>{t('ref.tbl.age')}</Th>
              <Th>{t('ref.tbl.threshold')}</Th>
              <Th>{t('ref.tbl.note')}</Th>
            </tr>
          </thead>
          <tbody>
            {tables.temperature.map((row, i) => (
              <tr key={i} style={{
                borderTop: i > 0 ? '0.5px solid var(--border)' : 'none',
              }}>
                <Td bold>{row.ageRange}</Td>
                <Td bold>{row.threshold}</Td>
                <Td muted>{row.note}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <SourceNote text={isEn
          ? 'Source: AAP Clinical Practice Guideline (2021), Mayo Clinic.'
          : 'Źródło: KOMPAS GORĄCZKA — Polskie Towarzystwo Pediatryczne (PTP/PTMR).'} />
      </Section>

      {/* WARNING SIGNS */}
      <Section title={t('ref.section.warning_signs')}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-snug)',
        }}>
          {tables.warningSigns.map((sign, i) => (
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
        <SourceNote text={isEn
          ? 'Source: AAP, Mayo Clinic guidelines.'
          : 'Źródło: PTP/PTMR (KOMPAS GORĄCZKA), Medycyna Praktyczna.'} />
      </Section>

      {/* EMERGENCY NUMBER */}
      <Section title={t('ref.section.emergency')}>
        <div style={{
          padding: 'var(--space-snug) var(--space)',
          background: 'var(--bg)',
          borderRadius: 'var(--radius-tight)',
          border: '0.5px solid var(--border)',
        }}>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: -1,
            marginBottom: 'var(--space-tight)',
          }}>
            {tables.emergency.primary.number}
          </div>
          <div style={{
            fontSize: 12,
            color: 'var(--text-2)',
            marginBottom: 'var(--space-snug)',
          }}>
            {tables.emergency.primary.label}
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 12,
            color: 'var(--text-2)',
            lineHeight: 1.6,
          }}>
            {tables.emergency.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      </Section>

      {/* DISCLAIMER STOPKA */}
      <div style={{
        marginTop: 'var(--space-comfortable)',
        padding: 'var(--space-snug) var(--space)',
        background: 'var(--bg)',
        borderRadius: 'var(--radius-tight)',
        fontSize: 11,
        color: 'var(--text-3)',
        lineHeight: 1.5,
      }}>
        {t('ref.disclaimer')}
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-comfortable)' }}>
      <h2 style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-2)',
        marginBottom: 'var(--space-snug)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Th({ children }) {
  return (
    <th style={{
      padding: 'var(--space-snug) var(--space-snug)',
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    }}>{children}</th>
  )
}

function Td({ children, bold, muted }) {
  return (
    <td style={{
      padding: 'var(--space-snug) var(--space-snug)',
      fontSize: 12,
      fontWeight: bold ? 600 : 400,
      color: muted ? 'var(--text-2)' : 'var(--text)',
      lineHeight: 1.4,
      verticalAlign: 'top',
    }}>{children}</td>
  )
}

function SourceNote({ text }) {
  return (
    <div style={{
      marginTop: 'var(--space-snug)',
      fontSize: 10,
      color: 'var(--text-3)',
      fontStyle: 'italic',
    }}>{text}</div>
  )
}
