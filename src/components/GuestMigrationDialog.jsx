import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * GuestMigrationDialog
 *
 * Pokazuje się gdy user zaloguje się i apka wykryje że ma też dane z trybu gościa.
 * Pyta czy dodać te dane do konta (bezpiecznie, bez nadpisywania) czy zostawić w spokoju.
 *
 * UX design:
 *  - NIE wyskakuje automatycznie — tylko gdy realnie są guest dane
 *  - User może anulować i dane guesta zostają nietknięte (backup)
 *  - "Dodaj do konta" używa strategy='preserve-existing' — nie nadpisuje Firestore
 *  - Wyraźna informacja że Twoje konto Google ma pierwszeństwo
 */
export default function GuestMigrationDialog({ open, status, onConfirm, onSkip }) {
  useLocale()
  if (!open) return null

  const loading = status === 'migrating'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24,
        maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>📦</div>

        <h2 style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', margin: '0 0 12px', color: '#1a1a18' }}>
          {t('guest_migration.title')}
        </h2>

        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5a5a56', marginBottom: 14 }}>
          {t('guest_migration.desc1')}
        </p>

        <div style={{
          background: '#FFF3E0', border: '1px solid #F5B971', borderRadius: 10,
          padding: 12, fontSize: 12, color: '#8A5A12', lineHeight: 1.5, marginBottom: 16,
        }}>
          ℹ️ {t('guest_migration.warning')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', minHeight: 48,
              background: loading ? '#9a9a94' : 'linear-gradient(135deg, #0F6E56, #1D9E75)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? t('guest_migration.loading') : t('guest_migration.confirm')}
          </button>
          <button
            onClick={onSkip}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', minHeight: 48,
              background: '#F7F7F5', color: '#5a5a56',
              border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            }}
          >
            {t('guest_migration.skip')}
          </button>
        </div>
      </div>
    </div>
  )
}
