import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * PremiumOnboardingModal
 *
 * Pokazuje się RAZ po tym jak user zakupił Premium.
 * Pomaga mu odkryć co się odblokowało, zwiększa satisfaction → lepsze recenzje.
 *
 * Detekcja: isPremium zmienia się z false na true
 * Flag: babylog_premium_onboarding_shown_{uid}
 */
export default function PremiumOnboardingModal({ open, onClose, onNavigateToReport }) {
  useLocale()
  if (!open) return null

  const features = [
    { icon: '📄', key: 'pdf' },
    { icon: '👶', key: 'multi_child' },
    { icon: '📊', key: 'stats' },
    { icon: '🎯', key: 'customization' },
  ]

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #fff 0%, #F7F7F5 100%)',
        borderRadius: 20, padding: 28, maxWidth: 440, width: '100%',
        boxShadow: '0 20px 60px rgba(15, 110, 86, 0.4)',
        border: '2px solid #9FE1CB',
      }}>
        {/* Celebracja */}
        <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 8 }}>🎉</div>

        <h2 style={{
          fontSize: 22, fontWeight: 800, textAlign: 'center',
          margin: '0 0 8px', color: '#0F6E56',
        }}>
          {t('premium_onboarding.title')}
        </h2>

        <p style={{
          fontSize: 14, textAlign: 'center', color: '#5a5a56',
          marginBottom: 20, lineHeight: 1.5,
        }}>
          {t('premium_onboarding.subtitle')}
        </p>

        {/* Lista funkcji Premium */}
        <div style={{
          background: '#fff', border: '1px solid #D9E9E1',
          borderRadius: 12, padding: 14, marginBottom: 18,
        }}>
          {features.map(f => (
            <div
              key={f.key}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '8px 0',
                borderBottom: f.key !== 'customization' ? '1px solid #F0F0EC' : 'none',
              }}
            >
              <div style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: '#1a1a18',
                  marginBottom: 2,
                }}>
                  {t(`premium_onboarding.features.${f.key}.title`)}
                </div>
                <div style={{ fontSize: 12, color: '#7a7a74', lineHeight: 1.4 }}>
                  {t(`premium_onboarding.features.${f.key}.desc`)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onNavigateToReport}
            style={{
              width: '100%', padding: '14px', minHeight: 52,
              background: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('premium_onboarding.cta_primary')}
          </button>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '12px', minHeight: 48,
              background: 'transparent', color: '#5a5a56',
              border: 'none', borderRadius: 12,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('premium_onboarding.cta_secondary')}
          </button>
        </div>
      </div>
    </div>
  )
}
