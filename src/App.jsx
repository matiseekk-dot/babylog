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
import AutoHideBanner from './components/AutoHideBanner'
import OnboardingTipsBanner from './components/OnboardingTipsBanner'
import PaywallScreen from './components/PaywallScreen'
import DoctorNotesTab from './components/DoctorNotesTab'
import OnboardingScreen from './components/OnboardingScreen'
import ToastContainer from './components/Toast'
import { toast } from './components/Toast'
import { captureError, addBreadcrumb } from './sentry'
import { trackPurchaseCompleted, trackFirstEntry } from './utils/analytics'
import SleepIndicator from './components/SleepIndicator'
// v2.12.0: LanguageSwitcher przeniesiony do SettingsScreen — patrz topbar comment niżej.
import SettingsScreen from './components/SettingsScreen'
import CallDoctorPrep from './components/CallDoctorPrep'
import GuestMigrationDialog from './components/GuestMigrationDialog'
import PlayStoreModal from './components/PlayStoreModal'
import PremiumOnboardingModal from './components/PremiumOnboardingModal'
// v2.10.6 — MDR EXIT REFACTOR: replaced active crisis UI with passive reference content.
// Removed: ChildStatusBar / ChildStatusCard / CallDoctorCard / useCrisisDetection.
// Added:   TodaySummaryCard (passive reference link), ReferenceLibrary (static AAP/PTP tables),
//          WhenToSeekHelpCard (static warning-signs list).
import TodaySummaryCard from './components/TodaySummaryCard'
import ReferenceLibrary from './components/ReferenceLibrary'
import WhenToSeekHelpCard from './components/WhenToSeekHelpCard'
import { useServiceWorker } from './hooks/useServiceWorker'

import { useLocale, t, getLocale } from './i18n'
import { findPlan } from './data/premiumPlans'
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
// v2.10.6: dodane 'reference' i 'seek_help' (MDR EXIT — statyczne biblioteki
// wytycznych PTP/AAP, zastępują active crisis detection).
const MORE_TABS = [
  { id:'reference',  Icon: HeartPulse,  labelKey:'nav.reference' },
  { id:'seek_help',  Icon: Stethoscope, labelKey:'nav.seek_help' },
  { id:'milestones', Icon: Star,        labelKey:'nav.milestones' },
  { id:'teething',   Icon: Sparkles,    labelKey:'nav.teething' },
  { id:'growth',     Icon: Ruler,       labelKey:'nav.growth' },
  { id:'cough',      Icon: Wind,        labelKey:'nav.cough' },
  { id:'vacc',       Icon: Syringe,     labelKey:'nav.vacc' },
  { id:'diet',       Icon: Carrot,      labelKey:'nav.diet' },
  { id:'doctor',     Icon: Stethoscope, labelKey:'nav.doctor' },
]

