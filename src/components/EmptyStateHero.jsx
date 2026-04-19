import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * EmptyStateHero
 *
 * Shown on main Feeding tab when user has ZERO data across all tabs.
 * Onboards them with 3 clear CTAs: track temperature, medicine, feeding.
 *
 * Props:
 *   - onNavigate(tabId) — switch to a specific tab
 *   - onDismiss — hide this card (user can bring it back from Settings)
 */
export default function EmptyStateHero({ onNavigate, onDismiss }) {
  useLocale()

  const actions = [
    {
      id: 'temp',
      icon: '🌡️',
      title: t('empty_hero.temp.title'),
      desc: t('empty_hero.temp.desc'),
      bg: '#FEF3EE',
      color: '#D85A30',
    },
    {
      id: 'meds',
      icon: '💊',
      title: t('empty_hero.meds.title'),
      desc: t('empty_hero.meds.desc'),
      bg: '#E6F1FB',
      color: '#185FA5',
    },
    {
      id: 'feed',
      icon: '🍼',
      title: t('empty_hero.feed.title'),
      desc: t('empty_hero.feed.desc'),
      bg: '#E1F5EE',
      color: '#1D9E75',
    },
  ]

  return (
    <div style={{
      margin: '12px 16px',
      padding: '20px 18px',
      background: 'linear-gradient(135deg, #F5F9F7 0%, #EDF5F1 100%)',
      border: '1px solid #C5E8D9',
      borderRadius: 16,
      position: 'relative',
    }}>
      {/* Close button */}
      <button
        onClick={onDismiss}
        aria-label="Close"
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'transparent', border: 'none',
          color: 'var(--text-3)', fontSize: 20, cursor: 'pointer',
          padding: 4, width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ×
      </button>

      {/* Headline */}
      <div style={{
        fontSize: 18, fontWeight: 800, color: 'var(--text)',
        marginBottom: 6, letterSpacing: '-0.01em',
      }}>
        {t('empty_hero.title')}
      </div>
      <div style={{
        fontSize: 13, color: 'var(--text-2)',
        marginBottom: 16, lineHeight: 1.4,
      }}>
        {t('empty_hero.subtitle')}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {actions.map(a => (
          <button
            key={a.id}
            onClick={() => onNavigate(a.id)}
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              minHeight: 64,
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
            onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: a.bg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {a.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.35 }}>
                {a.desc}
              </div>
            </div>
            <div style={{ fontSize: 18, color: a.color, flexShrink: 0 }}>
              →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
