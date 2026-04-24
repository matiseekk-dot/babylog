import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * PlayStoreModal
 *
 * Pokazuje się gdy user próbuje kupić Premium na stronie web (GitHub Pages)
 * zamiast w zainstalowanej apce z Google Play. Zachęca do instalacji apki.
 */
export default function PlayStoreModal({ open, onClose, onOpenPlayStore }) {
  useLocale()
  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24,
        maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>📱</div>

        <h2 style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', margin: '0 0 12px', color: '#1a1a18' }}>
          {t('play_modal.title')}
        </h2>

        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5a5a56', marginBottom: 14 }}>
          {t('play_modal.desc')}
        </p>

        <div style={{
          background: '#E1F5EE', border: '1px solid #9FCBEA', borderRadius: 10,
          padding: 12, fontSize: 12, color: '#085041', lineHeight: 1.5, marginBottom: 16,
        }}>
          {t('play_modal.note')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onOpenPlayStore}
            style={{
              width: '100%', padding: '14px', minHeight: 52,
              background: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('play_modal.cta')}
          </button>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '12px', minHeight: 48,
              background: '#F7F7F5', color: '#5a5a56',
              border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('play_modal.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
