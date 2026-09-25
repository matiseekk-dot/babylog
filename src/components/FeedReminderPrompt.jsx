import React, { useEffect } from 'react'
import { t, useLocale } from '../i18n'
import { FEED_REMINDER_OPTIONS, formatHours } from '../utils/feedReminder'
import { track } from '../utils/analytics'

/**
 * FeedReminderPrompt — "Przypomnieć o następnym karmieniu?" po wpisie karmienia.
 *
 * v2.16.3: wcześniej zgodę na powiadomienia dawało się wyłącznie w Ustawieniach
 * i przy lekach, więc większość osób jej nie miała, a apka nie miała jak
 * przypomnieć o sobie (retencja D1 ~7%). Tu prośba o zgodę pada w momencie,
 * gdy przypomnienie jest realnie przydatne.
 *
 * Props:
 *   isGuest      — gość nie dostanie push (brak konta) → zamiast wyboru logowanie
 *   onChoose(min) / onLater() / onNever() / onLogin()
 */
export default function FeedReminderPrompt({ isGuest, onChoose, onLater, onNever, onLogin }) {
  useLocale()

  useEffect(() => { track('feed_reminder_prompt_shown', { guest: isGuest ? 1 : 0 }) }, [isGuest])

  const chip = {
    flex: 1, minHeight: 48, padding: '8px 4px',
    background: 'var(--brand-50)', color: 'var(--brand-700)',
    border: '1px solid var(--brand-100)', borderRadius: 12,
    fontSize: 14, fontWeight: 800, cursor: 'pointer',
  }

  return (
    <>
      <div onClick={onLater} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 120,
      }} />
      <div role="dialog" aria-labelledby="feed-reminder-title" style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 121,
        background: 'var(--surface)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: '18px 16px max(16px, env(safe-area-inset-bottom))',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.14)',
      }}>
        <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 4 }}>⏰</div>
        <div id="feed-reminder-title" style={{
          fontSize: 17, fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: 6,
        }}>
          {t('feed_reminder.title')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.45, marginBottom: 14 }}>
          {t(isGuest ? 'feed_reminder.guest_desc' : 'feed_reminder.desc')}
        </div>

        {isGuest ? (
          <button type="button" onClick={onLogin} style={{
            width: '100%', minHeight: 48, padding: 12,
            background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            {t('onb.partner.login')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {FEED_REMINDER_OPTIONS.map(min => (
              <button key={min} type="button" onClick={() => onChoose(min)} style={chip}>
                {t('feed_reminder.in', { h: formatHours(min) })}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
          <button type="button" onClick={onLater} style={{
            background: 'none', border: 'none', color: 'var(--text-2)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 8,
          }}>
            {t('feed_reminder.later')}
          </button>
          {!isGuest && (
            <button type="button" onClick={onNever} style={{
              background: 'none', border: 'none', color: 'var(--text-3)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 8,
            }}>
              {t('feed_reminder.never')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
