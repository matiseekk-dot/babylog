import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { useMedReminder } from '../hooks/useMedReminder'
import { t, useLocale } from '../i18n'
import { exportAllToCsv } from '../utils/csvExport'
import { exportAllDataAsJson, exportAllDataAsCsv } from '../utils/dataExport'
import PdfReportModal from './PdfReportModal'
import FeaturesScreen from './FeaturesScreen'
import { toast } from './Toast'

// Wersja aplikacji — podbijana przy release. Pokazana w stopce Settings.
// Do automatyzacji: Vite podstawia `__APP_VERSION__` jeśli zdefiniowane
// w `vite.config.js` przez `define`. Fallback to '0.0.0-dev' gdy brak.
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0-dev'

// Linki do dokumentów prawnych — hostowane na GitHub Pages razem z apką.
// Wymagane przez Google Play Console: in-app link do Privacy Policy i Delete Account.
// Sam URL w Console nie wystarczy — niektórzy reviewerzy odrzucają apkę bez linka in-app.
const LEGAL_URLS = {
  privacy: 'https://matiseekk-dot.github.io/babylog/privacy.html',
  deleteAccount: 'https://matiseekk-dot.github.io/babylog/delete-account.html',
}

const AVATARS = ['👶','🍼','⭐','🌙','🌈','🦋','🐣','🌸']

/**
 * SettingsScreen
 *
 * Props:
 *   profile, onUpdate, onDelete
 *   isPremium, trialDaysLeft, onUpgrade
 *   user, onLogout
 *   onClose
 */
