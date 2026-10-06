import React, { useEffect, useMemo, useRef, useState } from 'react'
import { t, tPlural, useLocale, getLocale } from '../i18n'
import Modal from './Modal'
import { useFirestore } from '../hooks/useFirestore'
import { drawBirthCard, THEMES } from '../utils/announcement'
import { birthSummary } from '../utils/birthSummary'
import { shareCardImage } from '../utils/shareCard'
import { track } from '../utils/analytics'

/**
 * Karta narodzin i "Wasza ciąża w liczbach" (v2.17.7). Otwiera się zaraz po
 * "Urodziło się" (przed prezentem 14 dni), a potem przez 30 dni z karty na
 * ekranie Dziś. Stopka "Spokojny Rodzic" jak na karcie ogłoszenia ciąży:
 * zostaje w wersji darmowej, w Premium można ją wyłączyć.
 */
export default function BirthCardModal({ open, ...props }) {
  if (!open || !props.profile) return null
  return <BirthCardInner {...props} />
}

function BirthCardInner({ profile, uid, isPremium, onUpgrade, onClose, source }) {
  useLocale()
  const locale = getLocale()
  const id = profile.id
  const [contractions] = useFirestore(uid, `contractions_${id}`, [])
  const [kicks] = useFirestore(uid, `kicks_${id}`, [])
  const [lists] = useFirestore(uid, `lists_${id}`, {})
  const [exams] = useFirestore(uid, `exams_${id}`, {})
  const [theme, setTheme] = useState('sage')
  const [parents, setParents] = useState('')
  const [footer, setFooter] = useState(true)
  const [image, setImage] = useState('')
  const [shareFailed, setShareFailed] = useState(false)
  const canvasRef = useRef(null)

  const s = birthSummary({ profile, contractions, kicks, lists, exams, locale })
  const date = new Date(`${profile.birthDate}T12:00:00`)
  const dateLine = (isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date))
    + (profile.birthTime ? `, ${profile.birthTime}` : '')
  const details = [
    profile.birthWeightG ? `${profile.birthWeightG} g` : '',
    profile.birthLengthCm ? `${String(profile.birthLengthCm).replace('.', locale === 'en' ? '.' : ',')} cm` : '',
  ].filter(Boolean).join(' · ')

  const options = useMemo(() => ({
    kicker: t(profile.sex === 'F' ? 'bcard.kicker_f' : 'bcard.kicker'),
    name: profile.name,
    dateLine,
    details,
    parents: parents.trim(),
    theme,
    footer: footer || !isPremium ? t('app.title') : null,
  }), [profile.sex, profile.name, dateLine, details, parents, theme, footer, isPremium, locale])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    drawBirthCard(canvasRef.current, options)
    setImage(canvasRef.current.toDataURL('image/jpeg', 0.92))
  }, [options])

  useEffect(() => { track('birth_card_opened', { source }) }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const share = async () => {
    const method = await shareCardImage(image, { text: t('bcard.share_text'), title: t('bcard.title') })
    if (method === 'aborted') return
    if (!method) setShareFailed(true)
    track('birth_card_shared', { method: method || 'screenshot' })
  }

  // Wiersze podsumowania: tylko to, co para naprawdę zapisała.
  const rows = []
  if (s.ga) rows.push(['🗓️', t('bcard.stat_week'), `${s.ga.weeks}+${s.ga.days}`])
  if (s.earlyDays != null) {
    rows.push(['🎯', t('bcard.stat_due'), s.earlyDays === 0 ? t('bcard.on_due')
      : s.earlyDays > 0 ? tPlural('bcard.early', s.earlyDays) : tPlural('bcard.late', -s.earlyDays)])
  }
  if (s.contractions) rows.push(['⏱️', t('bcard.stat_contractions'), String(s.contractions)])
  if (s.kicks) rows.push(['🦶', t('bcard.stat_kicks'), String(s.kicks)])
  if (s.bag.done) rows.push(['🧳', t('bcard.stat_bag'), t('lists.progress', s.bag)])
  if (s.exams && locale === 'pl') rows.push(['🩺', t('bcard.stat_exams'), String(s.exams)])

  const label = { fontSize: 12, fontWeight: 700, color: 'var(--text-2)', margin: '12px 0 6px' }

  return (
    <Modal open onClose={onClose} title={`👶 ${t('bcard.title')}`}>
      {image && (
        <img src={image} alt={`${options.kicker}. ${options.name}. ${dateLine}`} style={{
          display: 'block', width: '100%', maxWidth: 260, margin: '0 auto', borderRadius: 14,
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)', aspectRatio: '1080 / 1350',
        }} />
      )}
      {shareFailed && (
        <div role="status" style={{ marginTop: 10, background: 'var(--info-50)', color: 'var(--info-700)', borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.45 }}>
          📸 {t('announce.screenshot')}
        </div>
      )}

      <button type="button" className="btn-primary" onClick={share} style={{ width: '100%', marginTop: 14 }}>
        {t('announce.share')}
      </button>

      {rows.length > 0 && (
        <section aria-label={t('bcard.summary_title')} style={{ marginTop: 16, background: 'var(--brand-50)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-700)', marginBottom: 6 }}>{t('bcard.summary_title')}</div>
          {rows.map(([icon, k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 14, color: 'var(--text)' }}>
              <span aria-hidden="true">{icon}</span>
              <span style={{ flex: 1 }}>{k}</span>
              <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
            </div>
          ))}
        </section>
      )}

      <label style={{ ...label, display: 'block' }} htmlFor="bcard-parents">{t('announce.names')}</label>
      <input id="bcard-parents" className="form-input" type="text" maxLength={40} value={parents}
        placeholder={t('announce.names_ph')} onChange={e => setParents(e.target.value)} style={{ fontSize: 16 }} />

      <div style={label}>{t('announce.theme')}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {Object.entries(THEMES).map(([tid, th]) => (
          <button key={tid} type="button" aria-label={tid} aria-pressed={theme === tid} onClick={() => setTheme(tid)} style={{
            width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
            background: `linear-gradient(135deg, ${th.from}, ${th.to})`,
            border: theme === tid ? `3px solid ${th.soft}` : '1px solid var(--border-med)',
          }} />
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
        <input type="checkbox" checked={footer || !isPremium} onChange={e => {
          if (!isPremium) { onUpgrade?.(); return }
          setFooter(e.target.checked)
        }} style={{ width: 20, height: 20 }} />
        <span>{t('announce.footer')}{!isPremium && <span style={{ color: 'var(--text-3)' }}> · 🔒 {t('announce.footer_premium')}</span>}</span>
      </label>

      <button type="button" onClick={onClose} style={{
        width: '100%', minHeight: 48, marginTop: 14, borderRadius: 'var(--radius)', cursor: 'pointer',
        background: 'none', border: '0.5px solid var(--border-med)', color: 'var(--text)', fontSize: 15, fontWeight: 600,
      }}>
        {t('bcard.done')}
      </button>
    </Modal>
  )
}

/** Karta na ekranie Dziś przez 30 dni po narodzinach z trybu ciąży. */
export function BirthCardTeaser({ name, onOpen, onDismiss }) {
  useLocale()
  return (
    <div style={{ position: 'relative', margin: '12px 16px' }}>
      <button type="button" onClick={onOpen} style={{
        display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
        background: 'linear-gradient(135deg, #EAF5EE, #FDEDE5)', border: '0.5px solid var(--border)', borderRadius: 14,
        padding: '14px 44px 14px 16px', cursor: 'pointer', minHeight: 64,
      }}>
        <span style={{ fontSize: 26 }}>👶</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('bcard.teaser_title', { name })}</span>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t('bcard.teaser_desc')}</span>
        </span>
      </button>
      <button type="button" onClick={onDismiss} aria-label={t('bcard.dismiss_aria')} style={{
        position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: 'var(--text-3)',
        fontSize: 18, minWidth: 40, minHeight: 40, cursor: 'pointer',
      }}>×</button>
    </div>
  )
}
