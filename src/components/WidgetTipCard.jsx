import React, { useEffect, useState } from 'react'
import { t, useLocale } from '../i18n'
import { getWidgetStatus, requestPinWidget } from '../native/spokojny'
import { toast } from './Toast'
import { track } from '../utils/analytics'

/**
 * WidgetTipCard — podpowiedź o widżecie i skrótach ikony (natywne v55+).
 *
 * Widżet sam z siebie nikomu się nie pokaże — trzeba o nim powiedzieć.
 * Przycisk otwiera systemowe okienko "Dodaj widżet" (v56, większość
 * launcherów); gdy się nie da (v55, launcher bez tej funkcji) — instrukcja.
 *
 * Props:
 *   variant   — 'today' (karta na Dziś, znika gdy widżet już jest) | 'settings'
 *   onDismiss — tylko 'today': zamknij na stałe
 */
export default function WidgetTipCard({ variant = 'today', onDismiss }) {
  useLocale()
  const [status, setStatus] = useState(null)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    let alive = true
    const refresh = () => getWidgetStatus().then(s => { if (alive) setStatus(s) })
    refresh()
    // Po powrocie z ekranu głównego (dodanie widżetu) — odśwież liczbę widżetów.
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  useEffect(() => {
    if (variant === 'today') track('widget_tip_shown')
  }, [variant])

  const hasWidget = (status?.count ?? 0) > 0
  if (variant === 'today' && hasWidget) return null

  const add = async () => {
    track('widget_tip_add', { variant, pin: status?.pinSupported ? 1 : 0 })
    if (status?.pinSupported && await requestPinWidget()) {
      toast(t('widget_tip.requested'), 'info')
      return
    }
    setShowManual(true)
  }

  const isToday = variant === 'today'

  return (
    <div style={{
      margin: isToday ? '12px 16px' : 0,
      padding: isToday ? '16px 16px 14px' : 0,
      background: isToday ? '#E6F1FB' : 'transparent',
      border: isToday ? '1px solid #185FA533' : 'none',
      borderRadius: 16,
      position: 'relative',
    }}>
      {isToday && (
        <button
          onClick={onDismiss}
          aria-label={t('partner.card.dismiss_aria')}
          style={{
            position: 'absolute', top: 8, right: 8, width: 28, height: 28,
            background: 'transparent', border: 'none', color: '#185FA5',
            fontSize: 18, cursor: 'pointer', opacity: 0.65,
          }}
        >×</button>
      )}

      {isToday && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, paddingRight: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
          }}>📲</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a18', lineHeight: 1.25 }}>
            {t('widget_tip.title')}
          </div>
        </div>
      )}

      <div style={{ fontSize: isToday ? 13 : 12, color: isToday ? '#3a3a36' : '#5a5a56', lineHeight: 1.5, marginBottom: 10 }}>
        {isToday ? t('widget_tip.body') : t('widget_tip.settings_hint')}
      </div>

      {hasWidget ? (
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56' }}>{t('widget_tip.added')}</div>
      ) : (
        <button type="button" onClick={add} style={{
          background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10,
          padding: '8px 14px', minHeight: 36, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          width: isToday ? 'auto' : '100%',
        }}>
          {t('widget_tip.add')}
        </button>
      )}

      {showManual && !hasWidget && (
        <div style={{
          marginTop: 10, padding: '10px 12px', background: '#fff', borderRadius: 10,
          fontSize: 12.5, color: '#1a1a18', lineHeight: 1.5,
        }}>
          👉 {t('widget_tip.manual')}
        </div>
      )}
    </div>
  )
}
