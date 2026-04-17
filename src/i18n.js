/**
 * i18n.js
 *
 * Prosty system tłumaczeń dla aplikacji Spokojny Rodzic / Calm Parent.
 *
 * Użycie:
 *   import { t, useLocale } from './i18n'
 *   t('app.title')              → 'Spokojny Rodzic' / 'Calm Parent'
 *   t('feed.quick.left')        → 'Pierś lewa' / 'Left breast'
 *
 *   const { locale, setLocale } = useLocale()
 *   setLocale('en')
 *
 * Detekcja języka:
 *   1. LocalStorage (jeśli user wybrał)
 *   2. navigator.language (fallback na PL)
 */

import { useState, useEffect } from 'react'

// ─── Słownik tłumaczeń ───────────────────────────────────────────────────────

const TRANSLATIONS = {
  pl: {
    // App
    'app.title':          'Spokojny Rodzic',
    'app.subtitle':       'Zdrowie dziecka pod kontrolą',
    'app.tagline':        'Aplikacja, która pomaga Ci wiedzieć co robić, gdy dziecko jest chore.',
    'app.loading':        'Ładowanie...',

    // Nav tabs
    'nav.feed':           'Karmienie',
    'nav.sleep':          'Sen',
    'nav.diaper':         'Pieluchy',
    'nav.more':           'Więcej',
    'nav.milestones':     'Kamienie milowe',
    'nav.growth':         'Wzrost i waga',
    'nav.temp':           'Temperatura',
    'nav.meds':           'Leki',
    'nav.vacc':           'Szczepienia',
    'nav.diet':           'Rozszerzanie diety',
    'nav.diary':          'Dziennik',
    'nav.doctor':         'Notatki lekarskie',
    'nav.all_modules':    'Wszystkie moduły',
    'nav.select_section': 'Wybierz sekcję',

    // Topbar
    'topbar.logout':      'Wyloguj',
    'topbar.premium':     'Premium',
    'topbar.free':        'Free',
    'topbar.profiles':    'Profile dzieci',
    'topbar.more':        'Więcej modułów',

    // Onboarding
    'onb.skip':           'Pomiń',
    'onb.next':           'Dalej',
    'onb.slide1.title':   'Zapisuj zdrowie\ndziecka',
    'onb.slide1.body':    'Temperatura, karmienie, sen, leki — wszystko w jednym miejscu. Szybko, bez zbędnych kroków.',
    'onb.slide2.title':   'Zrozum\nco się dzieje',
    'onb.slide2.body':    'Aplikacja analizuje dane i pokazuje czy temperatura rośnie, czy sen jest poniżej normy i kiedy można podać kolejną dawkę leku.',
    'onb.slide2.note':    'Bez szukania w Google o 3 w nocy.',
    'onb.slide3.title':   'Wiedz\nco zrobić',
    'onb.slide3.body':    'Konkretne wskazówki dopasowane do stanu dziecka. Aplikacja podpowiada — Ty decydujesz.',
    'onb.slide3.note':    'Mniej stresu. Więcej spokoju.',
    'onb.setup.title':    'Poznajmy Twoje dziecko',
    'onb.setup.subtitle': 'Dzięki temu komunikaty będą spersonalizowane',
    'onb.setup.avatar':   'Wybierz avatar',
    'onb.setup.name':     'Imię dziecka',
    'onb.setup.name_ph':  'np. Zosia, Kacper...',
    'onb.setup.age':      'Wiek (miesiące)',
    'onb.setup.weight':   'Waga (kg)',
    'onb.setup.hint':     'Waga jest potrzebna do kalkulatora dawek leków. Możesz ją zmienić w ustawieniach.',
    'onb.setup.cta':      'Zaczynamy',

    // Login
    'login.title':        'Spokojny Rodzic',
    'login.subtitle':     'Aplikacja, która pomaga Ci wiedzieć\nco robić, gdy dziecko jest chore.',
    'login.benefit1':     'Dane synchronizowane między urządzeniami',
    'login.benefit2':     'Twoje dane są prywatne i bezpieczne',
    'login.benefit3':     'Działa offline — nawet bez internetu',
    'login.button':       'Zaloguj się przez Google',
    'login.loading':      'Logowanie...',
    'login.error':        'Nie udało się zalogować. Spróbuj ponownie.',
    'login.footer':       'Kontynuując, akceptujesz naszą Politykę Prywatności.\nTwoje dane zdrowotne są przechowywane tylko na Twoim koncie Google.',

    // Paywall
    'paywall.title':      'Spokojny Rodzic Premium',
    'paywall.subtitle':   'Pełna analiza. Jasne wskazówki. Spokój głowy.',
    'paywall.feat1.title':'Analiza temperatury',
    'paywall.feat1.desc': 'Trend rosnący / stabilny / spadający w czasie rzeczywistym',
    'paywall.feat2.title':'Alerty zdrowotne',
    'paywall.feat2.desc': 'Powiadomienia o gorączce, niedoborze snu i lekach',
    'paywall.feat3.title':'Wskazówki co teraz zrobić',
    'paywall.feat3.desc': 'Kontekstowe komunikaty dopasowane do stanu dziecka',
    'paywall.feat4.title':'Kalkulator leków',
    'paywall.feat4.desc': 'Informacja kiedy można podać kolejną dawkę',
    'paywall.feat5.title':'Sync między urządzeniami',
    'paywall.feat5.desc': 'Dane dostępne na każdym telefonie',
    'paywall.feat6.title':'Notatki lekarskie',
    'paywall.feat6.desc': 'Diagnoza i zalecenia po każdej wizycie',
    'paywall.plan.monthly':  'Miesięczny',
    'paywall.plan.yearly':   'Roczny',
    'paywall.plan.lifetime': 'Dożywotni',
    'paywall.per.monthly':   '/ miesiąc',
    'paywall.per.yearly':    '/ rok',
    'paywall.per.lifetime':  'jednorazowo',
    'paywall.badge.yearly':  'Oszczędzasz 44%',
    'paywall.badge.popular': 'Najpopularniejszy',
    'paywall.cta':        'Odblokuj spokój',
    'paywall.cta.loading':'Weryfikowanie...',
    'paywall.footer':     'Płatność przez Google Play · Anuluj w każdej chwili',
    'paywall.web_only':   'Zakup Premium jest dostępny w aplikacji Android. Pobierz Spokojny Rodzic z Google Play.',

    // Status card
    'status.free.title':    'Dane zapisane',
    'status.free.message':  'Odblokuj Premium, aby zobaczyć analizę i alerty.',
    'status.empty.title':   'Cześć! Zacznij od pierwszego wpisu',
    'status.empty.message': 'Dodaj temperaturę, karmienie lub stwierdzenie pieluchy — aplikacja zacznie analizować dane.',
    'status.cta_upgrade':   'Odblokuj analizę i alerty — Premium',

    // Feed tab
    'feed.title':         'Karmienie',
    'feed.desc':          'Rejestruj karmienia piersią i butelką',
    'feed.quick.left':    'Pierś\nlewa',
    'feed.quick.right':   'Pierś\nprawa',
    'feed.quick.bottle':  'Butelka',
    'feed.stat.count':    'karmień dziś',
    'feed.stat.bottle':   'ml butelką',
    'feed.stat.breast':   'pierś',
    'feed.stat.ago':      'od ostatniego',
    'feed.today':         'Dzisiaj',
    'feed.empty':         'Użyj przycisków powyżej żeby szybko dodać karmienie',
    'feed.add_detail':    '+ Dodaj z detalami',
    'feed.modal.title':   'Nowe karmienie',
    'feed.modal.type':    'Typ karmienia',
    'feed.modal.amount_ml':'Ilość (ml)',
    'feed.modal.amount_min':'Czas (min)',
    'feed.toast.saved':   'Karmienie zapisane',

    // Diaper tab
    'diaper.title':       'Pieluchy',
    'diaper.desc':        'Monitoruj pieluchy dziecka',
    'diaper.wet':         'Mokra',
    'diaper.dirty':       'Brudna',
    'diaper.both':        'Obydwie',
    'diaper.stat.total':  'pieluch dziś',
    'diaper.stat.wet':    'mokrych',
    'diaper.stat.dirty':  'brudnych',
    'diaper.empty':       'Użyj przycisków powyżej',
    'diaper.add_note':    '+ Dodaj z notatką',
    'diaper.modal.title': 'Nowa pielucha',
    'diaper.modal.note':  'Notatka (opcjonalna)',
    'diaper.modal.note_ph':'np. kolor, konsystencja...',
    'diaper.toast.saved': 'Pielucha zapisana',

    // Common
    'common.save':        'Zapisz',
    'common.cancel':      'Anuluj',
    'common.close':       'Zamknij',
    'common.delete':      'Usuń',
    'common.edit':        'Edytuj',
    'common.date':        'Data',
    'common.time':        'Godzina',
    'common.note':        'Notatka',
    'common.saved':       'Zapisano',
    'common.today':       'Dzisiaj',

    // Toast
    'toast.saved':        'Zapisano',
    'toast.sleep_ended':  'Sen zakończony',
    'toast.temp':         'Temperatura zapisana',
    'toast.med':          'Lek zapisany',
    'toast.growth':       'Pomiar zapisany',
    'toast.entry':        'Wpis zapisany',

    // Medical
    'med.important':      'Ważne:',
    'med.disclaimer':     'Podane dawki są orientacyjne. Zawsze konsultuj się z lekarzem lub farmaceutą.',
    'med.remind_enable':  'Włącz powiadomienia, żeby dostać alert gdy będzie można podać kolejną dawkę.',
    'med.remind_btn':     'Włącz',
  },

  en: {
    // App
    'app.title':          'Calm Parent',
    'app.subtitle':       'Your baby\'s health, under control',
    'app.tagline':        'An app that helps you know what to do when your baby is sick.',
    'app.loading':        'Loading...',

    // Nav tabs
    'nav.feed':           'Feeding',
    'nav.sleep':          'Sleep',
    'nav.diaper':         'Diapers',
    'nav.more':           'More',
    'nav.milestones':     'Milestones',
    'nav.growth':         'Growth',
    'nav.temp':           'Temperature',
    'nav.meds':           'Medicine',
    'nav.vacc':           'Vaccinations',
    'nav.diet':           'Solids',
    'nav.diary':          'Diary',
    'nav.doctor':         'Doctor notes',
    'nav.all_modules':    'All modules',
    'nav.select_section': 'Select section',

    // Topbar
    'topbar.logout':      'Log out',
    'topbar.premium':     'Premium',
    'topbar.free':        'Free',
    'topbar.profiles':    'Children profiles',
    'topbar.more':        'More modules',

    // Onboarding
    'onb.skip':           'Skip',
    'onb.next':           'Next',
    'onb.slide1.title':   'Track your\nbaby\'s health',
    'onb.slide1.body':    'Temperature, feeding, sleep, meds — all in one place. Fast, without extra taps.',
    'onb.slide2.title':   'Understand\nwhat\'s happening',
    'onb.slide2.body':    'The app analyzes your data and tells you if temperature is rising, sleep is below average, and when you can give the next dose of medicine.',
    'onb.slide2.note':    'No more Googling at 3 AM.',
    'onb.slide3.title':   'Know\nwhat to do',
    'onb.slide3.body':    'Clear suggestions tailored to your baby\'s state. The app guides — you decide.',
    'onb.slide3.note':    'Less stress. More calm.',
    'onb.setup.title':    'Let\'s get to know your baby',
    'onb.setup.subtitle': 'So we can personalize all messages',
    'onb.setup.avatar':   'Choose avatar',
    'onb.setup.name':     'Baby\'s name',
    'onb.setup.name_ph':  'e.g. Emma, Liam...',
    'onb.setup.age':      'Age (months)',
    'onb.setup.weight':   'Weight (kg)',
    'onb.setup.hint':     'Weight is needed for the medicine dose calculator. You can change it later.',
    'onb.setup.cta':      'Let\'s go',

    // Login
    'login.title':        'Calm Parent',
    'login.subtitle':     'An app that helps you know\nwhat to do when your baby is sick.',
    'login.benefit1':     'Data synced across your devices',
    'login.benefit2':     'Your data is private and secure',
    'login.benefit3':     'Works offline — even without internet',
    'login.button':       'Sign in with Google',
    'login.loading':      'Signing in...',
    'login.error':        'Sign in failed. Please try again.',
    'login.footer':       'By continuing, you agree to our Privacy Policy.\nYour health data is stored only in your Google account.',

    // Paywall
    'paywall.title':      'Calm Parent Premium',
    'paywall.subtitle':   'Full analysis. Clear guidance. Peace of mind.',
    'paywall.feat1.title':'Temperature analysis',
    'paywall.feat1.desc': 'Rising / stable / falling trend in real time',
    'paywall.feat2.title':'Health alerts',
    'paywall.feat2.desc': 'Notifications for fever, sleep deficit, and medicine',
    'paywall.feat3.title':'What to do now',
    'paywall.feat3.desc': 'Contextual guidance based on your baby\'s state',
    'paywall.feat4.title':'Medicine calculator',
    'paywall.feat4.desc': 'Know when the next dose can be given',
    'paywall.feat5.title':'Cross-device sync',
    'paywall.feat5.desc': 'Your data available on every phone',
    'paywall.feat6.title':'Doctor notes',
    'paywall.feat6.desc': 'Diagnosis and recommendations after every visit',
    'paywall.plan.monthly':  'Monthly',
    'paywall.plan.yearly':   'Yearly',
    'paywall.plan.lifetime': 'Lifetime',
    'paywall.per.monthly':   '/ month',
    'paywall.per.yearly':    '/ year',
    'paywall.per.lifetime':  'one-time',
    'paywall.badge.yearly':  'Save 40%',
    'paywall.badge.popular': 'Most popular',
    'paywall.cta':        'Unlock peace',
    'paywall.cta.loading':'Verifying...',
    'paywall.footer':     'Google Play billing · Cancel anytime',
    'paywall.web_only':   'Premium is available in the Android app. Download Calm Parent on Google Play.',

    // Status card
    'status.free.title':    'Data saved',
    'status.free.message':  'Unlock Premium to see analysis and alerts.',
    'status.empty.title':   'Hi! Start with your first entry',
    'status.empty.message': 'Add temperature, feeding, or diaper — the app will start analyzing.',
    'status.cta_upgrade':   'Unlock analysis & alerts — Premium',

    // Feed tab
    'feed.title':         'Feeding',
    'feed.desc':          'Track breast and bottle feeds',
    'feed.quick.left':    'Left\nbreast',
    'feed.quick.right':   'Right\nbreast',
    'feed.quick.bottle':  'Bottle',
    'feed.stat.count':    'feeds today',
    'feed.stat.bottle':   'ml by bottle',
    'feed.stat.breast':   'breast',
    'feed.stat.ago':      'since last',
    'feed.today':         'Today',
    'feed.empty':         'Use the buttons above to quickly add a feed',
    'feed.add_detail':    '+ Add with details',
    'feed.modal.title':   'New feeding',
    'feed.modal.type':    'Feeding type',
    'feed.modal.amount_ml':'Amount (ml)',
    'feed.modal.amount_min':'Duration (min)',
    'feed.toast.saved':   'Feeding saved',

    // Diaper tab
    'diaper.title':       'Diapers',
    'diaper.desc':        'Monitor your baby\'s diapers',
    'diaper.wet':         'Wet',
    'diaper.dirty':       'Dirty',
    'diaper.both':        'Both',
    'diaper.stat.total':  'diapers today',
    'diaper.stat.wet':    'wet',
    'diaper.stat.dirty':  'dirty',
    'diaper.empty':       'Use the buttons above',
    'diaper.add_note':    '+ Add with note',
    'diaper.modal.title': 'New diaper',
    'diaper.modal.note':  'Note (optional)',
    'diaper.modal.note_ph':'e.g. color, consistency...',
    'diaper.toast.saved': 'Diaper saved',

    // Common
    'common.save':        'Save',
    'common.cancel':      'Cancel',
    'common.close':       'Close',
    'common.delete':      'Delete',
    'common.edit':        'Edit',
    'common.date':        'Date',
    'common.time':        'Time',
    'common.note':        'Note',
    'common.saved':       'Saved',
    'common.today':       'Today',

    // Toast
    'toast.saved':        'Saved',
    'toast.sleep_ended':  'Sleep ended',
    'toast.temp':         'Temperature saved',
    'toast.med':          'Medicine saved',
    'toast.growth':       'Measurement saved',
    'toast.entry':        'Entry saved',

    // Medical
    'med.important':      'Important:',
    'med.disclaimer':     'These doses are guidelines. Always consult your doctor or pharmacist.',
    'med.remind_enable':  'Enable notifications to get an alert when the next dose can be given.',
    'med.remind_btn':     'Enable',
  },
}

