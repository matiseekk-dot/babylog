import React, { useState } from 'react'
import { t, tPlural, useLocale, getLocale } from '../i18n'
import { readCached } from '../hooks/useFirestore'
import { pregnancyProgress, GESTATION_DAYS } from '../utils/pregnancy'
import ContractionTimer from './ContractionTimer'
import AnnouncementModal from './AnnouncementModal'

/** "25. tydzień ciąży" dla profilu ciąży (lista dzieci, nagłówek). */
export function pregnancyWeekText(dueDate, termDays = GESTATION_DAYS) {
  const p = pregnancyProgress(dueDate, new Date(), termDays)
  return p ? t('preg.week_big', { week: p.week, w: p.weeks, d: p.days }) : ''
}

export function formatLongDate(ymd) {
  const d = new Date(`${ymd}T12:00:00`)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

/**
 * PregnancyScreen — ekran główny profilu w trybie ciąży (v2.17.0).
 *
 * Zakładki: Ciąża (tydzień, trymestr, odliczanie) i Skurcze (licznik).
 * "Urodziło się" jest zawsze dostępne na dole, a od 36. tygodnia także jako
 * karta na górze. "Zakończ tryb ciąży" to mały, spokojny link na samym dole.
 *
 * Props:
 *   profile  — aktywny profil { id, name, avatar, dueDate, mode: 'pregnancy' }
 *   uid      — właściciel danych (dataUid)
 *   onBirth  — fn(): otwórz okienko "Urodziło się"
 *   onEnd    — fn(): otwórz okienko zakończenia trybu ciąży
 *   children — dodatkowe karty pod licznikiem tygodni (np. zaproszenie partnera)
 *   isPremium, onUpgrade — karta "Będzie nas troje" (podpis do wyłączenia w Premium)
 */
export default function PregnancyScreen({ profile, uid, onBirth, onEnd, children, isPremium, onUpgrade }) {
  useLocale()
  // Trwający skurcz po ponownym otwarciu apki: od razu licznik.
  const [tab, setTab] = useState(() => {
    const list = readCached(uid, `contractions_${profile.id}`, [])
    return Array.isArray(list) && list.some(c => c && c.end == null) ? 'contractions' : 'home'
  })
  const p = pregnancyProgress(profile.dueDate, new Date(), profile.termDays || GESTATION_DAYS)
  const [showAnnounce, setShowAnnounce] = useState(false)

  const segBtn = active => ({
    flex: 1, padding: '10px 8px', minHeight: 44, border: 'none', borderRadius: 10, cursor: 'pointer',
    fontSize: 14, fontWeight: 700,
    background: active ? 'var(--surface)' : 'transparent',
    color: active ? 'var(--brand-700)' : 'var(--text-2)',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
  })

  const countdown = !p ? '' : p.daysLeft > 0
    ? tPlural('preg.due_in', p.daysLeft)
    : p.daysLeft === 0 ? t('preg.due_today') : tPlural('preg.overdue', -p.daysLeft)

  return (
    <div style={{ paddingBottom: 24 }}>
      <div role="tablist" style={{
        display: 'flex', gap: 4, margin: '12px 16px', padding: 4,
        background: 'var(--gray-light)', borderRadius: 12,
      }}>
        <button type="button" role="tab" aria-selected={tab === 'home'} style={segBtn(tab === 'home')} onClick={() => setTab('home')}>
          🤰 {t('preg.tab.home')}
        </button>
        <button type="button" role="tab" aria-selected={tab === 'contractions'} style={segBtn(tab === 'contractions')} onClick={() => setTab('contractions')}>
          ⏱️ {t('preg.tab.contractions')}
        </button>
      </div>

      {tab === 'contractions' ? (
        <ContractionTimer uid={uid} profileId={profile.id} />
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Tydzień ciąży */}
          {p && (
            <div style={{
              background: 'linear-gradient(150deg, var(--brand-600), var(--brand-500))',
              borderRadius: 18, padding: '20px 18px', color: '#fff',
            }}>
              <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>
                {profile.avatar || '🤰'} {profile.name}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15, marginTop: 6 }}>
                {t('preg.week_big', { week: p.week, w: p.weeks, d: p.days })}
              </div>
              <div style={{ fontSize: 14, opacity: 0.92, marginTop: 4 }}>
                {t('preg.week_small', { week: p.week, w: p.weeks, d: p.days })} · {t(`preg.trimester.${p.trimester}`)}
              </div>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent}
                style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.3)', margin: '16px 0 10px', overflow: 'hidden' }}>
                <div style={{ width: `${p.percent}%`, height: '100%', background: '#fff', borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{countdown}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                {t('preg.due_label', { date: formatLongDate(profile.dueDate) })}
              </div>
            </div>
          )}

          {p && p.daysLeft < 0 && (
            <div style={{ background: 'var(--warning-50)', borderRadius: 12, padding: '12px 14px', fontSize: 13, lineHeight: 1.5, color: 'var(--warning-700)' }}>
              {t('preg.overdue_hint')}
            </div>
          )}

          {/* Od 36. tygodnia "Urodziło się" na wierzchu */}
          {p && p.weeks >= 36 && (
            <div style={{ background: 'var(--surface)', border: '1.5px solid var(--brand-500)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 10 }}>{t('preg.birth_hint')}</div>
              <button type="button" className="btn-primary" onClick={onBirth} style={{ width: '100%' }}>
                {t('preg.birth_btn')}
              </button>
            </div>
          )}

          {/* Skrót do licznika skurczy */}
          <button type="button" onClick={() => setTab('contractions')} style={{
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
            background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 14,
            padding: '14px 16px', cursor: 'pointer', minHeight: 64,
          }}>
            <span style={{ fontSize: 26 }}>⏱️</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('preg.contractions_title')}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t('preg.contractions_desc')}</span>
            </span>
            <span style={{ fontSize: 20, color: 'var(--text-3)' }}>›</span>
          </button>

          {/* v2.17.2: karta do ogłoszenia ciąży (pętla polecenia: stopka z nazwą apki) */}
          <button type="button" onClick={() => setShowAnnounce(true)} style={{
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
            background: 'linear-gradient(135deg, #FDEDE5, #FCE9F1)', border: '0.5px solid var(--border)', borderRadius: 14,
            padding: '14px 16px', cursor: 'pointer', minHeight: 64,
          }}>
            <span style={{ fontSize: 26 }}>🎉</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('announce.title')}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t('announce.cta_desc')}</span>
            </span>
            <span style={{ fontSize: 20, color: 'var(--text-3)' }}>›</span>
          </button>

          {children}

          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, textAlign: 'center', padding: '4px 8px' }}>
            {t('preg.coming_soon')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 8 }}>
            {(!p || p.weeks < 36) && (
              <button type="button" onClick={onBirth} style={linkBtn('var(--brand-600)')}>
                {t('preg.birth_btn')}
              </button>
            )}
            <button type="button" onClick={onEnd} style={linkBtn('var(--text-3)')}>
              {t('preg.end_link')}
            </button>
          </div>
        </div>
      )}
      <AnnouncementModal
        open={showAnnounce}
        onClose={() => setShowAnnounce(false)}
        dueDate={profile.dueDate}
        isPremium={isPremium}
        onUpgrade={() => { setShowAnnounce(false); onUpgrade?.() }}
      />
    </div>
  )
}

const linkBtn = color => ({
  background: 'none', border: 'none', cursor: 'pointer', color,
  fontSize: 13, fontWeight: 600, padding: '10px 12px',
})
