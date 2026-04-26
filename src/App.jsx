import React, { useState, useEffect, useRef } from 'react'
import { useFirestore, migrateGuestDataToAccount, hasGuestData, clearGuestData, enableOffline } from './hooks/useFirestore'
import { useAuth } from './hooks/useAuth'
import LoginScreen from './components/LoginScreen'
import MedicalConsentScreen, { needsConsent } from './components/MedicalConsentScreen'
import { useRevenueCat } from './hooks/useRevenueCat'
import { useChildStatus } from './hooks/useChildStatus'
import { usePremium } from './hooks/usePremium'
import FeedTab from './components/FeedTab'
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
import TodayTab from './components/TodayTab'
import DailyTab from './components/DailyTab'
import HealthTab from './components/HealthTab'
import QuickAddFab from './components/QuickAddFab'
// v2.10.2: lucide-react ikony zamiast emoji w nawigacji.
// Wybór ikon: semantic match (Pill→leki, Stethoscope→doktor, Carrot→dieta).
// Sparkles użyte dla teething bo "Tooth" nie istnieje w lucide library.
// Ikony są zoptymalizowane (~12kB tree-shaken), kolorowalne, vector — wyglądają
// identycznie na każdej platformie (vs emoji które różnią się iOS/Android).
import {
  Star, Sparkles, Ruler, Wind, Syringe, Carrot, Stethoscope,
  Milk, Moon, Baby, Thermometer, Pill, HeartPulse,
} from 'lucide-react'
import ProfilesScreen from './components/ProfilesScreen'
import ChildStatusBar from './components/ChildStatusBar'
import ChildStatusCard from './components/ChildStatusCard'
import AutoHideBanner from './components/AutoHideBanner'
import OnboardingTipsBanner from './components/OnboardingTipsBanner'
import PaywallScreen from './components/PaywallScreen'
import DoctorNotesTab from './components/DoctorNotesTab'
import OnboardingScreen from './components/OnboardingScreen'
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
import { useServiceWorker } from './hooks/useServiceWorker'

import { useLocale, t } from './i18n'
import { todayDate, nowTime, genId } from './utils/helpers'

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

// v2.9.3: 4 podstawowe taby + More.
//   today  — dashboard (Status Card, crisis, timeline dnia)
//   feed   — Karmienia + Pieluchy jako wewnętrzne segmenty
//   sleep  — sen
//   health — Temperatura + Leki + Objawy jako wewnętrzne segmenty (tryb chory)
//   more   — reszta sekcji (growth, vaccinations, milestones, teething, cough,
//            diet, doctor)
const NAV_TABS = [
  { id:'today', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ), labelKey:'nav.today' },
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
  { id:'health', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ), labelKey:'nav.health' },
  { id:'more', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  ), labelKey:'nav.more' },
]

