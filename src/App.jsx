import React, { useState, useEffect } from 'react'
import { useFirestore, migrateGuestDataToAccount, hasGuestData, clearGuestData, enableOffline } from './hooks/useFirestore'
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
import CoughTab from './components/CoughTab'
import SymptomsTab from './components/SymptomsTab'
import QuickDoseCard from './components/QuickDoseCard'
import ProfilesScreen from './components/ProfilesScreen'
import ChildStatusBar from './components/ChildStatusBar'
import ChildStatusCard from './components/ChildStatusCard'
import AutoHideBanner from './components/AutoHideBanner'
import PaywallScreen from './components/PaywallScreen'
import DoctorNotesTab from './components/DoctorNotesTab'
import OnboardingScreen from './components/OnboardingScreen'
import MedicalDisclaimerScreen, { needsDisclaimer } from './components/MedicalDisclaimerScreen'
import ToastContainer from './components/Toast'
import { toast } from './components/Toast'
import { captureError, addBreadcrumb } from './sentry'
import SleepIndicator from './components/SleepIndicator'
import LanguageSwitcher from './components/LanguageSwitcher'
import SettingsScreen from './components/SettingsScreen'
import CallDoctorCard from './components/CallDoctorCard'
import CallDoctorPrep from './components/CallDoctorPrep'
import GuestMigrationDialog from './components/GuestMigrationDialog'
import PlayStoreModal from './components/PlayStoreModal'
import PremiumOnboardingModal from './components/PremiumOnboardingModal'
import { useCrisisDetection } from './hooks/useCrisisDetection'

import { useLocale, t } from './i18n'

const DEFAULT_PROFILE = {
  id: 'default',
  name: 'Baby',  // placeholder; real name set in onboarding
  months: 4,
  weight: 6.5,
  avatar: '👶',
  avatarColor: '#E1F5EE',
  toiletMode: 'diapers',
  sex: 'M',  // 'M' | 'F' — required for WHO percentiles
  // Widoczność sekcji w bottom nav. Ukryte sekcje nie są usunięte —
  // dane zostają w Firestore, można włączyć z powrotem w Settings.
  // Defaulty ustawiane w onboardingu na podstawie wieku i toiletMode.
  visibleTabs: { feed: true, diaper: true },
  // Flaga żeby one-time banner ">3 lata" pokazać TYLKO raz.
  // null = nigdy nie pokazany, ISO date = pokazany tego dnia (user zobaczył).
  autoHideSuggestedAt: null,
}

/**
 * Liczy defaulty widoczności Karmień/Pieluch na podstawie wieku dziecka
 * i trybu toalety. Wołane w onboardingu przy tworzeniu profilu.
 */