// v2.10.6 — FREE_STATUS / EMPTY_STATUS removed. ChildStatusCard (their consumer)
// is gone per MDR EXIT REFACTOR — apka nie pokazuje już globalnego statusu zdrowia.

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

  // v2.12.0: Konfiguruj RevenueCat SDK raz gdy uid jest znany.
  // Wcześniej configure() był wywoływany w handleActivate() przy każdym kliknięciu
  // "Kup", co jest niezgodne z dokumentacją RC (powinno być jednokrotne przy starcie).
  useEffect(() => {
    if (!uid || !window.Capacitor?.isNativePlatform?.()) return
    ;(async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        const rcKey = import.meta.env.VITE_RC_PUBLIC_KEY
        if (!rcKey) return
        await Purchases.configure({ apiKey: rcKey, appUserID: uid })
        addBreadcrumb('purchase', 'rc-configured', { uid })
      } catch (e) {
        console.warn('[RC] configure failed on startup:', e?.message)
      }
    })()
  }, [uid])

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
      // v2.11.32 P1-6: track purchase completed. To jest kluczowa metryka
      // — bottom of funnel. Plan jest unknown bo Firestore pole
      // `premium_meta.value.product_id` byłoby zsynchronizowane z opóźnieniem.
      // Dla MVP wystarczy znać że zakup przeszedł; granularność per-plan
      // mamy z paywall_cta_clicked który łapie wybór planu przed kupnem.
      trackPurchaseCompleted(purchased ? 'purchased' : 'trial_to_premium')
      const flagKey = 'babylog_premium_onboarding_shown_' + uid
      try {
        if (localStorage.getItem(flagKey) !== '1') {
          setShowPremiumOnboarding(true)
          localStorage.setItem(flagKey, '1')
        }
      } catch {}
    }
    setPrevIsPremium(isPremium)
  }, [isPremium, prevIsPremium, uid, purchased])

  const closePremiumOnboarding = () => setShowPremiumOnboarding(false)
  const navigateToPdfReport = () => {
    setShowPremiumOnboarding(false)
    setShowSettings(true)  // Settings ma sekcję PDF Report
  }

  // v2.11.32 P1-6: paywall trigger source dla analytics — pokazuje skąd
  // user przyszedł do paywall. Pomaga ocenić który trigger konwertuje
  // najlepiej (topbar trial badge vs lock w tabie vs próba dodania 2-go
  // dziecka).
  const [paywallTrigger, setPaywallTrigger] = useState('unknown')
  const openPaywall = (trigger = 'unknown') => {
    setPaywallTrigger(trigger)
    setShowPaywall(true)
  }
  const closePaywall = () => setShowPaywall(false)

  // RevenueCat — weryfikacja subskrypcji
  // v2.10.0: useRevenueCat już nie dostaje callback `activate`. Premium status
  // jest pisany do Firestore tylko przez Cloud Function revenueCatWebhook.
  const { checking: rcChecking, checkPremium, activateWithToken } = useRevenueCat(uid)

  // Bug 1 fix: Modal zachęcający do instalacji apki (zamiast brzydkiego alert())
  const [showPlayStoreModal, setShowPlayStoreModal] = useState(false)
  // v2.11.12 — Local "purchasing" state. PaywallScreen pokazuje spinner + disabled
  // CTA gdy true. Wcześniej user klikał "Spróbuj" i widział nic przez ~2-5s
  // (czas otwarcia natywnego Google Play sheet) — myśląc że klik nie zadziałał.
  const [purchasing, setPurchasing] = useState(false)
  // v2.11.13 — pending activation state. Po zakupie czekamy na webhook RC →
  // Firestore update. Pokazujemy modal z spinnerem i timeoutem 60s. Jeśli
  // Premium nie odblokuje się w tym czasie → instrukcja kontaktu z support.
  const [pendingActivation, setPendingActivation] = useState(null)
  // null | { productId, purchaseToken, startedAt, status: 'waiting'|'success'|'failed', errorReason? }

  const handleActivate = async (planId) => {
    addBreadcrumb('purchase', 'handle-activate-clicked', { planId, hasUid: !!uid })

    // v2.11.13 — KRYTYCZNY FIX: gate guests from purchase. Free user without
    // Firebase login (uid=null) cannot activate Premium because RC requires
    // app_user_id. Wcześniej guest mógł kupić, Google pobierał kasę, a
    // activateWithToken cicho returnował (uid=null check) — money lost.
    // Teraz: prompt do logowania zamiast otwierania Google Pay.
    if (!uid) {
      addBreadcrumb('purchase', 'guest-blocked-needs-login', {})
      toast(t('paywall.need_login'), 'error')
      // Sygnalizujemy LoginScreen — wyloguj guest mode, pokaż login.
      try { localStorage.removeItem('babylog_guest') } catch {}
      setGuestMode(false)
      setShowPaywall(false)
      return
    }

    // v2.11.12 — KRYTYCZNY FIX: Google Play oczekuje pełnego SKU
    // (`spokojny_rodzic_premium_yearly`), NIE internal id ('yearly').
    // v2.12.0: poprawna obsługa wszystkich 5 locale (poprzednio fallback do 'pl' dla DE/FR/ES).
    const plan = findPlan(getLocale(), planId)
    const productId = plan?.productId
    if (!productId) {
      console.error('[handleActivate] no productId for planId:', planId)
      toast(t('paywall.error'), 'error')
      return
    }
    setPurchasing(true)
    try {
      // 0. Capacitor (natywna aplikacja Android) — RevenueCat Purchases SDK
      // getDigitalGoodsService nie istnieje w Capacitor WebView, więc używamy
      // natywnego Play Billing przez @revenuecat/purchases-capacitor.
      // configure() jest wywoływane RAZ przy starcie (useEffect w App.jsx gdy uid).
      if (window.Capacitor?.isNativePlatform?.()) {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')

        const { products } = await Purchases.getProducts({
          productIdentifiers: [productId],
        })

        if (!products?.length) {
          // Produkt nie znaleziony w Play Store — może apka nie jest z Play lub
          // produkty nie skonfigurowane w RC Dashboard. Informuj usera.
          addBreadcrumb('purchase', 'capacitor-product-not-found', { productId })
          toast(t('paywall.error'), 'error')
          return
        }

        let result
        try {
          result = await Purchases.purchaseStoreProduct({ product: products[0] })
        } catch (purchaseErr) {
          // Użytkownik anulował — PURCHASE_CANCELLED, nie pokazuj error toast
          const code = purchaseErr?.code || purchaseErr?.userInfo?.readableErrorCode || ''
          if (
            code === 'PURCHASE_CANCELLED' ||
            code === 'userCancelled' ||
            purchaseErr?.message?.toLowerCase?.().includes('cancel')
          ) {
            addBreadcrumb('purchase', 'capacitor-purchase-cancelled', { productId })
            return // cicho wyjdź
          }
          throw purchaseErr // inny błąd — obsłuż w zewnętrznym catch
        }

        const rcEntitlement = import.meta.env.VITE_RC_ENTITLEMENT || 'Spokojny Rodzic Pro'
        const hasEntitlement = !!result.customerInfo?.entitlements?.active?.[rcEntitlement]
        addBreadcrumb('purchase', 'capacitor-purchase-complete', { hasEntitlement, productId })

        if (hasEntitlement) {
          // RC SDK potwierdził aktywne uprawnienie — natychmiastowy sukces.
          setShowPaywall(false)
          toast(t('paywall.activated'))
        } else {
          // Rzadki przypadek: SDK nie widzi jeszcze uprawnienia (np. opóźnienie RC).
          // Fallback: sprawdź przez REST API. Webhook RC dotrze do Firestore w ciągu
          // kilku sekund i real-time listener zaktualizuje isPremium automatycznie.
          await checkPremium()
          setShowPaywall(false)
          toast(t('paywall.activated'))
        }
        return
      }

      // 1. TWA z Play Billing przez Digital Goods API (standardowe podejście PWABuilder)
      if ('getDigitalGoodsService' in window && window.PaymentRequest) {
        try {
          const service = await window.getDigitalGoodsService('https://play.google.com/billing')
          if (service) {
            const paymentMethod = [{
              supportedMethods: 'https://play.google.com/billing',
              data: { sku: productId },
            }]
            const paymentDetails = {
              total: {
                label: 'Spokojny Rodzic Premium',
                amount: { currency: 'PLN', value: '0' },
              },
            }
            const request = new PaymentRequest(paymentMethod, paymentDetails)
            const response = await request.show()
            // v2.11.14: różne wersje TWA / Chrome wystawiają purchase token
            // pod różnymi kluczami w response.details. Zbieramy wszystko co
            // mogłoby się przydać dla diagnostyki — przy normalnym flow
            // `purchaseToken` powinno być, ale spotykane też: `token`,
            // `details.token`, `purchaseInfo.purchaseToken`.
            const details = response.details || {}
            const purchaseToken =
              details.purchaseToken ||
              details.token ||
              details?.purchaseInfo?.purchaseToken ||
              null
            // Loguj klucze details (bez wartości — klucze nie są secret)
            // żeby diagnozować gdy token brak. Sentry breadcrumbs to wciągnie.
            addBreadcrumb('purchase', 'payment-request-completed', {
              detailsKeys: Object.keys(details).join(','),
              hasToken: !!purchaseToken,
              tokenLen: purchaseToken?.length || 0,
            })
            if (!purchaseToken) {
              // Google sheet zamknął się bez tokena (rare — albo user anulował,
              // albo wersja TWA wystawia token pod jakimś innym kluczem).
              // Loguj DUŻY error żeby Sentry to wyłapał. Money mogło zostać
              // pobrane (response był success), ale my nie mamy tokena → user
              // dostanie support contact na PendingActivationModal.
              const err = new Error(`PaymentRequest returned no purchaseToken. details keys: ${Object.keys(details).join(',') || '(empty)'}`)
              console.error('[paywall]', err.message, details)
              captureError(err, { context: 'paywall-no-token', planId, productId, detailsKeys: Object.keys(details) })
              await response.complete('fail')
              setPendingActivation({
                productId,
                purchaseToken: null,
                ts: Date.now(),
                status: 'failed',
                errorReason: 'no-token',
              })
              setShowPaywall(false)
              return
            }
            // v2.11.13 — Google pobrał kasę. Save token do localStorage queue
            // PRZED próbą RC activation — gdyby cokolwiek poszło nie tak (RC
            // down, network drop), gnijemy w queue i retry przy następnym
            // mount (App.jsx useEffect odpala retry). Token jest critical —
            // bez niego ZACO user zapłacił.
            const pending = { productId, purchaseToken, ts: Date.now() }
            try {
              const q = JSON.parse(localStorage.getItem('babylog_pending_activations') || '[]')
              q.push(pending)
              localStorage.setItem('babylog_pending_activations', JSON.stringify(q))
            } catch {}

            setPendingActivation({ ...pending, status: 'waiting' })
            setShowPaywall(false)

            // v2.11.15 — KRYTYCZNY FIX: acknowledge purchase token PRZED czymkolwiek.
            // Google Play Billing wymaga `acknowledge` w ciągu 3 dni od zakupu.
            // Bez tego Google AUTO-CANCEL'uje subskrypcję i zwraca pieniądze →
            // user dostaje email "anulowano ze względu na brak potwierdzenia".
            //
            // Wcześniej (do v2.11.14) NIE było acknowledge w kodzie — to wyjaśnia
            // dlaczego wszystkie 13 customers w RC mają 0 active subscriptions
            // mimo płatnych zakupów.
            //
            // RC SDK robi to automatycznie, ale my używamy REST API → musimy sami:
            // https://www.revenuecat.com/docs/google-play-billing-library
            //
            // Próbujemy 'repeatable' (subscription) najpierw, potem 'onetime' (one-time).
            // Niektóre wersje DGA API wymagają drugi argument, niektóre nie.
            // Robimy to BEFORE RC — kasa pobrana, bezwzględnie musimy potwierdzić,
            // niezależnie czy RC odpowie OK czy fail.
            try {
              try {
                await service.acknowledge(purchaseToken, 'repeatable')
              } catch (e1) {
                // Fallback dla starszych wersji DGA bez 2-go argumentu
                await service.acknowledge(purchaseToken)
              }
              addBreadcrumb('purchase', 'acknowledge-success', { productId })
            } catch (ackErr) {
              // Nawet jeśli acknowledge fail, kontynuujemy — RC może być w stanie
              // potwierdzić server-side (przez SubscriptionPurchases.acknowledge)
              // jeśli ma odpowiednie perms. Loguj do Sentry żeby było wiadomo.
              console.error('[paywall] acknowledge failed:', ackErr)
              captureError(ackErr, { context: 'paywall-acknowledge', productId })
              addBreadcrumb('purchase', 'acknowledge-failed', {
                message: (ackErr?.message || '').slice(0, 200),
              })
            }

            try {
              await activateWithToken(productId, purchaseToken)
              await response.complete('success')
              // Don't toast yet — wait for Firestore premium_purchased update
              // Effect monitoring `purchased` will handle final UI state.
              return
            } catch (rcErr) {
              // RC activation failed (4xx, network, malformed token, etc.)
              // Token zostaje w queue dla późniejszego retry.
              // v2.11.14 lepsze logowanie: rcErr.status / rcErr.body z RC
              console.error('[paywall] RC activation failed:', rcErr.status, rcErr.message)
              captureError(rcErr, {
                context: 'paywall-rc-activation',
                planId,
                productId,
                rcStatus: rcErr.status,
                rcBody: rcErr.body,
              })
              setPendingActivation(p => ({
                ...p,
                status: 'failed',
                errorReason: rcErr?.message || 'unknown',
                errorStatus: rcErr?.status || null,
              }))
              await response.complete('success') // Google was paid — don't tell Google "fail"
              return
            }
          }
        } catch (dgaErr) {
          if (dgaErr?.name !== 'AbortError') {
            console.warn('[paywall] DGA flow failed, falling through:', dgaErr)
            captureError(dgaErr, { context: 'paywall-dga', planId, productId })
          }
        }
      }

      // 2. Custom Android bridge (stary mechanizm, jeśli kiedyś będzie)
      if (window.Android?.launchBilling) {
        window.Android.launchBilling(productId)
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
      captureError(e, { context: 'paywall-activate', planId, productId })
      toast(t('paywall.error'), 'error')
    } finally {
      setPurchasing(false)
    }
  }

  // v2.11.13 — Watch isPremium. Gdy pendingActivation w stanie 'waiting' i
  // isPremium flips to true (webhook RC napisał do Firestore, listener pickedup)
  // → success toast + clear pending + remove z localStorage queue.
  useEffect(() => {
    if (!pendingActivation || pendingActivation.status !== 'waiting') return
    if (isPremium) {
      addBreadcrumb('purchase', 'activation-completed', { productId: pendingActivation.productId })
      toast(t('paywall.activated'))
      setPendingActivation(null)
      // Clear z localStorage queue
      try {
        const q = JSON.parse(localStorage.getItem('babylog_pending_activations') || '[]')
        const filtered = q.filter(p => p.purchaseToken !== pendingActivation.purchaseToken)
        localStorage.setItem('babylog_pending_activations', JSON.stringify(filtered))
      } catch {}
    }
  }, [isPremium, pendingActivation])

  // v2.11.13 — Timeout pending activation po 60s. Jeśli webhook RC nie dotarł
  // do Firestore w tym czasie, pokazujemy modal z error + instrukcja kontaktu
  // z support. Token zostaje w localStorage queue dla manualnego retry przez
  // technical support albo następnym razem przy app start.
  useEffect(() => {
    if (!pendingActivation || pendingActivation.status !== 'waiting') return
    const timer = setTimeout(() => {
      setPendingActivation(p => p?.status === 'waiting'
        ? { ...p, status: 'failed', errorReason: 'timeout' }
        : p)
    }, 60000)
    return () => clearTimeout(timer)
  }, [pendingActivation])

  // v2.11.13 — Retry pending activations on app start. Jeśli user wcześniej
  // kupił ale RC był chwilowo down, próbujemy ponownie. Limit 3 prób per
  // token, potem usuwamy z queue (probably permanent failure — support).
  //
  // v2.11.15: Dodano acknowledge fallback. Tokeny które nie zostały
  // acknowledżowane przy pierwszej próbie (np. user zamknął apkę przed RC
  // returnem, albo DGA service crashed) — przy retry ponownie próbujemy
  // acknowledge. Bez tego Google auto-cancel po 3 dniach.
  useEffect(() => {
    if (!uid) return
    if (isPremium) return // already active, no retry needed
    let cancelled = false
    ;(async () => {
      try {
        const q = JSON.parse(localStorage.getItem('babylog_pending_activations') || '[]')
        if (!q.length) return
        // Pobieramy DGA service raz dla wszystkich pending. Jeśli nie jest dostępny
        // (apka jest na non-TWA, np. desktop browser), acknowledge jest skipowany —
        // RC przy walidacji tokena może go acknowledżować jeśli ma odpowiednie perms.
        let dgaService = null
        if ('getDigitalGoodsService' in window) {
          try {
            dgaService = await window.getDigitalGoodsService('https://play.google.com/billing')
          } catch {}
        }
        const fresh = []
        for (const p of q) {
          if (cancelled) break
          const attempts = p.attempts || 0
          if (attempts >= 3) continue // drop after 3 retries

          // v2.11.15: TRY ACKNOWLEDGE FIRST — niezależnie od RC outcome.
          // Idempotent: jeśli już acknowledged, Google zwraca ok bez side-effectu.
          if (dgaService && !p.acknowledged) {
            try {
              try {
                await dgaService.acknowledge(p.purchaseToken, 'repeatable')
              } catch {
                await dgaService.acknowledge(p.purchaseToken)
              }
              p.acknowledged = true // mark żeby przy następnym retry nie próbować
              addBreadcrumb('purchase', 'acknowledge-retry-success', { productId: p.productId })
            } catch (ackErr) {
              addBreadcrumb('purchase', 'acknowledge-retry-failed', {
                message: (ackErr?.message || '').slice(0, 200),
              })
              // Continue mimo to — RC może się powieść
            }
          }

          try {
            await activateWithToken(p.productId, p.purchaseToken)
            // Success → don't re-add to queue
          } catch {
            fresh.push({ ...p, attempts: attempts + 1, lastTry: Date.now() })
          }
        }
        if (!cancelled) {
          localStorage.setItem('babylog_pending_activations', JSON.stringify(fresh))
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [uid, isPremium, activateWithToken])

  const openPlayStore = () => {
    // Link do sklepu Google Play — wypełnia się po publikacji na Production
    // Tymczasowo link otwiera stronę apki w Play Console (dla Closed Testing)
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=pl.skudev.spokojnyrodzic'
    window.open(playStoreUrl, '_blank')
    setShowPlayStoreModal(false)
  }

  // ── Decision layer (v2.10.6 — MDR EXIT) ────────────────────────────────────
  // Apka NIE liczy już globalnego statusu zdrowia ani crisis detection.
  // useChildStatus zostaje wywoływane TYLKO dla `sectionMessages` i `refresh`,
  // które są używane przez poszczególne taby do lokalnych observations.
  // Globalny crisis UI (ChildStatusBar/ChildStatusCard/CallDoctorCard) usunięty.
  const { sectionMessages, refresh } = useChildStatus(
    active.id, active.months, active.weight
  )

  // v2.10.6: section alerts są nadal pokazywane w tabach (lokalne observations
  // na poziomie sekcji typu "ostatni feed był 4h temu"). Visibility tier free/premium
  // już niepotrzebne — wszyscy widzą te same neutral observations.
  const visibleSection = (section) => sectionMessages(section) || []

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

  // v2.11.10: Reset scroll position on tab/view change.
  // Bug repro: enter More menu (lista 9 items, scrollable) → scroll down 200px →
  // click ostatni item (Doctor Notes) → tab content otwiera się ze scrollTop=200
  // (browser clamp do max scroll new content, np. 49px). User widzi tab już
  // zescrollowany "w połowie" i myśli że scroll jest zepsuty.
  // Fix: gdy `tab`, `showMore` lub `showProfiles` się zmienią, zresetuj scrollTop.
  useEffect(() => {
    const content = document.querySelector('.content')
    if (content) content.scrollTop = 0
  }, [tab, showMore, showProfiles])

  const navigate = (targetTab) => {
    if (!targetTab) return
    if (targetTab === 'settings') { setShowSettings(true); return }
    if (MORE_TABS.some(t => t.id === targetTab)) {
      setTab(targetTab); setShowMore(false); setShowProfiles(false)
    } else {
      selectTab(targetTab)
    }
  }

  // v2.11.8: gate addProfile by Premium — paywall obiecuje "Unlimited children"
  // jako Premium feature. Wcześniej free user mógł dodać ile chce profili.
  // Free: max 1 child. Premium/Trial: unlimited. Próba dodania jako free
  // otwiera paywall zamiast zapisać.
  const addProfile = (p) => {
    if (!isPremium && profiles.length >= 1) {
      openPaywall('profile_limit')
      return
    }
    setProfiles([...profiles, p])
    setActiveId(p.id)
  }
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
    onUpgrade: () => openPaywall('premium_feature'),
  }

  // ── Quick-add callbacks dla QuickAddFab (v2.9.3) ──────────────────────────
  // Smart suggestion: sugeruj przeciwną pierś niż ostatnie karmienie z piersi
  // (parytetowa naprzemienność, podstawowa zasada laktacji).
  const lastBreastFeed = feedLogsForFab.find(l => l.type?.startsWith('Pierś'))
  const suggestedFeedType = lastBreastFeed
    ? (lastBreastFeed.type === 'Pierś lewa' ? 'Pierś prawa' : 'Pierś lewa')
    : null

  // v2.11.32 P1-6: track FIRST entry once per uid. localStorage flaga żeby
  // nie spamować analytics przy każdym kolejnym wpisie — interesuje nas
  // dystans install→first_entry (aha moment), nie wszystkie 1000 wpisów.
  const trackFirstEntryOnce = (entryType) => {
    if (!uid) return
    const flagKey = 'babylog_first_entry_tracked_' + uid
    try {
      if (localStorage.getItem(flagKey) === '1') return
      localStorage.setItem(flagKey, '1')
      trackFirstEntry(entryType)
    } catch {}
  }

  const quickAddFeed = (type, amount) => {
    const entry = { id: genId(), type, amount, time: nowTime(), date: todayDate() }
    setFeedLogsForFab([entry, ...feedLogsForFab])
    refresh?.()
    trackFirstEntryOnce('feed')
    toast(`${t('toast.entry')}: ${type}`)
  }

  const quickAddDiaper = (type) => {
    const entry = { id: genId(), type, time: nowTime(), date: todayDate() }
    setDiaperLogsForFab([entry, ...diaperLogsForFab])
    refresh?.()
    trackFirstEntryOnce('diaper')
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
      trackFirstEntryOnce('sleep')
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
    // v2.10.4: Bug fix — wcześniej tylko nawigowaliśmy na Health, ale jeśli
    // user był na innym segmencie (np. meds), trafiał na nieswoją zakładkę,
    // i jeszcze musiał sam kliknąć "+ Dodaj pomiar". Ten quick action był
    // bezsensowny — szybciej było iść ręcznie.
    //
    // Fix: ustawiamy w localStorage dwie flagi:
    //   1. babylog_health_segment = 'temp' — wymuś segment Health=Temp
    //   2. babylog_temp_open_add = '1' — TempTab przy mount otworzy modal
    // Następnie navigate('health') → HealthTab montuje TempTab → useEffect
    // tam czyta flagi i otwiera modal automatycznie.
    try {
      localStorage.setItem('babylog_health_segment', 'temp')
      localStorage.setItem('babylog_temp_open_add', '1')
    } catch {}
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
      // v2.10.6 — MDR EXIT: 'reference' i 'seek_help' są STATYCZNE biblioteki,
      // identyczne dla wszystkich, niezależne od danych dziecka. To główny
      // mechanizm wyłączenia apki z definicji MDSW (brak personalnego output).
      case 'reference':  return <ReferenceLibrary onClose={() => setTab('today')} />
      case 'seek_help':  return <WhenToSeekHelpCard onClose={() => setTab('today')} onPrepNotes={() => setShowPrep(true)} />
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
          onUpgrade={() => { setShowSettings(false); openPaywall('settings') }}
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
      // v2.11.11: PaywallScreen ma teraz własny layout (flex column z internal
      // scroll + non-fixed footer), więc .app jest tylko cienkim wrapperem.
      // PlayStoreModal renderowany TUTAJ — wcześniej był tylko w main return,
      // czyli klik "Spróbuj" → setShowPlayStoreModal(true) ale modal się nie
      // pojawiał (early return paywall był aktywny). Teraz dostępny w obu
      // ścieżkach renderowania.
      <div className="app" style={{ position: 'relative' }}>
        <PaywallScreen
          onActivate={handleActivate}
          onClose={closePaywall}
          checking={rcChecking || purchasing}
          trigger={paywallTrigger}
        />
        <PlayStoreModal
          open={showPlayStoreModal}
          onClose={() => setShowPlayStoreModal(false)}
          onOpenPlayStore={openPlayStore}
        />
      </div>
    )
  }

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          {/* v2.11.6: bez emoji w logo — emoji 🍼 wraz z "Spokojny Rodzic" + 4 elementami
              po prawej (PL/EN, Trial, ⚙, baby chip) nie mieściło się na 432px viewport,
              powodując ellipsis "Spokojny Ro...". Teraz tytuł sam, emoji już nie eatuje
              ~22px szerokości. */}
          <div className="topbar-logo">{t('app.title')}</div>
          <div className="topbar-sub">
            {showProfiles ? t('topbar.profiles') : showMore ? t('topbar.more') : currentMoreTab ? t(currentMoreTab.labelKey) : t(NAV_TABS.find(x=>x.id===tab)?.labelKey || 'nav.feed')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* v2.12.0: LanguageSwitcher przeniesiony do SettingsScreen.
              Powód: 5 języków × 28px = 140px zajmowało prawie połowę topbar
              i wyglądało jak panel deweloperski. Standard branżowy = język
              w Settings. 95% userów nigdy nie zmienia (auto-detect z
              navigator.language działa). Patrz: SettingsScreen → sekcja
              "Język aplikacji" / "Sprache" / "Langue" / "Idioma". */}
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
              onClick={() => openPaywall('topbar_trial')}
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
              onClick={() => openPaywall('topbar_free')}
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

      {/* CONTENT */}
      <div className="content">

        {/* v2.10.6 — MDR EXIT REFACTOR
            Usunięte: ChildStatusBar, CallDoctorCard (crisis), ChildStatusCard.
            Te komponenty implementowały active clinical decision support
            (severity hierarchy, "zadzwoń do lekarza") = MDSW pod MDR Rule 11.
            Zastąpione: TodaySummaryCard — pasywny link do statycznych wytycznych
            PTP/AAP. Apka pokazuje user'owi (a) jego własne dane w tabach,
            (b) statyczne tabele dostępne pod More → "Wytyczne PTP/AAP".
            Apka nie ocenia, nie alertuje, nie diagnozuje. */}
        {!showProfiles && !showMore && tab === 'today' && (
          <TodaySummaryCard onNavigate={navigate} />
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
            isPremium={isPremium}
            onUpgrade={() => { setShowProfiles(false); openPaywall('profiles') }}
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
      {/* v2.11.13 — Pending activation modal. Pokazuje się po purchase gdy
          czekamy na webhook RC → Firestore. Status:
          - 'waiting': spinner + "Aktywujemy Premium..."
          - 'failed':  error + email do support + token saved for retry */}
      {pendingActivation && (
        <div role="dialog" aria-modal="true" style={{
          position:'fixed',top:0,left:0,right:0,bottom:0,
          background:'rgba(0,0,0,0.6)',zIndex:10001,
          display:'flex',alignItems:'center',justifyContent:'center',padding:20,
        }}>
          <div style={{
            background:'#fff',borderRadius:16,padding:'28px 24px',
            maxWidth:420,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
            textAlign:'center',
          }}>
            {pendingActivation.status === 'waiting' && (
              <>
                <div style={{fontSize:40,marginBottom:14}}>⏳</div>
                <svg width="48" height="48" viewBox="0 0 24 24" style={{animation:'spin 0.8s linear infinite',marginBottom:14}}>
                  <circle cx="12" cy="12" r="10" stroke="#0F6E56" strokeWidth="3" fill="none" strokeOpacity="0.25"/>
                  <path d="M12 2 a10 10 0 0 1 10 10" stroke="#0F6E56" strokeWidth="3" fill="none" strokeLinecap="round"/>
                </svg>
                <h2 style={{fontSize:18,fontWeight:800,marginBottom:10,color:'#1a1a18'}}>
                  {t('paywall.activating.title')}
                </h2>
                <p style={{fontSize:14,lineHeight:1.5,color:'#5a5a56'}}>
                  {t('paywall.activating.body')}
                </p>
              </>
            )}
            {pendingActivation.status === 'failed' && (
              <>
                <div style={{fontSize:40,marginBottom:14}}>⚠️</div>
                <h2 style={{fontSize:18,fontWeight:800,marginBottom:12,color:'#7a3a05'}}>
                  {t('paywall.activation_failed.title')}
                </h2>
                <p style={{fontSize:14,lineHeight:1.55,color:'#5a5a56',marginBottom:16,textAlign:'left'}}>
                  {t('paywall.activation_failed.body')}
                </p>
                {/* v2.11.18 — DEBUG INFO. Pokazujemy konkretny error code +
                    productId + tokenPrefix żeby user mógł skopiować i wysłać
                    do supportu, a my mogli zdiagnozować KONKRETNY błąd RC.
                    Bez tego user widzi tylko "nie powiodła się" — bezużyteczne
                    diagnostycznie. */}
                <div style={{
                  background:'#F7F4EE',border:'1px solid #E0D7C5',borderRadius:8,
                  padding:10,fontSize:11,color:'#5a4a30',marginBottom:14,
                  textAlign:'left',fontFamily:'monospace',wordBreak:'break-all',
                }}>
                  <div style={{fontWeight:700,marginBottom:6,fontSize:10,color:'#7a6a40'}}>
                    DEBUG INFO (skopiuj do support):
                  </div>
                  <div>product: {pendingActivation.productId || '(none)'}</div>
                  <div>error: {pendingActivation.errorReason || '(none)'}</div>
                  {pendingActivation.errorStatus && (
                    <div>status: {pendingActivation.errorStatus}</div>
                  )}
                  <div>token: {(pendingActivation.purchaseToken || '').slice(0, 12)}…</div>
                  <div>ts: {new Date(pendingActivation.ts || Date.now()).toISOString()}</div>
                </div>
                <div style={{
                  background:'#FAEEDA',border:'1px solid #FAC775',borderRadius:8,
                  padding:12,fontSize:12,color:'#633806',marginBottom:16,textAlign:'left',
                }}>
                  {t('paywall.activation_failed.support_hint')}
                  <a href="mailto:skudev6@gmail.com?subject=Premium activation failed" style={{display:'block',marginTop:6,fontWeight:700,color:'#0F6E56'}}>
                    skudev6@gmail.com
                  </a>
                </div>
                <button onClick={() => setPendingActivation(null)} style={{
                  width:'100%',padding:12,background:'#0F6E56',color:'#fff',
                  border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',
                }}>
                  {t('common.close')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <PremiumOnboardingModal
        open={showPremiumOnboarding}
        onClose={closePremiumOnboarding}
        onNavigateToReport={navigateToPdfReport}
      />
    </div>
  )
}
