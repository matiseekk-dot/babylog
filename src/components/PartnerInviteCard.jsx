import React, { useEffect } from 'react'
import { t, useLocale } from '../i18n'
import { trackPartnerCardShown } from '../utils/analytics'

/**
 * PartnerInviteCard — "Zaproś drugiego rodzica" na ekranie Dziś.
 *
 * Kiedy pokazać decyduje shouldShowPartnerInvite() w App.jsx (Premium/trial
 * od ~2 dni, brak partnerów, karta niezamknięta). Gdy oboje rodzice używają
 * apki w trialu, po jego końcu Premium tracą oboje — to mocniejszy powód
 * do zakupu niż u jednej osoby.
 *
 * Props:
 *   onInvite  — fn(): otwórz Ustawienia na sekcji Wspólne konto
 *   onDismiss — fn(): zamknij na stałe (parent zapisuje flagę)
 */
export default function PartnerInviteCard({ onInvite, onDismiss }) {
  useLocale()

  useEffect(() => { trackPartnerCardShown() }, [])

  return (
    <div style={{
      margin: '12px 16px',
      padding: '16px 16px 14px',
      background: '#E1F5EE',
      border: '1px solid #0F6E5633',
      borderRadius: 16,
      position: 'relative',
    }}>
      <button
        onClick={onDismiss}
        aria-label={t('partner.card.dismiss_aria')}
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 28, height: 28,
          background: 'transparent', border: 'none',
          color: '#0F6E56', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.65,
        }}
      >×</button>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, paddingRight: 28 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          boxShadow: '0 2px 6px #0F6E5622',
        }}>
          👨‍👩‍👧
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a18', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
          {t('partner.card.title')}
        </div>
      </div>

      <div style={{ fontSize: 13, color: '#3a3a36', lineHeight: 1.5, marginBottom: 12 }}>
        {t('partner.card.body')}
      </div>

      <button
        type="button"
        onClick={onInvite}
        style={{
          background: '#0F6E56', color: '#fff',
          border: 'none', borderRadius: 10,
          padding: '8px 14px', minHeight: 36,
          fontSize: 13, fontWeight: 700,
          cursor: 'pointer', letterSpacing: '-0.01em',
        }}
      >
        {t('partner.invite')}
      </button>
    </div>
  )
}
