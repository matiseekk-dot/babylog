import React, { useState, useEffect } from 'react'
import { useFirestore, migrateAllLocalData, enableOffline } from './hooks/useFirestore'
import { useAuth } from './hooks/useAuth'
import LoginScreen from './components/LoginScreen'
import MedicalConsentScreen from './components/MedicalConsentScreen'
import { useRevenueCat } from './hooks/useRevenueCat'
import { useChildStatus } from './hooks/useChildStatus'
import { usePremium } from './hooks/usePremium'
import FeedTab from './components/FeedTab'
import EmptyStateHero from './components/EmptyStateHero'
import TeethingTab from './components/TeethingTab'
import SleepTab from './components/SleepTab'
import DiaperTab from './components/DiaperTab'
import MilestonesTab from './components/MilestonesTab'
import MedsTab from './components/MedsTab'
import GrowthTab from './components/GrowthTab'
import TempTab from './components/TempTab'
import VaccinationsTab from './components/VaccinationsTab'
import DietTab from './components/DietTab'
import QuickDoseCard from './components/QuickDoseCard'
import ProfilesScreen from './components/ProfilesScreen'
import ChildStatusBar from './components/ChildStatusBar'
import ChildStatusCard from './components/ChildStatusCard'
import PaywallScreen from './components/PaywallScreen'
import DoctorNotesTab from './components/DoctorNotesTab'
import OnboardingScreen from './components/OnboardingScreen'
import ToastContainer from './components/Toast'
import SleepIndicator from './components/SleepIndicator'
import LanguageSwitcher from './components/LanguageSwitcher'
import SettingsScreen from './components/SettingsScreen'
import CallDoctorCard from './components/CallDoctorCard'
import CallDoctorPrep from './components/CallDoctorPrep'
import { useCrisisDetection } from './hooks/useCrisisDetection'

// BUG-003 FIX: Per-locale emergency phones
function getEmergencyPhone() {
  try {
    const lang = (localStorage.getItem('babylog_locale') || navigator.language || 'pl').toLowerCase()
    if (lang.startsWith('pl')) return '800190590'     // NFZ Poland 24/7
    return '112'  // EU-wide emergency
  } catch { return '112' }
}
import { useLocale, t } from './i18n'

const DEFAULT_PROFILE = {
  id: 'default',
  name: 'Baby',  // placeholder; real name set in onboarding
  months: 4,
  weight: 6.5,
  avatar: '👶',
  avatarColor: '#E1F5EE',
  toiletMode: 'diapers',
}

const NAV_TABS = [
  { id:'feed', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a4 4 0 0 0 8 0V3"/><path d="M12 6v6"/><ellipse cx="12" cy="18" rx="5" ry="3"/>
    </svg>
  ), labelKey:'nav.feed' },
  { id:'sleep', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ), labelKey:'nav.sleep' },
  { id:'diaper', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12h8M12 8v8"/>
    </svg>
  ), labelKey:'nav.diaper' },
  { id:'more', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  ), labelKey:'nav.more' },
]

const MORE_TABS = [
  { id:'milestones', emoji:'⭐', labelKey:'nav.milestones' },
  { id:'teething',   emoji:'🦷', labelKey:'nav.teething' },
  { id:'growth',     emoji:'📏', labelKey:'nav.growth' },
  { id:'temp',       emoji:'🌡️', labelKey:'nav.temp' },
  { id:'meds',       emoji:'💊', labelKey:'nav.meds' },
  { id:'vacc',       emoji:'💉', labelKey:'nav.vacc' },
  { id:'diet',       emoji:'🥕', labelKey:'nav.diet' },
  { id:'doctor',     emoji:'🩺', labelKey:'nav.doctor' },
]

// Status prosty dla free userów — bez szczegółów
const FREE_STATUS = () => ({
  status: 'ok',
  title: t('status.free.title'),
  message: t('status.free.message'),
})

const EMPTY_STATUS = () => ({
  status: 'info',
  title: t('status.empty.title'),
  message: t('status.empty.message'),
})

