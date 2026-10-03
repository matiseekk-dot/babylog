import React, { useEffect, useMemo, useRef, useState } from 'react'
import { t, useLocale, getLocale } from '../i18n'
import Modal from './Modal'
import { drawAnnouncement, seasonIndex, dueYear, monthYear, THEMES } from '../utils/announcement'
import { shareImageNative } from '../native/spokojny'
import { track } from '../utils/analytics'

/**
 * Karta "Będzie nas troje" (v2.17.2): para wybiera napis, sposób zapisu daty,
 * imiona i kolory, a aplikacja rysuje obrazek do wysłania rodzinie albo na
 * Instagram. Stopka "Spokojny Rodzic" zostaje w wersji darmowej (każde
 * udostępnienie pokazuje aplikację znajomym), w Premium można ją wyłączyć.
 *
 * Udostępnianie: natywnie (v58+, Spokojny.shareImage), w przeglądarce przez
 * Web Share z plikiem, a gdy żadne nie działa: podpowiedź "zrób zrzut ekranu".
 */
export default function AnnouncementModal({ open, onClose, dueDate, isPremium, onUpgrade }) {
  useLocale()
  const locale = getLocale()
  const [headline, setHeadline] = useState(1)
  const [dateStyle, setDateStyle] = useState('season')
  const [names, setNames] = useState('')
  const [theme, setTheme] = useState('sage')
  const [footer, setFooter] = useState(true)
  const [image, setImage] = useState('')
  const [shareFailed, setShareFailed] = useState(false)
  const canvasRef = useRef(null)

  const dateLine = dateStyle === 'season'
    ? `${t(`announce.season.${seasonIndex(dueDate)}`)} ${dueYear(dueDate)}`
    : monthYear(dueDate, locale)
  const options = useMemo(() => ({
    dateLine,
    headline: t(`announce.h${headline}`),
    names: names.trim(),
    theme,
    footer: footer || !isPremium ? t('app.title') : null,
  }), [dateLine, headline, names, theme, footer, isPremium, locale])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    drawAnnouncement(canvasRef.current, options)
    setImage(canvasRef.current.toDataURL('image/jpeg', 0.92))
  }, [open, options])

  useEffect(() => {
    if (open) { track('announcement_opened'); setShareFailed(false) }
  }, [open])

  if (!open) return null

  const share = async () => {
    const text = t('announce.share_text')
    const fileName = 'spokojny-rodzic.jpg'
    if (await shareImageNative({ dataUrl: image, text, title: t('announce.title'), fileName })) {
      track('announcement_shared', { method: 'native' })
      return
    }
    try {
      const blob = await (await fetch(image)).blob()
      const file = new File([blob], fileName, { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text })
        track('announcement_shared', { method: 'web' })
        return
      }
    } catch (e) {
      if (e?.name === 'AbortError') return  // użytkownik zamknął okno udostępniania
    }
    setShareFailed(true)
    track('announcement_shared', { method: 'screenshot' })
  }

  const chip = (active) => ({
    padding: '8px 12px', minHeight: 40, borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 700,
    border: active ? '2px solid var(--brand-500)' : '0.5px solid var(--border)',
    background: active ? 'var(--brand-50)' : 'var(--surface)',
    color: active ? 'var(--brand-700)' : 'var(--text-2)',
  })
  const label = { fontSize: 12, fontWeight: 700, color: 'var(--text-2)', margin: '12px 0 6px' }

  return (
    <Modal open onClose={onClose} title={`🎉 ${t('announce.title')}`}>
      {image && (
        <img src={image} alt={`${options.dateLine}. ${options.headline}`} style={{
          display: 'block', width: '100%', maxWidth: 300, margin: '0 auto', borderRadius: 14,
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)', aspectRatio: '1080 / 1350',
        }} />
      )}
      {shareFailed && (
        <div role="status" style={{ marginTop: 10, background: 'var(--info-50)', color: 'var(--info-700)', borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.45 }}>
          📸 {t('announce.screenshot')}
        </div>
      )}

      <div style={label}>{t('announce.headline')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[1, 2, 3].map(n => (
          <button key={n} type="button" style={chip(headline === n)} aria-pressed={headline === n} onClick={() => setHeadline(n)}>
            {t(`announce.h${n}`)}
          </button>
        ))}
      </div>

      <div style={label}>{t('announce.date')}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" style={chip(dateStyle === 'season')} aria-pressed={dateStyle === 'season'} onClick={() => setDateStyle('season')}>
          {`${t(`announce.season.${seasonIndex(dueDate)}`)} ${dueYear(dueDate)}`}
        </button>
        <button type="button" style={chip(dateStyle === 'month')} aria-pressed={dateStyle === 'month'} onClick={() => setDateStyle('month')}>
          {monthYear(dueDate, locale)}
        </button>
      </div>

      <label style={{ ...label, display: 'block' }} htmlFor="announce-names">{t('announce.names')}</label>
      <input id="announce-names" className="form-input" type="text" maxLength={40} value={names}
        placeholder={t('announce.names_ph')} onChange={e => setNames(e.target.value)} style={{ fontSize: 16 }} />

      <div style={label}>{t('announce.theme')}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {Object.entries(THEMES).map(([id, th]) => (
          <button key={id} type="button" aria-label={id} aria-pressed={theme === id} onClick={() => setTheme(id)} style={{
            width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
            background: `linear-gradient(135deg, ${th.from}, ${th.to})`,
            border: theme === id ? `3px solid ${th.soft}` : '1px solid var(--border-med)',
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

      <button type="button" className="btn-primary" onClick={share} style={{ width: '100%', marginTop: 16 }}>
        {t('announce.share')}
      </button>
    </Modal>
  )
}
