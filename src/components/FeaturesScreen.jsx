import React, { useState } from 'react'
import { t, useLocale } from '../i18n'

/**
 * FeaturesScreen
 *
 * Przegląd wszystkich funkcji apki pogrupowanych kategoriami.
 * Dostępny z Ustawień ("Co potrafi apka?") i z onboarding (link).
 *
 * Cel: user łatwiej odkryje funkcje o których nie wiedział.
 */

const CATEGORIES = [
  {
    key: 'daily',
    emoji: '📝',
    features: ['feeding', 'sleep', 'diaper', 'temp', 'meds', 'diary', 'symptoms'],
  },
  {
    key: 'health',
    emoji: '🏥',
    features: ['crisis', 'pdf_report', 'doctor_notes', 'vaccinations'],
  },
  {
    key: 'growth',
    emoji: '📈',
    features: ['growth_charts', 'milestones', 'teething', 'potty_training', 'diet'],
  },
  {
    key: 'family',
    emoji: '👨‍👩‍👧',
    features: ['profiles', 'sync', 'sharing', 'export'],
  },
  {
    key: 'safety',
    emoji: '🔒',
    features: ['offline', 'no_ads', 'no_tracking', 'data_backup'],
  },
]

export default function FeaturesScreen({ onClose }) {
  useLocale()
  const [expanded, setExpanded] = useState(null)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-1, #f7f7f5)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            padding: 4,
            color: '#5a5a56',
            minWidth: 32,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a18' }}>
            {t('features.title')}
          </div>
          <div style={{ fontSize: 12, color: '#7a7a74', marginTop: 2 }}>
            {t('features.subtitle')}
          </div>
        </div>
      </div>

      {/* Intro */}
      <div style={{
        padding: '16px 20px',
        background: '#FEF3EE',
        borderBottom: '0.5px solid rgba(0,0,0,0.06)',
        fontSize: 13,
        color: '#712B13',
        lineHeight: 1.55,
      }}>
        💡 {t('features.intro')}
      </div>

      {/* Categories */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 16px 24px',
      }}>
        {CATEGORIES.map(cat => (
          <div key={cat.key} style={{ marginTop: 16 }}>
            <div style={{
              padding: '8px 4px',
              fontSize: 11,
              fontWeight: 700,
              color: '#5a5a56',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>{cat.emoji}</span>
              {t(`features.cat.${cat.key}`)}
            </div>

            <div style={{
              background: '#fff',
              borderRadius: 14,
              overflow: 'hidden',
              border: '0.5px solid rgba(0,0,0,0.06)',
            }}>
              {cat.features.map((feat, idx) => {
                const featKey = `${cat.key}:${feat}`
                const isOpen = expanded === featKey
                const isLast = idx === cat.features.length - 1

                return (
                  <div
                    key={feat}
                    style={{
                      borderBottom: isLast ? 'none' : '0.5px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : featKey)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'transparent',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                        minHeight: 56,
                      }}
                    >
                      <div style={{ fontSize: 22, flexShrink: 0 }}>
                        {t(`features.item.${feat}.emoji`)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a18' }}>
                          {t(`features.item.${feat}.title`)}
                        </div>
                        {!isOpen && (
                          <div style={{
                            fontSize: 12,
                            color: '#7a7a74',
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {t(`features.item.${feat}.short`)}
                          </div>
                        )}
                      </div>
                      <div style={{
                        color: '#9a9a94',
                        fontSize: 18,
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                      }}>›</div>
                    </button>

                    {isOpen && (
                      <div style={{
                        padding: '0 16px 14px 50px',
                        fontSize: 13,
                        color: '#3a3a36',
                        lineHeight: 1.55,
                      }}>
                        {t(`features.item.${feat}.detail`)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Footer tip */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#fff',
          borderRadius: 14,
          border: '0.5px solid rgba(0,0,0,0.06)',
          fontSize: 13,
          color: '#5a5a56',
          lineHeight: 1.55,
          textAlign: 'center',
        }}>
          ✨ {t('features.tip')}
        </div>
      </div>
    </div>
  )
}
