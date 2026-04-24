import React from 'react'
import { t, useLocale } from '../i18n'
import { useFirestore } from '../hooks/useFirestore'

/**
 * CallDoctorPrep
 *
 * Ekran pomocniczy — pokazuje uporządkowane informacje
 * które rodzic powinien powiedzieć pediatrze:
 *   - aktualna temperatura i jak zmieniała się w ciągu dnia
 *   - ostatnio podane leki i godziny
 *   - karmienie / pieluchy w ostatnich 24h
 *   - objawy dodatkowe (opcjonalnie)
 *
 * Rodzic otwiera w połączeniu z lekarzem — czyta na głos.
 */

export default function CallDoctorPrep({ profile, uid, onClose, onCall }) {

  useLocale()
  const displayMedName = (name) => {
    if (name === 'Paracetamol') return t('med.name.paracetamol')
    if (name === 'Ibuprofen') return t('med.name.ibuprofen')
    if (name === 'Sól fizjologiczna') return t('med.name.saline')
    if (name === 'Probiotyk') return t('med.name.probiotic')
    return name
  }

  useLocale()

  const babyId = profile.id
  const [temps]   = useFirestore(uid, `temp_${babyId}`,   [])
  const [meds]    = useFirestore(uid, `meds_${babyId}`,   [])
  const [feeds]   = useFirestore(uid, `feed_${babyId}`,   [])
  const [diapers] = useFirestore(uid, `diaper_${babyId}`, [])

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const recent = (arr) => arr
    .filter(l => l.date === today || l.date === yesterday)
    .sort((a, b) => (b.date+b.time).localeCompare(a.date+a.time))

  const recentTemps = recent(temps).slice(0, 10)
  const recentMeds = recent(meds).slice(0, 5)
  const recentFeeds = recent(feeds).filter(f => f.date === today)
  const recentDiapers = recent(diapers).filter(d => d.date === today)
  const wet = recentDiapers.filter(d => d.type === 'Mokra' || d.type === 'Obydwie').length

  const Section = ({ title, children }) => (
    <div style={{
      margin: '12px 16px 0',
      background: '#fff',
      borderRadius: 12,
      padding: '14px 16px',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: '#3a3a36',
        textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ minHeight: '100%', background: '#F7F7F5' }}>
      {/* Header */}
      <div style={{
        background: '#fff', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: '#3a3a36', padding: 4, minHeight: 36,
        }}>←</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a18' }}>
            {t('prep.title')}
          </div>
          <div style={{ fontSize: 11, color: '#9a9a94' }}>
            {t('prep.subtitle', { name: profile.name })}
          </div>
        </div>
      </div>

      {/* Intro */}
      <div style={{
        margin: '12px 16px 0', padding: '12px 14px',
        background: '#E6F1FB', borderRadius: 10,
        fontSize: 12, color: '#0C447C', lineHeight: 1.5,
      }}>
        💡 {t('prep.intro')}
      </div>

      {/* Child info */}
      <Section title={t('prep.section.child')}>
        <div style={{ fontSize: 13, color: '#3a3a36', lineHeight: 1.6 }}>
          <div><strong>{t('onb.setup.name')}:</strong> {profile.name}</div>
          <div><strong>{t('onb.setup.age')}:</strong> {profile.months} {t('prep.months')}</div>
          <div><strong>{t('onb.setup.weight')}:</strong> {profile.weight} kg</div>
        </div>
      </Section>

      {/* Temperature */}
      {recentTemps.length > 0 && (
        <Section title={`🌡 ${t('prep.section.temp')}`}>
          {recentTemps.map(l => (
            <div key={l.id} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)',
              fontSize: 13,
            }}>
              <span style={{ color: '#5a5a56' }}>
                {l.date === today ? t('common.today') : t('prep.yesterday')} {l.time}
              </span>
              <strong style={{
                color: Number(l.temp) >= 38.5 ? '#D85A30'
                      : Number(l.temp) >= 37.5 ? '#BA7517' : '#0F6E56'
              }}>
                {Number(l.temp).toFixed(1)}°C
              </strong>
            </div>
          ))}
        </Section>
      )}

      {/* Medications */}
      {recentMeds.length > 0 && (
        <Section title={`💊 ${t('prep.section.meds')}`}>
          {recentMeds.map(l => (
            <div key={l.id} style={{
              padding: '6px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)',
              fontSize: 13, color: '#3a3a36',
            }}>
              <div>
                <strong>{displayMedName(l.med)}</strong>
                {l.dose && <span> — {l.dose}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#9a9a94' }}>
                {l.date === today ? t('common.today') : t('prep.yesterday')} {t('prep.at')} {l.time}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Today's stats */}
      <Section title={`📊 ${t('prep.section.today')}`}>
        <div style={{ fontSize: 13, color: '#3a3a36', lineHeight: 1.8 }}>
          <div>🍼 {t('prep.feeds_today', { count: recentFeeds.length })}</div>
          <div>💧 {t('prep.wet_today', { count: wet })}</div>
          <div>💩 {t('prep.dirty_today', { count: recentDiapers.filter(d => d.type === 'Brudna' || d.type === 'Obydwie').length })}</div>
        </div>
      </Section>

      {/* Warning signs to mention */}
      <Section title={`⚠️ ${t('prep.section.mention')}`}>
        <div style={{ fontSize: 12, color: '#3a3a36', lineHeight: 1.7 }}>
          <div>• {t('prep.mention.1')}</div>
          <div>• {t('prep.mention.2')}</div>
          <div>• {t('prep.mention.3')}</div>
          <div>• {t('prep.mention.4')}</div>
        </div>
      </Section>

      {/* Contact info — bez automatycznego dzwonienia */}
      <div style={{ padding: '20px 16px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        <div style={{
          padding: '16px',
          background: '#FEF3EE',
          border: '1px solid #F0997B',
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#D85A30', marginBottom: 6 }}>
            🩺 {t('prep.contact.title')}
          </div>
          <div style={{ fontSize: 13, color: '#712B13', lineHeight: 1.55 }}>
            {t('prep.contact.desc')}
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#9a9a94', textAlign: 'center', marginTop: 10, lineHeight: 1.4 }}>
          {t('prep.emergency_note')}
        </div>
      </div>
    </div>
  )
}