export default function SettingsScreen({
  profile, onUpdate, onDelete,
  isPremium, isOnTrial, trialDaysLeft,
  onUpgrade, user, onLogout, onClose, uid,
}) {
  // Pobierz dane dziecka żeby móc wygenerować PDF
  const [tempLogs]  = useFirestore(uid, `temp_${profile.id}`,  [])
  const [medLogs]   = useFirestore(uid, `meds_${profile.id}`,  [])
  const [feedLogs]  = useFirestore(uid, `feed_${profile.id}`,  [])
  const [sleepLogs] = useFirestore(uid, `sleep_${profile.id}`, [])
  const [diaperLogs] = useFirestore(uid, `diaper_${profile.id}`, [])
  const [growthLogs] = useFirestore(uid, `growth_${profile.id}`, [])
  const [doctorNotes] = useFirestore(uid, `doctor_notes_${profile.id}`, [])
  const [symptomsLogs] = useFirestore(uid, `symptoms_${profile.id}`, [])
  const [coughLogs]    = useFirestore(uid, `cough_${profile.id}`, [])
  const [questions]    = useFirestore(uid, `doctor_questions_${profile.id}`, [])
  const { locale } = useLocale()
  const { permission: notifPermission, testNotification, askPermission: askNotifPermission } = useMedReminder(profile.id)
  const [pdfModal, setPdfModal] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [name, setName] = useState(profile.name)
  const totalMonths = profile.months || 0
  const initYears = Math.floor(totalMonths / 12)
  const initRemainderMonths = totalMonths % 12
  const [years, setYears] = useState(String(initYears))
  const [months, setMonths] = useState(String(initRemainderMonths))
  const [weight, setWeight] = useState(String(profile.weight))
  const [avatar, setAvatar] = useState(profile.avatar)
  const [sex, setSex] = useState(profile.sex || 'M')
  // Widoczne sekcje — defensywny default (istniejące profile mogą nie mieć)
  const initVisible = profile.visibleTabs || { feed: true, diaper: true }
  const [feedVisible, setFeedVisible] = useState(initVisible.feed !== false)
  const [diaperVisible, setDiaperVisible] = useState(initVisible.diaper !== false)
  // Bug 5 fix: toilet mode — previously editable only in onboarding.
  // Now also in Settings tak userzy mogą łatwo przełączać dziecko z pieluch → nocnik → toaleta
  const [toiletMode, setToiletMode] = useState(profile.toiletMode || 'diapers')
  const [exporting, setExporting] = useState(false)

  const save = () => {
    onUpdate(profile.id, {
      name: name.trim() || profile.name,
      months: (Number(years) || 0) * 12 + (Number(months) || 0),
      weight: Number(weight) || 0,
      avatar,
      sex,
      toiletMode,
      visibleTabs: { feed: feedVisible, diaper: diaperVisible },
    })
    toast(t('settings.saved'))
    onClose()
  }

  const handleExport = () => {
    if (!isPremium) { onUpgrade(); return }
    setPdfModal(true)
  }

  // Loader dla PDF modal - ładuje WSZYSTKIE dane dziecka na potrzeby raportu
  const loadPdfData = async () => ({
    feed: feedLogs,
    sleep: sleepLogs,
    temp: tempLogs,
    meds: medLogs,
    diaper: diaperLogs,
    growth: growthLogs,
    symptoms: symptomsLogs,
    cough: coughLogs,
    questions,
    doctorNotes,
  })

  const handleCsvExport = () => {
    // CSV export działa nawet dla free userów — to podstawowe prawo użytkownika
    // do własnych danych (RODO). Płatne jest tylko PDF z formatowaniem dla lekarza.
    try {
      exportAllToCsv(name || profile.name, {
        feed: feedLogs,
        sleep: sleepLogs,
        diaper: diaperLogs,
        temp: tempLogs,
        meds: medLogs,
        growth: growthLogs,
      })
      toast(t('settings.csvExport.success'))
    } catch (e) {
      console.error(e)
      toast(t('settings.csvExport.error'), 'error')
    }
  }

  // Pełny backup wszystkich dzieci + wszystkich kategorii — JSON format
  // (można w przyszłości użyć do przywrócenia danych na innym urządzeniu)
  const handleFullBackupJson = async () => {
    try {
      const result = await exportAllDataAsJson(uid)
      toast(t('settings.backup.success', { count: result.recordCount }))
    } catch (e) {
      console.error('[Backup JSON]', e)
      toast(t('settings.backup.error'), 'error')
    }
  }

  // Pełny backup jako CSV — wszystkie dzieci + kategorie, dla Excel
  const handleFullBackupCsv = async () => {
    try {
      const result = await exportAllDataAsCsv(uid)
      toast(t('settings.backup.success', { count: result.categoriesCount }))
    } catch (e) {
      console.error('[Backup CSV]', e)
      toast(t('settings.backup.error'), 'error')
    }
  }

  return (
    <div style={{ minHeight: '100%', background: '#F7F7F5' }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: '#3a3a36', padding: 4, minHeight: 36,
        }}>←</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a18' }}>
          {t('settings.title')}
        </div>
      </div>

      {/* Trial banner */}
      {isOnTrial && (
        <div style={{
          margin: '12px 16px 0', padding: '12px 14px',
          background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
          borderRadius: 12, color: '#fff',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
            ⏱ {t('settings.trial.title', { days: trialDaysLeft })}
          </div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            {t('settings.trial.desc')}
          </div>
          <button onClick={onUpgrade} style={{
            marginTop: 10, width: '100%', padding: '8px',
            background: '#fff', color: '#0F6E56',
            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>
            {t('settings.trial.cta')}
          </button>
        </div>
      )}

      {/* Child profile */}
      <div style={card}>
        <div style={cardHeader}>{t('settings.child.title')}</div>

        <div style={{ padding: '12px 14px' }}>
          {/* Avatar */}
          <div style={{ fontSize: 12, color: '#5a5a56', fontWeight: 500, marginBottom: 8 }}>
            {t('onb.setup.avatar')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)} style={{
                width: 44, height: 44, fontSize: 22, borderRadius: '50%', cursor: 'pointer',
                border: `2px solid ${avatar === a ? '#1D9E75' : 'transparent'}`,
                background: avatar === a ? '#E1F5EE' : '#f7f7f5',
              }}>{a}</button>
            ))}
          </div>

          {/* Fields */}
          <div className="form-group">
            <label className="form-label">{t('onb.setup.name')}</label>
            <input className="form-input" type="text" maxLength={40} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('onb.setup.age')}</label>
            <div className="form-row" style={{marginTop:0}}>
              <div className="form-group" style={{marginTop:0}}>
                <input
                  className="form-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="10"
                  value={years}
                  onChange={e => setYears(e.target.value)}
                />
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
                  {t('age.unit.years')}
                </div>
              </div>
              <div className="form-group" style={{marginTop:0}}>
                <input
                  className="form-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="11"
                  value={months}
                  onChange={e => setMonths(e.target.value)}
                />
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:4,textAlign:'center'}}>
                  {t('age.unit.months')}
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('onb.setup.weight')}</label>
            <input className="form-input" type="number" inputMode="decimal" step="0.1" min="1" max="50" value={weight} onChange={e => setWeight(e.target.value.replace(",","."))} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('settings.sex_label')}</label>
            <div style={{display:'flex',gap:8,marginTop:4}}>
              <button
                onClick={()=>setSex('M')}
                style={{
                  flex:1,padding:'10px',minHeight:44,
                  borderRadius:10,
                  border:sex==='M' ? '2px solid #185FA5' : '0.5px solid var(--border)',
                  background:sex==='M' ? '#E6F1FB' : '#fff',
                  fontSize:13,fontWeight:700,color:sex==='M'?'#0C447C':'var(--text-2)',
                  cursor:'pointer',
                }}
              >
                {t('settings.sex_boy')}
              </button>
              <button
                onClick={()=>setSex('F')}
                style={{
                  flex:1,padding:'10px',minHeight:44,
                  borderRadius:10,
                  border:sex==='F' ? '2px solid #C95A48' : '0.5px solid var(--border)',
                  background:sex==='F' ? '#FEE7DF' : '#fff',
                  fontSize:13,fontWeight:700,color:sex==='F'?'#7A1F0C':'var(--text-2)',
                  cursor:'pointer',
                }}
              >
                {t('settings.sex_girl')}
              </button>
            </div>
            <div style={{fontSize:10,color:'var(--text-3)',marginTop:4}}>
              {t('settings.sex_hint')}
            </div>
          </div>

          {/* TRYB PIELĘGNACJI — Pieluchy / Nocnik / Toaleta (Bug 5 fix) */}
          <div className="form-group" style={{marginTop:4}}>
            <label className="form-label">{t('settings.toilet_mode.label')}</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginTop:6}}>
              {[
                { id: 'diapers', label: t('settings.toilet_mode.diapers') },
                { id: 'potty',   label: t('settings.toilet_mode.potty') },
                { id: 'toilet',  label: t('settings.toilet_mode.toilet') },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setToiletMode(opt.id)}
                  style={{
                    padding:'10px 8px',minHeight:44,
                    borderRadius:10,
                    border: toiletMode === opt.id ? '2px solid #1D9E75' : '0.5px solid var(--border)',
                    background: toiletMode === opt.id ? '#E1F5EE' : '#fff',
                    color: toiletMode === opt.id ? '#085041' : 'var(--text-2)',
                    fontSize:12,fontWeight:700,cursor:'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:6,lineHeight:1.45}}>
              {t('settings.toilet_mode.hint')}
            </div>
          </div>

          {/* WIDOCZNE SEKCJE — user może ukryć Karmienia i Pieluchy */}
          <div className="form-group" style={{marginTop:4}}>
            <label className="form-label">{t('visibility.section_title')}</label>
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:2,marginBottom:10,lineHeight:1.5}}>
              {t('visibility.section_desc')}
            </div>

            {/* Toggle Karmienia */}
            <div
              onClick={() => setFeedVisible(v => !v)}
              style={{
                display:'flex',alignItems:'center',gap:10,
                padding:'12px 12px',marginBottom:8,
                background: feedVisible ? '#E1F5EE' : '#f7f7f5',
                border: feedVisible ? '1px solid #9FE1CB' : '0.5px solid var(--border)',
                borderRadius:10,cursor:'pointer',
                minHeight:56,
              }}
            >
              <span style={{fontSize:22,flexShrink:0}}>🍼</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color: feedVisible ? '#085041' : 'var(--text-2)'}}>
                  {t('visibility.feed.label')}
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                  {t('visibility.feed.hint')}
                </div>
              </div>
              <div style={{
                width:44,height:24,borderRadius:12,
                background: feedVisible ? '#1D9E75' : '#c0c0b8',
                position:'relative',transition:'background 0.2s',
                flexShrink:0,
              }}>
                <div style={{
                  position:'absolute',top:2,left: feedVisible ? 22 : 2,
                  width:20,height:20,borderRadius:'50%',background:'#fff',
                  transition:'left 0.2s',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                }}/>
              </div>
            </div>

            {/* Toggle Pieluchy */}
            <div
              onClick={() => setDiaperVisible(v => !v)}
              style={{
                display:'flex',alignItems:'center',gap:10,
                padding:'12px 12px',
                background: diaperVisible ? '#E1F5EE' : '#f7f7f5',
                border: diaperVisible ? '1px solid #9FE1CB' : '0.5px solid var(--border)',
                borderRadius:10,cursor:'pointer',
                minHeight:56,
              }}
            >
              <span style={{fontSize:22,flexShrink:0}}>👶</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color: diaperVisible ? '#085041' : 'var(--text-2)'}}>
                  {t('visibility.diaper.label')}
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                  {t('visibility.diaper.hint')}
                </div>
              </div>
              <div style={{
                width:44,height:24,borderRadius:12,
                background: diaperVisible ? '#1D9E75' : '#c0c0b8',
                position:'relative',transition:'background 0.2s',
                flexShrink:0,
              }}>
                <div style={{
                  position:'absolute',top:2,left: diaperVisible ? 22 : 2,
                  width:20,height:20,borderRadius:'50%',background:'#fff',
                  transition:'left 0.2s',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                }}/>
              </div>
            </div>
          </div>

          <button onClick={save} style={{
            width: '100%', marginTop: 8, padding: '12px',
            background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* Export PDF */}
      <div style={card}>
        <div style={cardHeader}>{t('settings.export.title')}</div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, color: '#5a5a56', marginBottom: 10, lineHeight: 1.45 }}>
            {t('settings.export.desc')}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              width: '100%', padding: '12px', minHeight: 44,
              background: isPremium ? '#185FA5' : '#E6F1FB',
              color: isPremium ? '#fff' : '#185FA5',
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              cursor: exporting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 8,
            }}
          >
            {!isPremium && '🔒 '}
            📄 {exporting ? t('settings.export.loading') : t('settings.export.cta')}
          </button>

          {/* CSV Export — dostępne zawsze (RODO: prawo do danych) */}
          <button
            onClick={handleCsvExport}
            style={{
              width: '100%', padding: '12px', minHeight: 44,
              background: '#F7F7F5',
              color: '#3a3a36',
              border: '0.5px solid rgba(0,0,0,0.12)',
              borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {t('settings.csvExport.title')}
          </button>
          <div style={{ fontSize: 10, color: '#9a9a94', marginTop: 6, lineHeight: 1.4 }}>
            {t('settings.csvExport.desc')}
          </div>
        </div>
      </div>

      {/* Full Backup — JSON dla backupu, CSV dla Excel (wszystkie dzieci + wszystko) */}
      <div style={card}>
        <div style={cardHeader}>{t('settings.backup.title')}</div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, color: '#5a5a56', marginBottom: 10, lineHeight: 1.45 }}>
            {t('settings.backup.desc')}
          </div>
          <button
            onClick={handleFullBackupJson}
            style={{
              width: '100%', padding: '12px', minHeight: 44,
              background: '#0F6E56',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 8,
            }}
          >
            {t('settings.backup.json_cta')}
          </button>
          <button
            onClick={handleFullBackupCsv}
            style={{
              width: '100%', padding: '12px', minHeight: 44,
              background: '#F7F7F5',
              color: '#3a3a36',
              border: '0.5px solid rgba(0,0,0,0.12)',
              borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {t('settings.backup.csv_cta')}
          </button>
        </div>
      </div>

      {/* Account */}
      <div style={card}>
        <div style={cardHeader}>{t('settings.account.title')}</div>
        <div style={{ padding: '12px 14px' }}>
          {user ? (
            <>
              <div style={{ fontSize: 13, color: '#3a3a36', marginBottom: 4 }}>
                {user.email || user.displayName || '—'}
              </div>
              <div style={{ fontSize: 11, color: '#9a9a94', marginBottom: 12 }}>
                {isPremium ? t('settings.account.premium') : t('settings.account.free')}
              </div>
              <button onClick={onLogout} style={dangerBtn}>
                {t('topbar.logout')}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#3a3a36', marginBottom: 8 }}>
                {t('settings.account.guest')}
              </div>
              <button onClick={onLogout} style={{
                width: '100%', padding: '12px',
                background: '#1D9E75', color: '#fff',
                border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
                {t('login.guest_upgrade')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Features overview */}
      <div style={card}>
        <button
          onClick={() => setShowFeatures(true)}
          style={{
            width: '100%',
            padding: '16px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            textAlign: 'left',
            minHeight: 56,
          }}
        >
          <div style={{
            width: 40, height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #FEF3EE, #FEE7DF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            ✨
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a18' }}>
              {t('features.open')}
            </div>
            <div style={{ fontSize: 12, color: '#7a7a74', marginTop: 2 }}>
              {t('features.subtitle')}
            </div>
          </div>
          <div style={{ color: '#9a9a94', fontSize: 20 }}>›</div>
        </button>
      </div>

      {/* Notifications — pokazuje OBA przyciski:
          - "Włącz powiadomienia" — gdy permission !== granted (próbuje ask)
          - "Wyślij testowe" — zawsze (TWA fix: nie polegamy na cached permission)

          User dostaje akcję, nie tylko komunikat błędu. Test najpierw próbuje
          wysłać; jeśli system odmówi mimo wszystko, dopiero wtedy mówi co poszło nie tak. */}
      <div className="card" style={{ margin: '12px 16px 0', padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a18', marginBottom: 8 }}>
          {t('settings.notifications.title')}
        </div>

        {notifPermission !== 'granted' && (
          /* "Włącz powiadomienia" — pokazujemy gdy nie ma jeszcze zgody */
          <button
            type="button"
            onClick={async () => {
              const result = await askNotifPermission()
              if (result === 'granted') {
                toast(t('settings.notifications.enabled'), 'success')
              } else if (result === 'denied') {
                toast(t('settings.notifications.denied'), 'error')
              }
              // Default ('default') = user nie odpowiedział — nie pokazujemy toasta
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#185FA5',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 40,
              marginBottom: 8,
            }}
          >
            {t('settings.notifications.enable_btn')}
          </button>
        )}

        {/* Test button — ZAWSZE widoczny. TWA może mieć stary cached permission,
            więc próbujemy wysłać niezależnie od tego co mówi Notification.permission. */}
        <button
          type="button"
          onClick={async () => {
            const ok = await testNotification()
            toast(
              ok ? t('settings.notifications.test_sent') : t('settings.notifications.test_blocked'),
              ok ? 'success' : 'error'
            )
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: notifPermission === 'granted' ? '#185FA5' : '#6a6a64',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 40,
          }}
        >
          {t('settings.notifications.test_btn')}
        </button>

        <div style={{ fontSize: 10, color: '#9a9a94', marginTop: 8, lineHeight: 1.4 }}>
          {t('settings.notifications.disclaimer')}
        </div>
      </div>

      {/* Legal — wymagane przez Play Console review.
          Linki otwierają się w przeglądarce systemowej; w TWA ten link wychodzi
          poza scope manifestu, więc otworzy domyślną przeglądarkę. */}
      <div className="card" style={{ margin: '12px 16px 0', padding: 0, overflow: 'hidden' }}>
        <a
          href={LEGAL_URLS.privacy}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', minHeight: 48,
            color: '#1a1a18', textDecoration: 'none',
            borderBottom: '0.5px solid var(--border-light, rgba(0,0,0,0.08))',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>{t('settings.legal.privacy')}</span>
          <span style={{ color: '#9a9a94', fontSize: 18 }}>↗</span>
        </a>
        <a
          href={LEGAL_URLS.deleteAccount}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', minHeight: 48,
            color: '#1a1a18', textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>{t('settings.legal.delete_account')}</span>
          <span style={{ color: '#9a9a94', fontSize: 18 }}>↗</span>
        </a>
      </div>

      <div style={{ padding: '16px', fontSize: 10, color: '#9a9a94', textAlign: 'center' }}>
        Spokojny Rodzic v{APP_VERSION} · SkuDev
      </div>

      {/* PDF Report modal — Premium only */}
      <PdfReportModal
        open={pdfModal}
        onClose={() => setPdfModal(false)}
        profile={{ ...profile, name, months: (Number(years) || 0) * 12 + (Number(months) || 0), weight: Number(weight), avatar, sex }}
        loadData={loadPdfData}
      />

      {/* Features Screen */}
      {showFeatures && <FeaturesScreen onClose={() => setShowFeatures(false)} />}
    </div>
  )
}

const card = {
  margin: '12px 16px 0',
  background: '#fff',
  borderRadius: 14,
  overflow: 'hidden',
}

const cardHeader = {
  padding: '12px 14px',
  fontSize: 11, fontWeight: 700, color: '#5a5a56',
  textTransform: 'uppercase', letterSpacing: 0.5,
  borderBottom: '0.5px solid rgba(0,0,0,0.06)',
}

const dangerBtn = {
  width: '100%', padding: '12px',
  background: '#FAECE7', color: '#712B13',
  border: 'none', borderRadius: 10,
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
