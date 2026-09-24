import React, { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'
import { t, useLocale } from '../i18n'
import { toast } from './Toast'
import { captureError } from '../sentry'

/**
 * Wspólne konto dla rodziców (Premium).
 *
 * Właściciel generuje 6-znakowy kod (Cloud Function createPartnerInvite),
 * partner wpisuje go u siebie (acceptPartnerInvite). Od tego momentu apka
 * partnera czyta i zapisuje dane dziecka właściciela — patrz dataUid w App.jsx.
 * Wszystkie zmiany powiązań robią Cloud Functions; klient tylko czyta.
 */

const KNOWN_ERRORS = [
  'not-premium', 'too-many-partners', 'is-partner', 'invite-not-found',
  'invite-expired', 'own-invite', 'already-linked', 'has-partners',
]

function errorText(err) {
  const code = err?.message
  return KNOWN_ERRORS.includes(code) ? t(`partner.error.${code}`) : t('partner.error.generic')
}

async function callFn(name, data = {}) {
  const res = await httpsCallable(functions, name)(data)
  return res.data
}

export default function PartnerSharingSection({
  authUid, linkedOwner, isPremium, onUpgrade, cardStyle, headerStyle, dangerBtnStyle,
}) {
  useLocale()
  const [partners, setPartners] = useState([])
  const [invite, setInvite] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!authUid || linkedOwner) return
    return onSnapshot(
      collection(db, 'users', authUid, 'partners'),
      snap => setPartners(snap.docs.map(d => ({ uid: d.id, ...d.data() }))),
      err => captureError(err, { context: 'partners-list' }),
    )
  }, [authUid, linkedOwner])

  const run = async (fn) => {
    setBusy(true)
    try { await fn() }
    catch (e) { toast(errorText(e), 'error') }
    finally { setBusy(false) }
  }

  const createInvite = () => {
    if (!isPremium) { onUpgrade(); return }
    run(async () => setInvite(await callFn('createPartnerInvite')))
  }

  const shareInvite = async () => {
    const text = t('partner.share_text', { code: invite.code })
    if (navigator.share) {
      try { await navigator.share({ text }) } catch { /* anulowane przez usera */ }
      return
    }
    try {
      await navigator.clipboard.writeText(invite.code)
      toast(t('partner.copied'))
    } catch { /* brak dostępu do schowka — kod i tak jest na ekranie */ }
  }

  const join = () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) { toast(t('partner.error.invite-not-found'), 'error'); return }
    run(async () => {
      await callFn('acceptPartnerInvite', { code })
      setJoinCode('')
      toast(t('partner.joined'))
    })
  }

  const unlink = (partnerUid) => {
    const msg = t(partnerUid ? 'partner.remove_confirm' : 'partner.leave_confirm')
    if (!window.confirm(msg)) return
    run(() => callFn('removePartnerLink', partnerUid ? { partnerUid } : {}))
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

        {partners.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {partners.map(p => (
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

        {partners.length === 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3a3a36', margin: '4px 0 6px' }}>
              {t('partner.join_title')}
            </div>
            <div style={hint}>{t('partner.join_desc')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="ABC123"
                autoCapitalize="characters"
                style={{ flex: 1, letterSpacing: 3, fontFamily: 'monospace', fontSize: 16 }}
              />
              <button onClick={join} disabled={busy || joinCode.length !== 6} style={{
                ...btn, width: 'auto', padding: '0 16px',
                opacity: busy || joinCode.length !== 6 ? 0.5 : 1,
              }}>
                {t('partner.join')}
              </button>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>{t('partner.title')}</div>
      <div style={{ padding: '12px 14px' }}>{body}</div>
    </div>
  )
}