export default function App() {
  const { user, loading: authLoading, login, logout } = useAuth()

  // Medical consent — must be accepted ONCE before first use
  const [consentAccepted, setConsentAccepted] = useState(() => {
    try { return localStorage.getItem('babylog_medical_consent_v1') === '1' }
    catch { return false }
  })
  const [emptyHeroDismissed, setEmptyHeroDismissed] = useState(() => {
    try { return localStorage.getItem('babylog_empty_hero_dismissed') === '1' }
    catch { return false }
  })
  const dismissEmptyHero = () => {
    try { localStorage.setItem('babylog_empty_hero_dismissed', '1') } catch {}
    setEmptyHeroDismissed(true)
  }
  const acceptConsent = () => {
    try { localStorage.setItem('babylog_medical_consent_v1', '1') } catch {}
    setConsentAccepted(true)
  }
  const [guestMode, setGuestMode] = useState(() => {
    try { return localStorage.getItem('babylog_guest') === '1' } catch { return false }
  })
  const uid = user?.uid ?? null
  const { locale } = useLocale()  // re-render on language change

  // Włącz offline persistence
  useEffect(() => { enableOffline() }, [])

  // Migruj localStorage → Firestore przy pierwszym logowaniu (BUG-002 + BUG-010)
  const [migrating, setMigrating] = useState(false)
  useEffect(() => {
    if (uid) {
      setMigrating(true)
      migrateAllLocalData(uid)
        .catch(() => {})
        .finally(() => setMigrating(false))
    }
  }, [uid])

  const [profiles, setProfiles] = useFirestore(uid, 'profiles', [DEFAULT_PROFILE])
  const [activeId, setActiveId] = useFirestore(uid, 'activeProfile', 'default')
  const [tab, setTab] = useState('feed')
  const [showProfiles, setShowProfiles] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPrep, setShowPrep] = useState(false)
  const [onboardingDone, setOnboardingDone] = useFirestore(uid, 'onboarding_done', false)

  const active = profiles.find(p => p.id === activeId) || profiles[0] || DEFAULT_PROFILE
  const [sleepTimerTs] = useFirestore(uid, `sleep_timer_${active.id}`, null)

  // ── Freemium + RevenueCat ─────────────────────────────────────────────────
  const { isPremium, isOnTrial, trialDaysLeft, activate, deactivate } = usePremium(uid)

  const openPaywall = () => setShowPaywall(true)
  const closePaywall = () => setShowPaywall(false)

  // RevenueCat — weryfikacja subskrypcji
  const { checking: rcChecking, checkPremium, activateWithToken } = useRevenueCat(uid, activate)

  const handleActivate = async (planId) => {
    // Jeśli jesteśmy w TWA (Android) — Google Play Billing
    // window.RevenueCat dostępny po instalacji natywnego SDK
    if (window.Android?.launchBilling) {
      window.Android.launchBilling(planId)
      return
    }
    // Web fallback — sprawdź czy zakup już istnieje w RC
    const active = await checkPremium()
    if (active) {
      setShowPaywall(false)
    } else {
      // Pokaż instrukcję — zakup możliwy tylko przez Google Play
      alert(t('paywall.web_only'))
    }
  }

  // ── Decision layer (zawsze liczymy, ale pokazujemy tylko premium) ──────────
  const { globalStatus, topStatus, messages, sectionMessages, refresh } = useChildStatus(
    active.id, active.months, active.weight
  )

  // Crisis detection — reads tempLogs from Firestore (nie localStorage)
  const [tempLogsForCrisis] = useFirestore(uid, `temp_${active.id}`, [])
  const { crisis, dismiss: dismissCrisis } = useCrisisDetection(tempLogsForCrisis, active.months)

  // Dla free — pusty zestaw alertów i uproszczony status
  // Check if user has any data today
  const hasDataToday = (() => {
    const today = new Date().toISOString().slice(0,10)
    const keys = ['feed_','sleep_','diaper_','temp_']
    try {
      return keys.some(k => {
        const v = localStorage.getItem('babylog_' + k + active.id)
        if (!v) return false
        const arr = JSON.parse(v)
        return Array.isArray(arr) && arr.some(i => i.date === today)
      })
    } catch { return false }
  })()

  // Check if user has ANY data ever (for empty state hero)
  const hasAnyData = (() => {
    const keys = ['feed_','sleep_','diaper_','temp_','meds_','growth_']
    try {
      return keys.some(k => {
        const v = localStorage.getItem('babylog_' + k + active.id)
        if (!v) return false
        const arr = JSON.parse(v)
        return Array.isArray(arr) && arr.length > 0
      })
    } catch { return false }
  })()

  const visibleStatus    = isPremium ? globalStatus    : (hasDataToday ? FREE_STATUS() : EMPTY_STATUS())
  const visibleTopStatus = isPremium ? topStatus       : 'ok'
  const visibleMessages  = isPremium ? messages        : []
  const visibleSection   = (section) => isPremium ? sectionMessages(section) : []

  const navigate = (targetTab) => {
    if (!targetTab) return
    if (targetTab === 'settings') { setShowSettings(true); return }
    if (MORE_TABS.some(t => t.id === targetTab)) {
      setTab(targetTab); setShowMore(false); setShowProfiles(false)
    } else {
      selectTab(targetTab)
    }
  }

  const addProfile    = (p) => { setProfiles([...profiles, p]); setActiveId(p.id) }
  const updateProfile = (id, data) => setProfiles(profiles.map(p => p.id === id ? { ...p, ...data } : p))
  const deleteProfile = (id) => {
    const next = profiles.filter(p => p.id !== id)
    setProfiles(next.length ? next : [DEFAULT_PROFILE])
    if (activeId === id) setActiveId((next[0] || DEFAULT_PROFILE).id)
  }

  const selectTab     = (id) => { if (id==='more'){setShowMore(true);return}; setTab(id); setShowMore(false); setShowProfiles(false) }
  const selectMoreTab = (id) => { setTab(id); setShowMore(false) }
  const navActive     = (id) => id === 'more' ? MORE_TABS.some(t => t.id === tab) : tab === id

  const sharedProps = {
    uid,
    babyId: active.id,
    ageMonths: active.months,
    weightKg: active.weight,
    toiletMode: active.toiletMode || 'diapers',
    onDataChange: refresh,
    isPremium,
    onUpgrade: openPaywall,
  }

  const renderTab = () => {
    switch(tab) {
      case 'feed':       return (
        <>
          {!hasAnyData && !emptyHeroDismissed && (
            <EmptyStateHero onNavigate={navigate} onDismiss={dismissEmptyHero} />
          )}
          <QuickDoseCard
            weightKg={active.weight}
            ageMonths={active.months}
            onNavigateToMeds={() => navigate('meds')}
          />
          <FeedTab {...sharedProps} sectionAlerts={visibleSection('feed')} onNavigate={navigate} />
        </>
      )
      case 'sleep':      return <SleepTab      {...sharedProps} sectionAlerts={visibleSection('sleep')}  onNavigate={navigate} />
      case 'diaper':     return <DiaperTab     {...sharedProps} sectionAlerts={visibleSection('diaper')} onNavigate={navigate} />
      case 'milestones': return <MilestonesTab {...sharedProps} />
      case 'teething':   return <TeethingTab {...sharedProps} />
      case 'growth':     return <GrowthTab     {...sharedProps} />
      case 'temp':       return <TempTab       {...sharedProps} sectionAlerts={visibleSection('temp')}   onNavigate={navigate} />
      case 'meds':       return <MedsTab       {...sharedProps} sectionAlerts={visibleSection('meds')}   onNavigate={navigate} />
      case 'vacc':       return <VaccinationsTab {...sharedProps} />
      case 'diet':       return <DietTab       {...sharedProps} />
      case 'doctor':     return <DoctorNotesTab {...sharedProps} />
      default:           return <FeedTab       {...sharedProps} sectionAlerts={visibleSection('feed')}   onNavigate={navigate} />
    }
  }

  const currentMoreTab = MORE_TABS.find(t => t.id === tab)

  // ── Medical consent gate (shown once before first use) ───────────────────
  if (!consentAccepted) {
    return <MedicalConsentScreen onAccept={acceptConsent} />
  }

  // ── Auth loading / migration ─────────────────────────────────────────────
  if (authLoading || migrating) {
    return (
      <div className="app" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:'var(--text-3)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🍼</div>
          <div style={{ fontSize:14 }}>{t('app.loading')}</div>
        </div>
      </div>
    )
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!user && !guestMode) {
    return (
      <div className="app">
        <LoginScreen
          onLogin={login}
          onSkip={() => {
            try { localStorage.setItem('babylog_guest', '1') } catch {}
            setGuestMode(true)
          }}
          loading={authLoading}
        />
      </div>
    )
  }

  // ── Onboarding ────────────────────────────────────────────────────────────
  if (!onboardingDone) {
    return (
      <div className="app">
        <OnboardingScreen onComplete={(profileData) => {
          if (profileData && profileData.name !== 'Moje dziecko') {
            // Update the default profile with child's info
            const updated = profiles.map(p =>
              p.id === active.id ? { ...p, ...profileData } : p
            )
            setProfiles(updated)
          }
          setOnboardingDone(true)
        }} />
      </div>
    )
  }

  // ── Call Doctor Prep overlay ─────────────────────────────────────────────
  if (showPrep) {
    return (
      <div className="app" style={{ overflowY: 'auto' }}>
        <CallDoctorPrep
          profile={active}
          uid={uid}
          onClose={() => setShowPrep(false)}
          onCall={() => { window.location.href = 'tel:' + getEmergencyPhone() }}
        />
        <ToastContainer />
      </div>
    )
  }

  // ── Settings overlay ─────────────────────────────────────────────────────
  if (showSettings) {
    return (
      <div className="app" style={{ overflowY: 'auto' }}>
        <SettingsScreen
          profile={active}
          uid={uid}
          onUpdate={updateProfile}
          onDelete={deleteProfile}
          isPremium={isPremium}
          isOnTrial={isOnTrial}
          trialDaysLeft={trialDaysLeft}
          onUpgrade={() => { setShowSettings(false); openPaywall() }}
          user={user}
          onLogout={user ? logout : () => {
            try { localStorage.removeItem('babylog_guest') } catch {}
            setGuestMode(false)
            setShowSettings(false)
          }}
          onClose={() => setShowSettings(false)}
        />
        <ToastContainer />
      </div>
    )
  }

  // ── Paywall overlay ───────────────────────────────────────────────────────
  if (showPaywall) {
    return (
      <div className="app" style={{ position: 'relative', overflowY: 'auto' }}>
        <PaywallScreen onActivate={handleActivate} onClose={closePaywall} checking={rcChecking} />
      </div>
    )
  }

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">🍼 {t('app.title')}</div>
          <div className="topbar-sub">
            {showProfiles ? t('topbar.profiles') : showMore ? t('topbar.more') : currentMoreTab ? t(currentMoreTab.labelKey) : t(NAV_TABS.find(x=>x.id===tab)?.labelKey || 'nav.feed')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageSwitcher />
          {/* Premium badge / upgrade button */}
          {isPremium ? (
            <span style={{
              background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
              color: '#fff', borderRadius: 20,
              padding: '4px 10px', fontSize: 11, fontWeight: 700,
            }}>
              ★ {t('topbar.premium')}
            </span>
          ) : (
            <button
              onClick={openPaywall}
              style={{
                background: '#E1F5EE', color: '#0F6E56',
                border: '0.5px solid #9FE1CB', borderRadius: 20,
                padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              🔒 {t('topbar.free')}
            </button>
          )}
          {/* Sleep indicator */}
          <SleepIndicator startTs={sleepTimerTs} onPress={() => selectTab('sleep')} />
          {/* Settings (replaces logout — logout moved to settings screen) */}
          <button onClick={() => setShowSettings(true)} title={t('topbar.settings')} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'var(--text-3)', fontSize:20,
            padding:'4px 6px', minHeight:36, borderRadius:8,
            display:'flex', alignItems:'center', justifyContent:'center',
          }} aria-label={t('topbar.settings')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          {/* Baby chip */}
          <button className="baby-chip" onClick={() => { setShowProfiles(s=>!s); setShowMore(false) }}>
            <div className="baby-chip-avatar" style={{background:active.avatarColor,color:'var(--green-dark)',fontSize:13}}>
              {active.avatar}
            </div>
            {active.name === 'Moje dziecko' ? t('default.child_name') : active.name}
          </button>
        </div>
      </div>

      {/* STATUS BAR — tylko premium */}
      {!showProfiles && isPremium && (
        <ChildStatusBar
          globalStatus={visibleStatus}
          topStatus={visibleTopStatus}
          allMessages={visibleMessages}
          onNavigate={navigate}
        />
      )}

      {/* CONTENT */}
      <div className="content">

        {/* CRISIS CARD — killer feature, highest priority */}
        {crisis && !showProfiles && !showMore && (
          <CallDoctorCard
            severity={crisis.severity}
            reason={crisis.reason}
            onDismiss={dismissCrisis}
            onNavigate={navigate}
            onPrep={() => setShowPrep(true)}
          />
        )}

        {/* STATUS CARD */}
        {!showProfiles && !showMore && (
          <ChildStatusCard
            globalStatus={visibleStatus}
            topStatus={visibleTopStatus}
            messages={visibleMessages}
            onNavigate={isPremium ? navigate : openPaywall}
            isPremium={isPremium}
            onUpgrade={openPaywall}
          />
        )}

        {showProfiles ? (
          <ProfilesScreen
            profiles={profiles}
            activeId={activeId}
            onSelect={(id) => { setActiveId(id); setShowProfiles(false) }}
            onAdd={addProfile}
            onUpdate={updateProfile}
            onDelete={deleteProfile}
          />
        ) : showMore ? (
          <div style={{paddingBottom:8}}>
            <div className="section-header">
              <div className="section-title">{t('nav.all_modules')}</div>
              <div className="section-desc">{t('nav.select_section')}</div>
            </div>
            <div style={{padding:'8px 16px 0',display:'flex',flexDirection:'column',gap:6}}>
              {MORE_TABS.map(tab => {
                const count = visibleSection(tab.id).length
                return (
                  <button key={tab.id} onClick={()=>selectMoreTab(tab.id)} style={{
                    display:'flex',alignItems:'center',gap:14,padding:'14px 16px',
                    background:'var(--surface)',border:'0.5px solid var(--border)',
                    borderRadius:14,fontSize:15,fontWeight:500,color:'var(--text)',
                    textAlign:'left',minHeight:56,cursor:'pointer'
                  }}>
                    <span style={{fontSize:22}}>{tab.emoji}</span>
                    {t(tab.labelKey)}
                    {count > 0 && (
                      <span style={{marginLeft:6,background:'#D85A30',color:'#fff',fontSize:10,fontWeight:700,borderRadius:20,padding:'1px 6px'}}>{count}</span>
                    )}
                    <span style={{marginLeft:'auto',color:'var(--text-3)',fontSize:18}}>›</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : renderTab()}
      </div>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {NAV_TABS.map(n => {
          const count = n.id !== 'more'
            ? visibleSection(n.id).length
            : MORE_TABS.reduce((s,tab) => s + visibleSection(tab.id).length, 0)
          return (
            <button key={n.id} className={`nav-item ${navActive(n.id)?'active':''}`} onClick={()=>selectTab(n.id)} style={{position:'relative'}}>
              {n.icon}
              {t(n.labelKey)}
              {count > 0 && !navActive(n.id) && (
                <span style={{
                  position:'absolute',top:6,right:'calc(50% - 18px)',
                  background:'#D85A30',color:'#fff',fontSize:9,fontWeight:700,
                  borderRadius:20,padding:'1px 4px',lineHeight:1.4,
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </nav>
      <ToastContainer />
    </div>
  )
}