// ─── Detekcja i storage ──────────────────────────────────────────────────────

const LS_KEY = 'babylog_locale'

function detectLocale() {
  // 1. localStorage
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved === 'pl' || saved === 'en') return saved
  } catch {}
  // 2. navigator
  if (typeof navigator !== 'undefined') {
    const lang = (navigator.language || 'pl').toLowerCase()
    if (lang.startsWith('pl')) return 'pl'
  }
  // 3. fallback — jeśli nie PL to EN
  return 'en'
}

let _currentLocale = detectLocale()
const _listeners = new Set()

export function getLocale() {
  return _currentLocale
}

export function setLocale(locale) {
  if (locale !== 'pl' && locale !== 'en') return
  _currentLocale = locale
  try { localStorage.setItem(LS_KEY, locale) } catch {}
  _listeners.forEach(fn => fn(locale))
}

/**
 * t(key) — zwraca przetłumaczony string.
 * Jeśli klucza nie ma, zwraca sam klucz (żeby łatwo wyłapać brakujące).
 */
export function t(key) {
  return TRANSLATIONS[_currentLocale]?.[key] ?? TRANSLATIONS.pl[key] ?? key
}

/**
 * useLocale() — hook reaktywny do języka.
 * Powoduje re-render gdy język się zmieni.
 */
export function useLocale() {
  const [locale, setState] = useState(_currentLocale)
  useEffect(() => {
    const listener = (l) => setState(l)
    _listeners.add(listener)
    return () => _listeners.delete(listener)
  }, [])
  return { locale, setLocale, t }
}