// MORE_TABS — sekcje które nie są codzienne (kompetencyjne / referencyjne).
// v2.9.3: temp/meds/symptoms/diaper PRZENIESIONE do core (Health, Feed).
// W More zostają: rozwojowe (milestones/teething/growth/cough/diet),
// medyczna historia (vaccinations/doctor).
// v2.10.2: emoji → Icon component z lucide-react (konsystencja platformowa).
const MORE_TABS = [
  { id:'milestones', Icon: Star,        labelKey:'nav.milestones' },
  { id:'teething',   Icon: Sparkles,    labelKey:'nav.teething' },
  { id:'growth',     Icon: Ruler,       labelKey:'nav.growth' },
  { id:'cough',      Icon: Wind,        labelKey:'nav.cough' },
  { id:'vacc',       Icon: Syringe,     labelKey:'nav.vacc' },
  { id:'diet',       Icon: Carrot,      labelKey:'nav.diet' },
  { id:'doctor',     Icon: Stethoscope, labelKey:'nav.doctor' },
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
  // Rejestracja SW od razu przy starcie — niezbędne dla notyfikacji o lekach.
  // Wcześniej SW rejestrował się dopiero w useMedReminder (czyli po wejściu do
  // Meds tab), przez co świeżo zainstalowana apka nigdy nie miała SW gotowego.
  useServiceWorker()

  // Medical consent — must be accepted ONCE before first use.
  // v2.9.0: zunifikowany ekran (consent + disclaimer w jednym).
  // needsConsent() sprawdza OBA stare klucze localStorage dla kompatybilności
  // z userami z 2.7.x/2.8.x — nikt nie musi akceptować ponownie.
  const [consentAccepted, setConsentAccepted] = useState(() => !needsConsent())
  // v2.9.0: MedicalConsentScreen sam zapisuje stampy do localStorage
  // (oba klucze defensywnie). Tu tylko przełączamy stan w pamięci.
  const acceptConsent = () => {
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
      addBreadcrumb('auth', 'guest-migration-complete', {
        migrated: result.migrated?.length || 0,
        skipped: result.skipped?.length || 0,
      })
      // Wyczyść guest dane tylko jeśli coś się udało zmigrować
      if (result.migrated.length > 0) {
        clearGuestData()
      }
    } catch (e) {
      captureError(e, { context: 'guest-migration' })
    } finally {
      setGuestMigrationDialog(null)
    }
  }

  const skipGuestMigration = () => {
    // User wybrał: nie migruj. Dane guesta zostają w localStorage (backup),
    // ale dialog już nie wyskoczy (flaga w localStorage).
    try {
      localStorage.setItem('babylog_migration_skipped_' + uid, '1')
    } catch (e) {
      // Jeśli tego nie zapiszemy, dialog wyskoczy znów po reload — warto widzieć w Sentry.
      addBreadcrumb('storage', 'migration-skip-save-failed', { msg: e?.message || 'unknown' })
    }
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
  const [tab, setTab] = useState('today')
  const [showProfiles, setShowProfiles] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPrep, setShowPrep] = useState(false)
  const [onboardingDone, setOnboardingDone] = useFirestore(uid, 'onboarding_done', false)

  // KRYTYCZNE — stabilna logika resolwowania aktywnego profilu.
  //
  // PROBLEM (data loss bug):
  // Stara logika: profiles.find(p => p.id === activeId) || profiles[0] || DEFAULT_PROFILE
  // Powodowała data loss gdy:
  // 1. activeId='default' (z onboarding) ale user usunął/przeszedł na inny profil
  // 2. profiles jest chwilowo puste podczas snapshot reload (race condition)
  // 3. Spadało na DEFAULT_PROFILE z id='default' → wszystkie tabowe useFirestore
  //    zmieniają klucze (z 'feed_realprofileid' na 'feed_default') → puste UI
  //
  // NOWA LOGIKA — używamy useRef żeby zapamiętać ostatni "dobry" active id.
  // Jeśli profiles ma dane → szukamy normalnie i zapisujemy id jako "stable".
  // Jeśli profiles pusta → używamy ostatniego stable id (nie zmieniamy klucza nagle).
  const stableActiveIdRef = useRef(null)
  const rawActive = (() => {
    // 1. Jeśli profiles puste — zwróć ostatni stabilny profil (lub default jeśli pierwsza sesja)
    if (!profiles || profiles.length === 0) {
      if (stableActiveIdRef.current) {
        return { ...DEFAULT_PROFILE, id: stableActiveIdRef.current }
      }
      return DEFAULT_PROFILE
    }
    // 2. profiles ma dane — szukaj aktywnego
    const found = profiles.find(p => p.id === activeId)
    if (found) {
      stableActiveIdRef.current = found.id
      return found
    }
    // 3. activeId nie pasuje do żadnego — użyj pierwszego z listy
    // (np. user usunął profil który był aktywny, albo activeId='default'
    // ale realny profil ma inne id z onboardingu)
    stableActiveIdRef.current = profiles[0].id
    return profiles[0]
  })()

  // Auto-naprawa: jeśli activeId w storage nie pasuje do żadnego realnego profilu,
  // zapisz prawidłowy ID żeby przy następnym reloadzie nie było race condition.
  useEffect(() => {
    if (!profiles || profiles.length === 0) return
    const exists = profiles.some(p => p.id === activeId)
    if (!exists && profiles[0]?.id) {
      setActiveId(profiles[0].id)
    }
  }, [profiles, activeId])

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
  const [sleepTimerTs, setSleepTimerTs] = useFirestore(uid, `sleep_timer_${active.id}`, null)

  // v2.9.3: quick-add stores dla FAB. Drobny duplicate listener względem
  // FeedTab/SleepTab/DiaperTab gdy te są aktywne (Firestore real-time
  // sync je deduplikuje na poziomie danych — oba zobaczą tę samą zawartość).
  // Sleep używa już tego samego klucza co `sleep_timer_${active.id}` — to OK.
  const [feedLogsForFab,   setFeedLogsForFab]   = useFirestore(uid, `feed_${active.id}`,   [])
  const [sleepLogsForFab,  setSleepLogsForFab]  = useFirestore(uid, `sleep_${active.id}`,  [])
  const [diaperLogsForFab, setDiaperLogsForFab] = useFirestore(uid, `diaper_${active.id}`, [])

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
  // v2.10.0: useRevenueCat już nie dostaje callback `activate`. Premium status
  // jest pisany do Firestore tylko przez Cloud Function revenueCatWebhook.
  const { checking: rcChecking, checkPremium, activateWithToken } = useRevenueCat(uid)

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
    const today = todayDate()
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

  // ── Visibility tier dla statusu / messages (v2.9.2) ───────────────────────
  // Polityka: critical alerts (życie-zagrażające) są ZAWSZE widoczne, premium
  // czy nie. Paywallowanie alertu typu "gorączka ≥40.5°C — zadzwoń 112" jest
  // etycznie i prawnie problematyczne (apka która "wie" o zagrożeniu, ale
  // ukrywa do czasu zakupu = potencjalne MDR/UOKiK ryzyko).
  //
  // Premium widzi pełny zestaw: critical + warning + alert + info, plus
  // sectionMessages, plus FREE_STATUS / EMPTY_STATUS są zastąpione globalStatus.
  //
  // Free widzi:
  //   - jeśli jest jakiś critical message → globalStatus i topStatus
  //     "critical", oraz tylko critical wiadomości (bez upgrade-prompt — to
  //     nieetyczne pod alertem o kryzysie)
  //   - inaczej → FREE_STATUS lub EMPTY_STATUS jako placeholder
  const criticalMessages = (messages || []).filter(m => m?.status === 'critical')
  const hasCritical = criticalMessages.length > 0

  const visibleStatus = isPremium
    ? globalStatus
    : hasCritical
      ? globalStatus
      : (hasDataToday ? FREE_STATUS() : EMPTY_STATUS())
  const visibleTopStatus = isPremium
    ? topStatus
    : (hasCritical ? 'critical' : 'ok')
  const visibleMessages = isPremium
    ? messages
    : criticalMessages
  const visibleSection = (section) => {
    const all = sectionMessages(section) || []
    return isPremium ? all : all.filter(m => m?.status === 'critical')
  }

  // Jeśli user jest na ukrytym tabie (np. Karmienia), przeskocz na pierwszy widoczny.
  // Scenariusz: user jest na Feed, idzie do Settings, wyłącza Karmienia → tab
  // znika z bottom nav, ale content dalej Feed. Trzeba go przenieść.
  // v2.9.3: stara nawigacja miała 'diaper' jako osobny tab — teraz jest częścią
  // 'feed' (subzakładka). Jeśli localStorage / state pamięta stary 'diaper'
  // (lub 'temp'/'meds'/'symptoms' z More), przekieruj. Plus: jeśli oba sub-segmenty
  // Feed (feed+diaper) są wyłączone w visibleTabs, wracaj na Today (rzadki edge case).
  useEffect(() => {
    if (tab === 'diaper') { setTab('feed'); return }
    if (tab === 'temp' || tab === 'meds' || tab === 'symptoms') { setTab('health'); return }
    if (tab === 'feed' &&
        active.visibleTabs?.feed === false &&
        active.visibleTabs?.diaper === false) {
      setTab('today')
    }
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

  // ── Quick-add callbacks dla QuickAddFab (v2.9.3) ──────────────────────────
  // Smart suggestion: sugeruj przeciwną pierś niż ostatnie karmienie z piersi
  // (parytetowa naprzemienność, podstawowa zasada laktacji).
  const lastBreastFeed = feedLogsForFab.find(l => l.type?.startsWith('Pierś'))
  const suggestedFeedType = lastBreastFeed
    ? (lastBreastFeed.type === 'Pierś lewa' ? 'Pierś prawa' : 'Pierś lewa')
    : null

  const quickAddFeed = (type, amount) => {
    const entry = { id: genId(), type, amount, time: nowTime(), date: todayDate() }
    setFeedLogsForFab([entry, ...feedLogsForFab])
    refresh?.()
    toast(`${t('toast.entry')}: ${type}`)
  }

  const quickAddDiaper = (type) => {
    const entry = { id: genId(), type, time: nowTime(), date: todayDate() }
    setDiaperLogsForFab([entry, ...diaperLogsForFab])
    refresh?.()
    toast(`${t('toast.entry')}: ${type}`)
  }

  const quickToggleSleep = () => {
    if (sleepTimerTs) {
      // Stop sleep — wyznacz duration, zapisz wpis, wyczyść timer
      const dur = Math.floor((Date.now() - sleepTimerTs) / 1000)
      const mins = Math.round(dur / 60)
      const startDate = new Date(sleepTimerTs).toISOString().slice(0, 10)
      const entry = {
        id: genId(),
        date: startDate,
        durationMin: mins,
        label: 'Drzemka',
        manual: false,
        startTs: sleepTimerTs,
        endTs: Date.now(),
      }
      setSleepLogsForFab([entry, ...sleepLogsForFab])
      setSleepTimerTs(null)
      refresh?.()
      const sessionH = Math.floor(dur / 3600)
      const sessionM = Math.floor((dur % 3600) / 60)
      const sessionStr = sessionH > 0 ? `${sessionH}h ${sessionM}m` : `${sessionM}m`
      toast(`${t('toast.sleep_ended')}: ${sessionStr}`)
    } else {
      setSleepTimerTs(Date.now())
      toast(t('toast.sleep_started'))
    }
  }

  const quickAddTemp = () => {
    // Temperatura wymaga pomiaru — nie da się "quick log" jak feed/diaper.
    // Otwieramy Health tab (segment temp) — user kliknie "+ Add" tam.
    navigate('health')
  }

  const renderTab = () => {
    switch(tab) {
      case 'today':      return (
        // v2.9.4: EmptyStateHero usunięty stąd — duplikował komunikat
        // "tu nic nie ma" z Today timeline empty state. Reszta empty
        // signaling: ChildStatusCard (status system) + OnboardingTipsBanner
        // (edu tipy, jednorazowo) + Today timeline empty state (lokalne).
        <TodayTab uid={uid} babyId={active.id} onNavigate={navigate} />
      )
      case 'feed':       return (
        <DailyTab visibleTabs={active.visibleTabs} {...sharedProps}
          toiletMode={active.toiletMode || 'diapers'}
          sectionAlerts={visibleSection('feed')}
          onNavigate={navigate} />
      )
      case 'sleep':      return <SleepTab      {...sharedProps} sectionAlerts={visibleSection('sleep')}  onNavigate={navigate} />
      case 'health':     return (
        <HealthTab {...sharedProps}
          sectionAlerts={[
            ...visibleSection('temp'),
            ...visibleSection('meds'),
            ...visibleSection('symptoms'),
          ]}
          onNavigate={navigate} />
      )
      // ── More tabs (kompetencyjne / referencyjne) ──────────────────────────
      case 'milestones': return <MilestonesTab {...sharedProps} />
      case 'teething':   return <TeethingTab {...sharedProps} />
      case 'growth':     return <GrowthTab     {...sharedProps} />
      case 'cough':      return <CoughTab      {...sharedProps} />
      case 'vacc':       return <VaccinationsTab {...sharedProps} />
      case 'diet':       return <DietTab       {...sharedProps} />
      case 'doctor':     return <DoctorNotesTab {...sharedProps} />
      // Defensywne fallbacki dla starych ID (gdyby ktoś trafił z głębokiego linka)
      case 'diaper':     return <DiaperTab    {...sharedProps} sectionAlerts={visibleSection('diaper')} onNavigate={navigate} />
      case 'temp':       return <TempTab      {...sharedProps} sectionAlerts={visibleSection('temp')}   onNavigate={navigate} />
      case 'meds':       return <MedsTab      {...sharedProps} sectionAlerts={visibleSection('meds')}   onNavigate={navigate} />
      case 'symptoms':   return <SymptomsTab  {...sharedProps} />
      default:           return <TodayTab     uid={uid} babyId={active.id} onNavigate={navigate} />
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
                background: 'linear-gradient(135deg, var(--brand-600), var(--brand-500))',
                color: 'var(--surface)', borderRadius: 'var(--radius-round)', border: 'none',
                padding: 'var(--space-tight) var(--space-snug)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
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
                color: 'var(--surface)', borderRadius: 'var(--radius-round)', border: 'none',
                padding: 'var(--space-tight) var(--space-snug)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
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
                background: 'var(--brand-50)', color: 'var(--brand-600)',
                border: '0.5px solid var(--brand-100)', borderRadius: 'var(--radius-round)',
                padding: 'var(--space-tight) var(--space-snug)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
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

        {/* STATUS CARD
            v2.9.5: dla Premium userów ChildStatusBar (zwijany pasek u góry)
            już komunikuje "brak ostrzeżeń" gdy topStatus='ok'. Renderowanie
            dodatkowo ChildStatusCard z tym samym komunikatem to wizualny
            duplikat (zaobserwowane na żywo). Dla Premium ok-status ukrywamy
            Card. Dla każdego niezerowego statusu (warning/alert/critical)
            Card zostaje — tam są konkretne komunikaty do działania.
            Free user nie widzi Bara (Premium-only), więc Card zawsze widoczna. */}
        {!showProfiles && !showMore && !(isPremium && visibleTopStatus === 'ok') && (
          <ChildStatusCard
            globalStatus={visibleStatus}
            topStatus={visibleTopStatus}
            messages={visibleMessages}
            // v2.9.2: free user z critical alertem klika → navigate do tabu
            // (np. Temp przy gorączce). Paywall TYLKO gdy free + brak critical
            // (czyli statusem jest FREE_STATUS placeholder zachęcający do Premium).
            onNavigate={(isPremium || hasCritical) ? navigate : openPaywall}
            isPremium={isPremium}
            onUpgrade={openPaywall}
          />
        )}

        {/* AUTO-HIDE BANNER — one-time prompt po 3 latach dziecka */}
        {!showProfiles && !showMore && (
          <AutoHideBanner profile={active} onUpdate={updateProfile} />
        )}

        {/* ONBOARDING TIPS — 3 edu tipy, dismissable, jednorazowy.
            Pokazuje się tylko jeśli localStorage flaga nie ustawiona.
            Po dismiss nie wraca. v2.9.2: zastępuje 3 slidy z onboardingu. */}
        {!showProfiles && !showMore && (
          <OnboardingTipsBanner />
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
                const Icon = tab.Icon
                return (
                  <button key={tab.id} onClick={()=>selectMoreTab(tab.id)} style={{
                    display:'flex',alignItems:'center',gap:'var(--space)',
                    padding:'var(--space) var(--space)',
                    background:'var(--surface)',border:'0.5px solid var(--border)',
                    borderRadius:'var(--radius-comfortable)',fontSize:15,fontWeight:500,color:'var(--text)',
                    textAlign:'left',minHeight:56,cursor:'pointer'
                  }}>
                    <Icon size={22} strokeWidth={1.8} color="var(--brand-600)" />
                    {t(tab.labelKey)}
                    {count > 0 && (
                      <span style={{
                        marginLeft:'var(--space-tight)',
                        background:'var(--alert-500)',color:'var(--surface)',
                        fontSize:10,fontWeight:700,
                        borderRadius:'var(--radius-round)',
                        padding:'1px 6px',
                      }}>{count}</span>
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
      <nav className="bottom-nav" role="tablist" aria-label={t('nav.main_aria')}>
        {NAV_TABS
          .filter(n => {
            // v2.9.3: jeśli oba sub-segmenty Feed (feed+diaper) są wyłączone,
            // ukryj cały Feed tab — useEffect w guard już przekierowuje na today.
            if (n.id === 'feed' &&
                active.visibleTabs?.feed === false &&
                active.visibleTabs?.diaper === false) return false
            return true
          })
          .map(n => {
          const count = (() => {
            // v2.9.3: zagregowane taby liczą sumę alertów ze wszystkich
            // sekcji które do nich należą.
            if (n.id === 'today') return 0  // Today nie ma własnych alertów (te są w Status Card)
            if (n.id === 'feed') {
              return visibleSection('feed').length + visibleSection('diaper').length
            }
            if (n.id === 'health') {
              return visibleSection('temp').length
                + visibleSection('meds').length
                + visibleSection('symptoms').length
            }
            if (n.id === 'sleep') return visibleSection('sleep').length
            if (n.id === 'more') {
              return MORE_TABS.reduce((s, tab) => s + visibleSection(tab.id).length, 0)
            }
            return 0
          })()
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

      {/* QUICK ADD FAB (v2.9.3) — nad bottom nav, tap = bottom-sheet menu,
          long-press 500ms = bezpośredni quick feed (smart breast suggestion).
          Ukryty na ekranach modal-typu (Profiles) bo tam nie ma sensu szybko
          logować — user jest w trybie zarządzania. Settings/Prep/Paywall to
          osobne early returns wyżej, więc FAB i tak się tam nie renderuje. */}
      {!showProfiles && (
        <QuickAddFab
          onQuickFeed={quickAddFeed}
          onQuickDiaper={quickAddDiaper}
          onQuickTemp={quickAddTemp}
          onQuickSleepStart={quickToggleSleep}
          suggestedFeedType={suggestedFeedType}
          sleepInProgress={!!sleepTimerTs}
          toiletMode={active.toiletMode || 'diapers'}
          bottomOffset={80}
        />
      )}

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
