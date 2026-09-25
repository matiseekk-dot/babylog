import React, { useState } from 'react'
import { t, useLocale } from '../i18n'
import { callPartnerFn, normalizeInviteCode, partnerErrorText } from '../utils/partner'
import { trackPartnerJoined, trackPartnerJoinFailed } from '../utils/analytics'

/**
 * Pole na kod od partnera + "Dołącz" (acceptPartnerInvite).
 *
 * Używane w Ustawieniach i na ekranie onboardingu. Błąd pokazujemy pod polem,
 * a nie toastem — onboarding nie renderuje ToastContainer.
 * Po sukcesie App sam przełącza dane na konto właściciela (linked_owner).
 *
 * Props:
 *   source   — 'settings' | 'onboarding' (analytics)
 *   onJoined — fn() po udanym dołączeniu
 */
export default function PartnerJoinForm({ source, onJoined }) {
  useLocale()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const join = async () => {
    if (code.length !== 6) { setError(t('partner.error.invite-not-found')); return }
    setBusy(true)
    setError(null)
    try {
      await callPartnerFn('acceptPartnerInvite', { code })
      trackPartnerJoined(source)
      setCode('')
      onJoined?.()
    } catch (e) {
      trackPartnerJoinFailed(source, e?.message)
      setError(partnerErrorText(e))
    } finally {
      setBusy(false)
    }
  }

  const disabled = busy || code.length !== 6

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="form-input"
          value={code}
          onChange={e => { setCode(normalizeInviteCode(e.target.value)); setError(null) }}
          placeholder="ABC123"
          autoCapitalize="characters"
          style={{ flex: 1, letterSpacing: 3, fontFamily: 'monospace', fontSize: 16 }}
        />
        <button onClick={join} disabled={disabled} style={{
          padding: '0 16px', minHeight: 44,
          background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10,
          fontSize: 14, fontWeight: 700,
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}>
          {busy ? '…' : t('partner.join')}
        </button>
      </div>
      {error && (
        <div role="alert" style={{ fontSize: 12, color: '#B84E2E', fontWeight: 600, marginTop: 6 }}>
          {error}
        </div>
      )}
    </>
  )
}
