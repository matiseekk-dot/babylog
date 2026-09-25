import React, { useState } from 'react'
import { t, useLocale } from '../i18n'
import { toast } from './Toast'
import PartnerJoinForm from './PartnerJoinForm'
import { callPartnerFn, partnerErrorText } from '../utils/partner'
import { trackPartnerInviteCreated, trackPartnerInviteShared } from '../utils/analytics'

/**
 * Wspólne konto dla rodziców (Premium).
 *
 * Właściciel generuje 6-znakowy kod (Cloud Function createPartnerInvite),
 * partner wpisuje go u siebie (acceptPartnerInvite) — tutaj albo na ekranie
 * onboardingu. Od tego momentu apka partnera czyta i zapisuje dane dziecka
 * właściciela — patrz dataUid w App.jsx.
 * Wszystkie zmiany powiązań robią Cloud Functions; klient tylko czyta.
 *
 * partners — lista z usePartners() w App.jsx (null gdy się ładuje).
 */

export default function PartnerSharingSection({
  authUid, linkedOwner, partners, isPremium, onUpgrade, cardStyle, headerStyle, dangerBtnStyle,
}) {
  useLocale()
  const [invite, setInvite] = useState(null)
  const [busy, setBusy] = useState(false)
  const partnerList = partners || []

  const run = async (fn) => {
    setBusy(true)
    try { await fn() }
    catch (e) { toast(partnerErrorText(e), 'error') }
    finally { setBusy(false) }
  }

  const createInvite = () => {
    if (!isPremium) { onUpgrade(); return }
    run(async () => {
      setInvite(await callPartnerFn('createPartnerInvite'))
      trackPartnerInviteCreated()
    })
  }

  const shareInvite = async () => {
    const text = t('partner.share_text', { code: invite.code })
    if (navigator.share) {
      try {
        await navigator.share({ text })
        trackPartnerInviteShared('share')
      } catch { /* anulowane przez usera */ }
      return
    }
    try {
      await navigator.clipboard.writeText(invite.code)
      trackPartnerInviteShared('clipboard')
      toast(t('partner.copied'))
    } catch { /* brak dostępu do schowka — kod i tak jest na ekranie */ }
  }

  const unlink = (partnerUid) => {
    const msg = t(partnerUid ? 'partner.remove_confirm' : 'partner.leave_confirm')
    if (!window.confirm(msg)) return
    run(() => callPartnerFn('removePartnerLink', partnerUid ? { partnerUid } : {}))
  }

  const btn = {
    width: '100%', padding: '12px', minHeight: 44,
    background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
    opacity: busy ? 0.6 : 1,
  }
  const hint = { fontSize: 12, color: '#5a5a56', lineHeight: 1.45, marginBottom: 10 }

  let body
  if (!authUid) {
    body = <div style={hint}>{t('partner.login_required')}</div>
  } else if (linkedOwner) {
    body = (
      <>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a18', marginBottom: 4 }}>
          👥 {t('partner.linked_to', { name: linkedOwner.ownerName || '—' })}
        </div>
        <div style={hint}>{t('partner.linked_desc')}</div>
        <button onClick={() => unlink(null)} disabled={busy} style={dangerBtnStyle}>
          {t('partner.leave')}
        </button>
      </>
    )
  } else {
    body = (
      <>
        <div style={hint}>{t('partner.desc')}</div>

        {partnerList.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {partnerList.map(p => (
              <div key={p.uid} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)',
              }}>
                <span style={{ flex: 1, fontSize: 13, color: '#1a1a18' }}>
                  👤 {p.name || p.email || '—'}
                </span>
                <button onClick={() => unlink(p.uid)} disabled={busy} style={{
                  background: 'none', border: 'none', color: '#B84E2E',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  {t('partner.remove')}
                </button>
              </div>
            ))}
          </div>
        )}

        {invite ? (
          <div style={{
            background: '#E1F5EE', borderRadius: 12, padding: 14,
            textAlign: 'center', marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, color: '#0F6E56', fontWeight: 700, marginBottom: 6 }}>
              {t('partner.code_label')}
            </div>
            <div style={{
              fontSize: 30, fontWeight: 800, letterSpacing: 6,
              color: '#0F6E56', fontFamily: 'monospace', marginBottom: 6,
            }}>
              {invite.code}
            </div>
            <div style={{ fontSize: 11, color: '#5a5a56', marginBottom: 10 }}>
              {t('partner.code_valid')}
            </div>
            <button onClick={shareInvite} style={btn}>{t('partner.share')}</button>
          </div>
        ) : (
          <button onClick={createInvite} disabled={busy} style={{ ...btn, marginBottom: 12 }}>
            {!isPremium && '🔒 '}{t('partner.invite')}
          </button>
        )}

        {partnerList.length === 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3a3a36', margin: '4px 0 6px' }}>
              {t('partner.join_title')}
            </div>
            <div style={hint}>{t('partner.join_desc')}</div>
            <PartnerJoinForm source="settings" onJoined={() => toast(t('partner.joined'))} />
          </>
        )}
      </>
    )
  }

  // id + scrollMarginTop: karta "Zaproś partnera" z ekranu Dziś przewija tutaj
  // (nagłówek Ustawień jest sticky, więc zostawiamy nad kartą margines).
  return (
    <div id="settings-partner" style={{ ...cardStyle, scrollMarginTop: 72 }}>
      <div style={headerStyle}>{t('partner.title')}</div>
      <div style={{ padding: '12px 14px' }}>{body}</div>
    </div>
  )
}