function defaultVisibleTabs({ months, toiletMode }) {
  return {
    // Karmienia: ON dla <3 lat, OFF dla 3+ lat
    feed: months < 36,
    // Pieluchy: ON jeśli wciąż używa pieluch/nocnika, OFF jeśli tylko toaleta
    diaper: toiletMode !== 'toilet',
  }
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
  { id:'symptoms',   emoji:'🤒', labelKey:'nav.symptoms' },
  { id:'cough',      emoji:'💨', labelKey:'nav.cough' },
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

  // Bug 3 fix: Zamiast AUTOMATYCZNEJ migracji (która nadpisywała dane zalogowanego konta
  // danymi gościa!), teraz pokazujemy DIALOG gdy user zaloguje się i ma dane gościa.
  // User decyduje: "Dodaj do mojego konta" vs "Zostaw tam, nie chcę migracji".
  const [guestMigrationDialog, setGuestMigrationDialog] = useState(null) // null | 'show' | 'migrating'
  useEffect(() => {
    if (uid && hasGuestData()) {
      setGuestMigrationDialog('show')
    }
  }, [uid])

  const doGuestMigration = async () => {
    setGuestMigrationDialog('migrating')
    try {
      // Strategia 'preserve-existing': jeśli Firestore już ma dane dla klucza,
      // NIE nadpisuj. Chroni przed utratą danych z poprzednich sesji.
      const result = await migrateGuestDataToAccount(uid, { strategy: 'preserve-existing' })
      console.log('[Guest migration] Result:', result)
      // Wyczyść guest dane tylko jeśli coś się udało zmigrować
      if (result.migrated.length > 0) {
        clearGuestData()
      }
    } catch (e) {
      console.error('[Guest migration] Error:', e)
    } finally {
      setGuestMigrationDialog(null)
    }
  }

  const skipGuestMigration = () => {
    // User wybrał: nie migruj. Dane guesta zostają w localStorage (backup),
    // ale dialog już nie wyskoczy (flaga w localStorage).
    try { localStorage.setItem('babylog_migration_skipped_' + uid, '1') } catch {}
    setGuestMigrationDialog(null)
  }

  // Sprawdź przy starcie czy user już skipował migrację wcześniej
  useEffect(() => {
    if (uid) {
      try {
        if (localStorage.getItem('babylog_migration_skipped_' + uid) === '1') {
          setGuestMigrationDialog(null)
        }
      } catch {}
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
  // Disclaimer medyczny — localStorage (NIE Firestore, ma być per-urządzenie)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => !needsDisclaimer())

  const rawActive = profiles.find(p => p.id === activeId) || profiles[0] || DEFAULT_PROFILE

  // Defensywna normalizacja: istniejący profil może nie mieć visibleTabs (sprzed v2.4)
  // Ustawiamy defaulty na podstawie wieku — ale tylko do użycia w RUNTIME,
  // nie zapisujemy w storage (żeby nie nadpisać jeśli user wybierze OFF celowo).
  // Dopiero pierwszy zapis w Settings albo click w banerze utrwali flagę.
  const active = {
    ...rawActive,
    visibleTabs: rawActive.visibleTabs || defaultVisibleTabs({
      months: rawActive.months ?? 4,
      toiletMode: rawActive.toiletMode ?? 'diapers',
    }),
  }
  const [sleepTimerTs] = useFirestore(uid, `sleep_timer_${active.id}`, null)

  // ── Freemium + RevenueCat ─────────────────────────────────────────────────
  const { isPremium, isOnTrial, trialDaysLeft, purchased, activate, deactivate } = usePremium(uid)

  // Premium onboarding — pokazuje modal raz po pierwszym odblokowaniu Premium
  const [showPremiumOnboarding, setShowPremiumOnboarding] = useState(false)
  const [prevIsPremium, setPrevIsPremium] = useState(isPremium)
  useEffect(() => {
    // Detekcja: false → true przejście (zakup właśnie przeszedł)
    if (isPremium && !prevIsPremium && uid) {
      const flagKey = 'babylog_premium_onboarding_shown_' + uid
      try {
        if (localStorage.getItem(flagKey) !== '1') {
          setShowPremiumOnboarding(true)
          localStorage.setItem(flagKey, '1')
        }
      } catch {}
    }
    setPrevIsPremium(isPremium)
  }, [isPremium, prevIsPremium, uid])

  const closePremiumOnboarding = () => setShowPremiumOnboarding(false)
  const navigateToPdfReport = () => {
    setShowPremiumOnboarding(false)
    setShowSettings(true)  // Settings ma sekcję PDF Report
  }

  const openPaywall = () => setShowPaywall(true)
  const closePaywall = () => setShowPaywall(false)

  // RevenueCat — weryfikacja subskrypcji
  const { checking: rcChecking, checkPremium, activateWithToken } = useRevenueCat(uid, activate)

  // Bug 1 fix: Modal zachęcający do instalacji apki (zamiast brzydkiego alert())
  const [showPlayStoreModal, setShowPlayStoreModal] = useState(false)

  const handleActivate = async (planId) => {
    addBreadcrumb('purchase', 'handle-activate-clicked', { planId })
    try {
      // 1. TWA z Play Billing przez Digital Goods API (standardowe podejście PWABuilder)
      if ('getDigitalGoodsService' in window && window.PaymentRequest) {
        try {
          const service = await window.getDigitalGoodsService('https://play.google.com/billing')
          if (service) {
            const paymentMethod = [{
              supportedMethods: 'https://play.google.com/billing',
              data: { sku: planId },
            }]
            const paymentDetails = {
              total: {
                label: 'Spokojny Rodzic Premium',
                amount: { currency: 'PLN', value: '0' },
              },
            }
            const request = new PaymentRequest(paymentMethod, paymentDetails)
            const response = await request.show()
            const purchaseToken = response.details?.purchaseToken
            if (purchaseToken) {
              await activateWithToken(planId, purchaseToken)
              await response.complete('success')
              setShowPaywall(false)
              return
            }
            await response.complete('fail')
          }
        } catch (dgaErr) {
          console.warn('[paywall] DGA flow failed, falling through:', dgaErr)
          captureError(dgaErr, { context: 'paywall-dga', planId })
          // Nie zwracaj - pójdź do fallback
        }
      }

      // 2. Custom Android bridge (stary mechanizm, jeśli kiedyś będzie)
      if (window.Android?.launchBilling) {
        window.Android.launchBilling(planId)
        return
      }

      // 3. Web / niewspierana platforma - sprawdź czy user ma zakup z innego urządzenia
      const active = await checkPremium()
      if (active) {
        setShowPaywall(false)
        toast(t('paywall.activated'))
        return
      }

      // 4. Ostateczny fallback - pokaż modal z linkiem do Play Store
      setShowPlayStoreModal(true)
    } catch (e) {
      console.error('[handleActivate]', e)
      captureError(e, { context: 'paywall-activate', planId })
      // User widzi feedback ze coś poszło nie tak (zamiast cichej śmierci)
      toast(t('paywall.error'), 'error')
    }
  }

  const openPlayStore = () => {
    // Link do sklepu Google Play — wypełnia się po publikacji na Production
    // Tymczasowo link otwiera stronę apki w Play Console (dla Closed Testing)
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=pl.skudev.spokojnyrodzic'
    window.open(playStoreUrl, '_blank')
    setShowPlayStoreModal(false)
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

  // Jeśli user jest na ukrytym tabie (np. Karmienia), przeskocz na pierwszy widoczny.
  // Scenariusz: user jest na Feed, idzie do Settings, wyłącza Karmienia → tab
  // znika z bottom nav, ale content dalej Feed. Trzeba go przenieść.
  useEffect(() => {
    if (tab === 'feed'   && active.visibleTabs?.feed   === false) setTab('sleep')
    if (tab === 'diaper' && active.visibleTabs?.diaper === false) setTab('sleep')
  }, [active.visibleTabs, tab])

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
    sex: active.sex || null,
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
      case 'cough':      return <CoughTab      {...sharedProps} />
      case 'symptoms':   return <SymptomsTab   {...sharedProps} />
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

  // ── Auth loading ────────────────────────────────────────────────────────
  if (authLoading) {
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

  // ── Medical Disclaimer (MUSI być zaakceptowany przed czymkolwiek innym) ──
  if (!disclaimerAccepted) {
    return <MedicalDisclaimerScreen onAccept={() => setDisclaimerAccepted(true)} />
  }

  // ── Onboarding ────────────────────────────────────────────────────────────
  if (!onboardingDone) {
    return (
      <div className="app">
        <OnboardingScreen onComplete={(profileData) => {
          if (profileData && profileData.name !== 'Moje dziecko') {
            // Defaultne widoczności sekcji zależne od wieku + potty mode
            const defaults = defaultVisibleTabs({
              months: profileData.months ?? 4,
              toiletMode: profileData.toiletMode ?? 'diapers',
            })
            const updated = profiles.map(p =>
              p.id === active.id ? { ...p, ...profileData, visibleTabs: defaults } : p
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
      <div className="app" style={{ position: 'relative' }}>
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
          {/* PL/EN language toggle. W EN niektóre polskie built-in content
              (szczepienia PSO, nazwy leków, dieta BLW) są ukryte —
              user dodaje własne po angielsku. */}
          <LanguageSwitcher />
          {/* Premium / Trial / Free — zawsze klikalne, prowadzi do paywalla */}
          {purchased ? (
            // Kupione Premium — badge informacyjny, klik prowadzi do Settings żeby zobaczyć status
            <button
              onClick={() => setShowSettings(true)}
              style={{
                background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
                color: '#fff', borderRadius: 20, border: 'none',
                padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
              aria-label={t('topbar.premium')}
            >
              ★ {t('topbar.premium')}
            </button>
          ) : isOnTrial ? (
            // Trial aktywny — pokaż ile dni i klik → paywall żeby user mógł kupić
            <button
              onClick={openPaywall}
              style={{
                background: 'linear-gradient(135deg,#F59E0B,#FB923C)',
                color: '#fff', borderRadius: 20, border: 'none',
                padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
              aria-label={t('topbar.trial_cta')}
            >
              ⏳ {t('topbar.trial_days', { days: trialDaysLeft })}
            </button>
          ) : (
            // Free — klik → paywall
            <button
              onClick={openPaywall}
              style={{
                background: '#E1F5EE', color: '#0F6E56',
                border: '0.5px solid #9FE1CB', borderRadius: 20,
                padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
              aria-label={t('paywall.cta')}
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

        {/* AUTO-HIDE BANNER — one-time prompt po 3 latach dziecka */}
        {!showProfiles && !showMore && (
          <AutoHideBanner profile={active} onUpdate={updateProfile} />
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
      <nav className="bottom-nav" role="tablist" aria-label="Główna nawigacja">
        {NAV_TABS
          .filter(n => {
            // Ukryj Karmienia/Pieluchy jeśli user je wyłączył w Settings
            if (n.id === 'feed'   && active.visibleTabs?.feed   === false) return false
            if (n.id === 'diaper' && active.visibleTabs?.diaper === false) return false
            return true
          })
          .map(n => {
          const count = n.id !== 'more'
            ? visibleSection(n.id).length
            : MORE_TABS.reduce((s,tab) => s + visibleSection(tab.id).length, 0)
          const isActive = navActive(n.id)
          const tabLabel = t(n.labelKey)
          return (
            <button
              key={n.id}
              className={`nav-item ${isActive?'active':''}`}
              onClick={()=>selectTab(n.id)}
              style={{position:'relative'}}
              role="tab"
              aria-selected={isActive}
              aria-label={count > 0 ? `${tabLabel}, ${count} powiadomień` : tabLabel}
            >
              <span aria-hidden="true">{n.icon}</span>
              {tabLabel}
              {count > 0 && !isActive && (
                <span aria-hidden="true" style={{
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
      <GuestMigrationDialog
        open={guestMigrationDialog !== null}
        status={guestMigrationDialog}
        onConfirm={doGuestMigration}
        onSkip={skipGuestMigration}
      />
      <PlayStoreModal
        open={showPlayStoreModal}
        onClose={() => setShowPlayStoreModal(false)}
        onOpenPlayStore={openPlayStore}
      />
      <PremiumOnboardingModal
        open={showPremiumOnboarding}
        onClose={closePremiumOnboarding}
        onNavigateToReport={navigateToPdfReport}
      />
    </div>
  )
}
