import React from 'react'
import { t, useLocale } from '../i18n'

/**
 * CallDoctorCard
 *
 * v2.7.5 refactor: Karta prezentująca PROGI REFERENCYJNE z literatury
 * medycznej (AAP, Mayo Clinic) — nie wsparcie decyzyjne. Wszystkie
 * komunikaty mają jasną atrybucję źródła i disclaimer że to nie jest
 * porada medyczna. Złagodzone kolory (amber zamiast czerwonego), brak
 * pulsującej animacji — UI nie ma "krzyczeć", treść mówi sama za siebie.
 *
 * Numer alarmowy 112 zostaje — to jest faktyczna informacja użytkowa,
 * nie rekomendacja apki (każdy zna 112).
 */

const SEVERITY_CONFIG = {
  watch: {
    color: '#854F0B', bg: '#FAEEDA', border: '#FAC775',
    emoji: 'ℹ️', titleKey: 'crisis.watch.title',
  },
  call: {
    color: '#854F0B', bg: '#FAEEDA', border: '#FAC775',
    emoji: 'ℹ️', titleKey: 'crisis.call.title',
  },
  emergency: {
    color: '#993C1D', bg: '#FAEEDA', border: '#F0997B',
    emoji: 'ℹ️', titleKey: 'crisis.emergency.title',
  },
}

export default function CallDoctorCard({ severity = 'watch', reason, onDismiss, onNavigate, onPrep }) {
  useLocale()
  const cfg = SEVERITY_CONFIG[severity]

  const EMERGENCY_PHONE = '112'

  const call112 = () => {
    window.location.href = `tel:${EMERGENCY_PHONE}`
  }

  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '16px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 14,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 22 }}>{cfg.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: cfg.color, lineHeight: 1.2 }}>
            {t(cfg.titleKey)}
          </div>
          <div style={{ fontSize: 12, color: '#5a5a56', marginTop: 2, lineHeight: 1.35 }}>
            {reason}
          </div>
          {/* Cytat źródła — kluczowe dla ramowania "informacja referencyjna" */}
          <div style={{
            fontSize: 10,
            color: cfg.color,
            opacity: 0.75,
            marginTop: 6,
            fontStyle: 'italic',
            lineHeight: 1.35,
          }}>
            {t('rule.source_label')} {t('rule.source.aap')}
          </div>
        </div>
        <button onClick={onDismiss} aria-label={t('common.close') || 'Zamknij'} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: '#9a9a94', padding: 4,
        }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {severity === 'watch' && (
          <>
            <button onClick={() => onNavigate('temp')} style={actionBtn(cfg, 'primary')}>
              {t('crisis.watch.action1')}
            </button>
            <div style={{
              padding: '10px 12px',
              background: 'rgba(186, 117, 23, 0.06)',
              borderRadius: 8,
              fontSize: 12,
              color: cfg.color,
              textAlign: 'center',
              lineHeight: 1.45,
              fontWeight: 500,
            }}>
              💡 {t('crisis.watch.advice')}
            </div>
          </>
        )}

        {severity === 'call' && (
          <>
            <div style={{
              padding: '14px',
              background: 'rgba(216, 90, 48, 0.08)',
              border: `1px solid ${cfg.border}`,
              borderRadius: 10,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: cfg.color, marginBottom: 4 }}>
                {t('crisis.call.action')}
              </div>
              <div style={{ fontSize: 12, color: '#712B13', lineHeight: 1.5 }}>
                {t('crisis.call.advice')}
              </div>
            </div>
            <button onClick={() => onPrep?.()} style={actionBtn(cfg, 'secondary')}>
              📋 {t('crisis.action.what_to_prepare')}
            </button>
          </>
        )}

        {severity === 'emergency' && (
          <>
            <button onClick={call112} style={{
              ...actionBtn(cfg, 'primary'),
              fontSize: 15,
            }}>
              {t('crisis.action.call_112')} — {EMERGENCY_PHONE}
            </button>
            <div style={{ fontSize: 11, color: '#712B13', textAlign: 'center', marginTop: 4, lineHeight: 1.4 }}>
              {t('crisis.emergency.disclaimer')}
            </div>
          </>
        )}
      </div>

      {/* Per-card disclaimer — wzmacnia framing "informacja referencyjna".
          MDCG 2019-11 wymaga jasnej komunikacji że to NIE jest medical advice. */}
      <div style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: `0.5px solid ${cfg.border}`,
        fontSize: 10,
        color: cfg.color,
        opacity: 0.7,
        lineHeight: 1.4,
      }}>
        {t('rule.disclaimer')}
      </div>
    </div>
  )
}

function actionBtn(cfg, variant) {
  return variant === 'primary'
    ? {
        width: '100%', padding: '13px', minHeight: 48,
        background: cfg.color, color: '#fff',
        border: 'none', borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }
    : {
        width: '100%', padding: '11px', minHeight: 44,
        background: 'transparent', color: cfg.color,
        border: `1px solid ${cfg.border}`, borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }
}
