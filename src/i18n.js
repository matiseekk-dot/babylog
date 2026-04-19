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
    'login.guest_note':             'Możesz się zalogować później w Ustawieniach',
    'login.use_without_account': 'Używaj bez konta',
    'login.guest_upgrade':'Zaloguj się, aby zsynchronizować dane',

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
    'paywall.testimonials.title': 'Co mówią rodzice',
    'paywall.testimonials.disclaimer': 'Przykładowe opinie. Po pierwszym launchu — opinie z Google Play.',

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
    'common.deleted':     'Usunięto',
    'tip.label':          'Ciekawostka dnia',

    // Toast
    'toast.saved':        'Zapisano',
    'toast.sleep_ended':  'Sen zakończony',
    'sleep.today_total':  'łącznie dziś',
    'toast.temp':         'Temperatura zapisana',
    'toast.med':          'Lek zapisany',
    'toast.growth':       'Pomiar zapisany',
    'toast.entry':        'Wpis zapisany',

    // Medical
    'med.important':      '⚠️ Ważne — przeczytaj:',
    'med.disclaimer':     'Podane dawki to wartości orientacyjne na podstawie ogólnych wytycznych. Przed każdym podaniem leku skonsultuj się z pediatrą lub farmaceutą. Aplikacja nie zastępuje porady medycznej i nie ponosi odpowiedzialności za decyzje dotyczące leczenia Twojego dziecka.',
    // Dose modal disclaimers
    'dose.modal.warning':          '⚠️ Skonsultuj się z lekarzem przed pierwszym podaniem.',
    'dose.modal.footer':           'Te wartości są orientacyjne. Zawsze weryfikuj dawkę z pediatrą lub farmaceutą, szczególnie gdy dziecko waży mniej niż 5 kg, ma przewlekłe choroby, lub przyjmuje inne leki.',

    // Medical consent (first-run)
    'consent.title':               'Zanim zaczniesz',
    'consent.intro':                'Spokojny Rodzic to narzędzie pomocnicze dla rodziców — nie zastępuje lekarza.',
    'consent.p1':                  'Aplikacja pomaga śledzić stan zdrowia dziecka i sugeruje kiedy skontaktować się z lekarzem, ale nie diagnozuje i nie leczy.',
    'consent.p2':                  'W przypadku alarmujących objawów, wysokiej gorączki lub nagłej zmiany stanu dziecka — zadzwoń do pediatry lub na pogotowie (112).',
    'consent.p3':                  'Kalkulator dawek leków podaje wartości orientacyjne. Zawsze weryfikuj je z lekarzem lub farmaceutą przed pierwszym podaniem.',
    'consent.p4':                  'SkuDev nie ponosi odpowiedzialności za decyzje medyczne podejmowane na podstawie aplikacji.',
    'consent.accept':              'Rozumiem — to nie zastępuje lekarza',
    'consent.emergency_title':     'W sytuacji zagrożenia życia',
    'consent.emergency_text':      'Zadzwoń na 112 lub jedź bezpośrednio do najbliższego szpitala',
    'diaper.note_ph':  'np. kolor, konsystencja...',
    'diet.name_ph':  'np. Mango, Quinoa...',
    'doctor.doctor_ph_short':  'np. Kowalski',
    'doctor.meds_ph':  'np. Amoksycylina 2× dziennie 5 dni',
    'growth.weight_ph':  'np. 6.5',
    'growth.height_ph':  'np. 65',
    'growth.head_ph':  'np. 41',
    'profiles.name_ph':  'np. Zosia',
    'vacc.name_ph':  'np. Meningokoki, Rotawirusy...',
    'meds.custom.name_ph':         'np. Fenistil, Vibovit...',
    'meds.custom.dosage_ph':       'np. 3× dziennie 5 kropli',
    'meds.custom.dose_ph':         'np. 2.5 ml',
    'meds.dosage_ph':  'np. Paracetamol 120mg',
    'meds.dose_ph':  'np. 2 ml',
    'onb.months_ph':  'np. 4',
    // Medicine — weight validation
    'meds.no_weight.title':        'Brakuje wagi dziecka',
    'meds.no_weight.desc':         'Aby wyliczyć bezpieczne dawki leków, podaj aktualną wagę dziecka w Ustawieniach.',
    'meds.no_weight.cta':          'Przejdź do Ustawień',

    // Placeholders
    'temp.note_after_med_ph':      'np. po Paracetamolu',
    'common.optional_ph':          'opcjonalnie...',
    'chart.loading':               'Ładowanie wykresu...',
    // Empty state hero (first-time users)
    'empty_hero.title':            'Witaj w Spokojny Rodzic',
    'empty_hero.subtitle':         'Zacznij od jednej z poniższych funkcji — najważniejszych dla zdrowia dziecka.',
    'empty_hero.temp.title':       'Zmierz temperaturę',
    'empty_hero.temp.desc':        'Najważniejsza wskazówka gdy dziecko jest chore',
    'empty_hero.meds.title':       'Sprawdź bezpieczną dawkę',
    'empty_hero.meds.desc':        'Kalkulator dawek dla Paracetamolu i Ibuprofenu',
    'empty_hero.feed.title':       'Zapisz karmienie',
    'empty_hero.feed.desc':        'Jedno tapnięcie — pełna historia dnia',
    'dose.modal.log_btn':          'Zapisałam podanie {dose}',
    'meds.toast.logged':           '{med} — zapisane',
    'temp.invalid':                'Nieprawidłowa temperatura — wpisz wartość między 30 a 45°C',

    // Age unit labels (if missing)
    'age.unit.years':              'lata',
    'age.unit.months':             'miesiące',
    'onb.years_ph':                '0',
    'onb.weight_ph':  'np. 6.5',
    'temp.note_label':  'Notatka',
    'temp.note_ph':  'np. po kąpieli, kaszel...',
    'sleep.norm_label':  'norma wiekowa',


    'med.remind_enable':  'Włącz powiadomienia, żeby dostać alert gdy będzie można podać kolejną dawkę.',
    'med.remind_btn':     'Włącz',
    // Settings
    'settings.title':         'Ustawienia',
    'settings.child.title':   'Profil dziecka',
    'settings.saved':         'Zapisano zmiany',
    'settings.trial.title':   'Premium trial: {days} dni',
    'settings.trial.desc':    'Korzystasz z pełnej wersji. Kup Premium przed końcem trialu.',
    'settings.trial.cta':     'Kup Premium',
    'settings.export.title':  'Eksport danych',
    'settings.export.desc':   'Pobierz raport PDF z pomiarami, karmieniami i lekami — do pokazania lekarzowi.',
    'settings.export.cta':    'Pobierz raport PDF',
    'settings.export.loading':'Generuję PDF...',
    'settings.export.success':'Raport PDF zapisany',
    'settings.export.error':  'Nie udało się wygenerować PDF',
    'settings.account.title': 'Konto',
    'settings.account.premium':'Premium aktywny',
    'settings.account.free':  'Wersja darmowa',
    'settings.account.guest': 'Używasz bez konta. Zaloguj się, aby zsynchronizować dane.',

    // Crisis detection
    'crisis.watch.title':     'Monitoruj dziecko',
    'crisis.watch.action1':   'Zmierz temperaturę ponownie',
    'crisis.call.title':      'Skonsultuj z pediatrą',
    'crisis.emergency.title': 'Zadzwoń na pogotowie',
    'crisis.emergency.disclaimer': 'W przypadku zagrożenia życia dziecka NATYCHMIAST dzwoń 112 lub udaj się na SOR.',
    'crisis.action.call_doctor':'Zadzwoń do pediatry',
    'crisis.action.call_112':   'Zadzwoń pod 112',
    'crisis.action.what_to_prepare':'Co powiedzieć lekarzowi',

    // Topbar settings
    'topbar.settings':        'Ustawienia',
    // Streak
    'streak.milestone':   '{days} dni z rzędu z apką!',
    'streak.tooltip':     'Seria: {days} dni',

    // Call Doctor Prep
    'prep.title':         'Co powiedzieć lekarzowi',
    'prep.subtitle':      'Gotowe informacje dla {name}',
    'prep.intro':         'Otwórz ten ekran gdy dzwonisz do lekarza. Wszystkie ważne informacje są uporządkowane — wystarczy czytać.',
    'prep.months':        'mies.',
    'prep.at':            'o',
    'prep.yesterday':     'Wczoraj',
    'prep.section.child': 'Dane dziecka',
    'prep.section.temp':  'Temperatura (ostatnie pomiary)',
    'prep.section.meds':  'Podane leki',
    'prep.section.today': 'Dzisiaj',
    'prep.section.mention':'Dodatkowo wspomnij',
    'prep.feeds_today':   'Karmienia: {count}',
    'prep.wet_today':     'Pieluchy mokre: {count}',
    'prep.dirty_today':   'Pieluchy brudne: {count}',
    'prep.mention.1':     'Czy dziecko jest apatyczne, senne, trudno je obudzić',
    'prep.mention.2':     'Czy odmawia jedzenia / picia dłużej niż 6h',
    'prep.mention.3':     'Czy pojawiła się wysypka, zmiana koloru skóry',
    'prep.mention.4':     'Czy ma inne objawy: wymioty, biegunka, kaszel, duszność',
    'prep.free':          'Teleplatforma NFZ — połączenie bezpłatne, 24/7',


    // Common forms
    'common.time':             'Godzina',
    'common.duration':          'Czas trwania',
    'common.fell_asleep':       'Zasnął/-a',
    'common.woke_up':           'Obudził/-a się',
    'common.amount_ml':         'Ilość (ml)',
    'common.amount_min':        'Czas (min)',
    'common.type':              'Typ',
    'common.optional':          '(opcjonalnie)',

    // Child status
    'status.upgrade_cta':       '🔒 Odblokuj analizę i alerty — Premium',

    // Feed tab - additional
    'feed.modal.amount':        'Ilość',
    'feed.modal.min':           'min',

    // Diaper tab - additional

    // Sleep tab
    'sleep.title':              'Sen i drzemki',
    'sleep.desc':               'Śledź czas snu dziecka',
    'sleep.timer_running':      'Trwa pomiar snu...',
    'sleep.timer_idle':         'Naciśnij, aby rozpocząć',
    'sleep.btn.wake':           'Obudził/-a się ☀️',
    'sleep.btn.sleep':          'Zasnął/-a 🌙',
    'sleep.empty':              'Brak zapisanych drzemek',
    'sleep.add_manual':         '+ Dodaj ręcznie',
    'sleep.modal.title':        'Dodaj sen',
    'sleep.modal.type':         'Typ snu',
    'sleep.type.nap':           'Drzemka',
    'sleep.type.night':         'Sen nocny',
    'sleep.premium.quality':    'Ocena jakości snu',

    // Temperature tab
    'temp.title':               'Temperatura',
    'temp.desc':                'Monitoruj gorączkę dziecka',
    'temp.history':             'Historia pomiarów',
    'temp.empty':               'Brak pomiarów temperatury',
    'temp.add':                 '+ Dodaj pomiar',
    'temp.modal.title':         'Nowy pomiar temperatury',
    'temp.modal.value':         'Temperatura (°C)',
    'temp.modal.method':        'Metoda pomiaru',
    'temp.method.rectal':       'Odbytniczo',
    'temp.method.axillary':     'Pod pachą',
    'temp.method.ear':          'W uchu',
    'temp.method.forehead':     'Na czole',
    'temp.premium.analysis':    'Analiza temperatury',
    'temp.chart.rising':        '↑ Rośnie',
    'temp.chart.falling':       '↓ Spada',
    'temp.chart.stable':        '→ Stabilna',
    'temp.chart.subfebrile':    'Podgorączkowanie',
    'temp.chart.fever':         'Gorączka',
    'temp.chart.high':          'Wysoka',
    'temp.chart.no_data':       'Brak pomiarów w ostatnich {hours}h',

    // Meds tab
    'meds.title':               'Leki',
    'meds.desc_with_weight':    'Dawkowanie dla dziecka {weight} kg, {months} mies.',
    'meds.desc_no_weight':      'Podaj wagę w ustawieniach, żeby zobaczyć kalkulator',
    'meds.calc.title':          'Kalkulator dawek — wbudowane',
    'meds.calc.weight_needed':  'Podaj wagę dziecka w ustawieniach, żeby zobaczyć bezpieczne dawki.',
    'meds.calc.open_settings':  'Otwórz ustawienia',
    'meds.below_3mo':           'Poniżej 3. miesiąca',
    'meds.saline_dose':         '3–5 kropli / dziurkę',
    'meds.probiotic_dose':      '5–10 kropli / dobę',
    'meds.dose_btn':             'Dawka',
    'meds.reminder.now':         'możesz podać teraz',
    'meds.reminder.in':          'za',
    'meds.reminder.dose_label':  'Dawka:',
    'meds.reminder.cancel':      'Anuluj przypomnienie',
    'meds.custom.title':         'Własne leki',
    'meds.add_custom':           '+ Dodaj własny lek',
    'meds.add_custom.modal':     'Dodaj własny lek',
    'meds.add_custom.name':      'Nazwa leku',
    'meds.add_custom.dosage':    'Dawkowanie (opcjonalnie)',
    'meds.add_custom.notes':     'Notatki',
    'meds.history':              'Historia podań',
    'meds.history.empty':        'Brak zapisanych podań',
    'meds.add':                  '+ Dodaj podanie',
    'meds.modal.title':          'Podanie leku',
    'meds.modal.drug':           'Lek',
    'meds.modal.dose':           'Dawka',
    'meds.modal.dose_placeholder':'np. 2 ml, 50 mg',
    'meds.other':                'Inny',
    'meds.delete.confirm':       'Usunąć ten wpis?',

    // Growth tab
    'growth.title':              'Wzrost i waga',
    'growth.desc':               'Śledź rozwój fizyczny dziecka',
    'growth.stat.weight':        'kg waga',
    'growth.stat.height':        'cm wzrost',
    'growth.stat.head':          'cm głowa',
    'growth.view.weight':        'Waga',
    'growth.view.height':        'Wzrost',
    'growth.view.head':          'Głowa',
    'growth.history':            'Historia pomiarów',
    'growth.empty':              'Dodaj pierwszy pomiar',
    'growth.head_short':         'głowa',
    'growth.add':                '+ Dodaj pomiar',
    'growth.modal.title':        'Nowy pomiar',
    'growth.modal.date':         'Data pomiaru',
    'growth.modal.weight':       'Waga (kg)',
    'growth.modal.height':       'Wzrost (cm)',
    'growth.modal.head':         'Obwód głowy (cm)',

    // Milestones tab
    'milestones.title':          'Kamienie milowe',
    'milestones.desc':           '{done}/{total} osiągniętych · Własne: {custom}',
    'milestones.filter.upcoming':'Nadchodzące',
    'milestones.filter.done':    'Osiągnięte',
    'milestones.empty':          'Brak kamieni milowych w tej kategorii',
    'milestones.add':            '+ Dodaj własny kamień milowy',
    'milestones.modal.title':    'Nowy kamień milowy',
    'milestones.modal.name':     'Nazwa',
    'milestones.modal.name_ph':  "np. Pierwsze słowo 'mama'",
    'milestones.modal.age':      'Typowy wiek (mies.)',
    'milestones.modal.age_label':'Etykieta wieku',
    'milestones.modal.age_ph':   'np. 10–12 mies.',
    'milestones.typical_age':    'Typowy wiek',

    // Vaccinations tab
    'vacc.title':                'Szczepienia',
    'vacc.desc':                 'Kalendarz {scheme} · {done}/{total} wykonanych · Własne: {custom}',
    'vacc.scheme':               'PSO',
    'vacc.warning':              'To kalendarz poglądowy wg PSO. Szczegółowy harmonogram ustal z lekarzem.',
    'vacc.important':            'Uwaga:',
    'vacc.scheme_header':        'Szczepienia wg PSO',
    'vacc.custom_header':        'Własne / dodatkowe szczepienia',
    'vacc.upcoming':             'Zbliża się',
    'vacc.done':                 'Wykonane',
    'vacc.add':                  '+ Dodaj własne szczepienie',
    'vacc.modal.title':          'Nowe szczepienie',
    'vacc.modal.name':           'Nazwa szczepionki',
    'vacc.modal.when':           'Termin (mies.)',
    'vacc.modal.when_label':     'Etykieta terminu',
    'vacc.modal.when_ph':        'np. 2. miesiąc',
    'vacc.month_suffix':         'miesiąc',

    // Diet tab
    'diet.title':                'Rozszerzanie diety',
    'diet.desc':                 'Wypróbowane: {tried} · Dostępne: {available} · Własne: {custom}',
    'diet.warning':              'Wprowadzaj nowe produkty pojedynczo, co 3–4 dni. Obserwuj reakcje alergiczne.',
    'diet.filter.available':     'Dostępne',
    'diet.filter.upcoming':      'Wkrótce',
    'diet.from_month':           'od {months} mies.',
    'diet.status.tried':         '✓ Próbowało',
    'diet.status.reaction':      '✗ Reakcja alergiczna',
    'diet.status.too_early':     '🔒 Zbyt wcześnie',
    'diet.tip':                  'Stuknij raz → Próbowało ✓  |  Ponownie → Reakcja ✗  |  Jeszcze raz → Usuń',
    'diet.add_custom':           '+ Dodaj własny produkt',
    'diet.modal.title':          'Dodaj produkt',
    'diet.modal.name':           'Nazwa produktu',
    'diet.modal.months':         'Dostępny od (miesięcy)',
    'diet.delete.title':         'Usuń produkt',

    // Diary tab
    'diary.title':               'Dziennik',
    'diary.desc':                'Wspomnienia i ważne chwile',
    'diary.empty':                'Zacznij zapisywać wspomnienia!',
    'diary.add':                 '+ Dodaj wspomnienie',
    'diary.modal.title':         'Nowy wpis',
    'diary.modal.mood':          'Nastrój dziecka',
    'diary.mood.happy':          '😊 Radosny',
    'diary.mood.neutral':        '😐 Neutralny',
    'diary.mood.sad':            '😢 Smutny',
    'diary.mood.sick':           '🤒 Chory',
    'diary.mood.tired':          '😴 Zmęczony',
    'diary.modal.content':       'Treść',
    'diary.modal.content_ph':    'Co się wydarzyło? Jakie osiągnięcia, śmieszne momenty, pierwsze razy...',

    // Doctor notes tab
    'doctor.title':              'Notatki lekarskie',
    'doctor.desc':               'Zapisuj diagnozę i zalecenia po wizycie',
    'doctor.desc.count':         '{count} wizyt zapisanych',
    'doctor.premium.label':      'Notatki z wizyt lekarskich',
    'doctor.premium.intro':      'Po wizycie u lekarza łatwo zapomnieć co powiedział. Premium pozwala zapisać:',
    'doctor.premium.f1':         'Diagnoza i objawy',
    'doctor.premium.f2':         'Zalecenia i leki',
    'doctor.premium.f3':         'Data kontroli',
    'doctor.premium.f4':         'Nazwisko lekarza',
    'doctor.empty':              'Po wizycie u lekarza zapisz tu co powiedział. Nigdy więcej nie zapomnisz o zaleceniach.',
    'doctor.add':                '+ Dodaj notatkę z wizyty',
    'doctor.modal.title':        'Nowa notatka lekarska',
    'doctor.modal.type':         'Typ wizyty',
    'doctor.type.routine':       'Wizyta kontrolna',
    'doctor.type.illness':       'Choroba',
    'doctor.type.vaccination':   'Szczepienie',
    'doctor.type.emergency':     'Izba przyjęć',
    'doctor.type.specialist':    'Specjalista',
    'doctor.modal.date':         'Data wizyty',
    'doctor.modal.doctor':       'Lekarz',
    'doctor.modal.doctor_ph':    'np. dr Nowak',
    'doctor.modal.diagnosis':    'Diagnoza i objawy',
    'doctor.modal.diagnosis_ph': 'Co stwierdził lekarz? Jakie objawy?',
    'doctor.modal.recommendations':'Zalecenia',
    'doctor.modal.recommendations_ph':'Co robić? Jak postępować?',
    'doctor.modal.followup':     'Data kontroli (opcjonalnie)',

    // Profiles
    'profiles.title':            'Profile dzieci',
    'profiles.desc':             'Wybierz aktywne dziecko lub dodaj nowe',
    'profiles.age.months':       '{count} miesięcy',
    'profiles.age.month':        '{count} miesiąc',
    'profiles.age.year':         '{count} rok',
    'profiles.age.years_months': '{years} r. {months} mies.',
    'profiles.add':              '+ Dodaj profil',
    'profiles.add.title':        'Nowy profil dziecka',
    'profiles.edit.title':       'Edytuj profil',
    'profiles.delete.confirm':   'Usunąć ten profil? Stracisz wszystkie dane dziecka.',

    // Defaults
    'default.child_name':        'Moje dziecko',
    // Crisis reasons
    'crisis.reason.very_high':       'Temperatura {temp}°C — bardzo wysoka gorączka',
    'crisis.reason.newborn_emergency':'Niemowlę < 3 mies. z temp. {temp}°C',
    'crisis.reason.newborn_call':    'Niemowlę < 3 mies. z gorączką {temp}°C — skonsultuj z pediatrą',
    'crisis.reason.high_fever':      'Wysoka gorączka {temp}°C',
    'crisis.reason.watch':           'Gorączka {temp}°C — monitoruj co 1-2h',
    'crisis.reason.prolonged':       'Gorączka utrzymuje się > 72h — konieczna konsultacja',
    // Rules engine
    'rule.temp_alert.title':       'Wysoka gorączka',
    'rule.temp_alert.msg':         'Ostatni pomiar: {temp}°C. Podaj lek przeciwgorączkowy i obserwuj dziecko.',
    'rule.temp_critical.title':    'Gorączka krytyczna',
    'rule.temp_critical.msg':      'Temperatura {temp}°C — zadzwoń do lekarza lub jedź na izbę przyjęć.',
    'rule.temp_rising.title':      'Temperatura rośnie',
    'rule.temp_rising.msg':        'Trzy kolejne pomiary: {t1}° → {t2}° → {t3}°C. Tendencja wzrostowa — obserwuj uważnie.',
    'rule.med_not_working.title':  'Lek nie działa',
    'rule.med_not_working.msg':    'Temperatura nie spadła po {med} ({hours}h temu). Skontaktuj się z lekarzem.',
    'rule.feed_time.title':        'Czas na karmienie',
    'rule.feed_time.msg':          'Ostatnie karmienie {hours}h {mins}min temu. Możliwe że dziecko jest głodne.',
    'rule.no_entries.title':       'Gotowy na pierwszy wpis?',
    'rule.no_entries.msg':         'Dodaj karmienie lub sen jednym tapnięciem — aplikacja będzie analizować wzorce.',
    'rule.all_ok.title':           'Wszystko w normie',
    'rule.all_ok.msg':             '{feeds} karmień, {sleeps} drzemek, brak gorączki. Dobra robota!',
    'rule.med_expired.title':      'Czas na kolejną dawkę',
    'rule.med_expired.msg':        '{name} podano {hours}h {mins}m temu — czas działania minął. Możesz podać kolejną dawkę.',
    'rule.sleep_deficit.title':    'Niedobór snu',
    'rule.sleep_deficit.msg':      'Dziś tylko {h}h {m}m snu (norma: {min}–{max}h). Zadbaj o wyciszenie i rytuał zasypiania.',
    'rule.combined.title':         'Zły stan ogólny',
    'rule.combined.msg':           'Gorączka {temp}°C + mało snu + mało karmień — dziecko wymaga natychmiastowej uwagi lekarza.',
    'rule.default.title':          'Wszystko w porządku',
    'rule.default.msg':            'Brak alertów. Kontynuuj regularne logowanie danych.',
    // Interpretations
    'interp.ago.min':              '{min} min temu',
    'interp.ago.hm':               '{h}h {m}m temu',
    'interp.ago.h':                '{h}h temu',
    'interp.temp.rising':          'Temperatura rośnie ↑',
    'interp.temp.falling':         'Temperatura spada ↓',
    'interp.temp.stable':          'Temperatura stabilna →',
    'interp.temp.last':            'Ostatni: {temp}°C',
    'interp.meds.last_dose':       'Ostatnia dawka: {med}',
    'interp.meds.due_now':         'Możliwy czas na kolejną dawkę',
    'interp.meds.due_now_detail':  '{name} — podano {ago}',
    'interp.meds.due_soon':        'Kolejna dawka możliwa wkrótce',
    'interp.meds.due_soon_detail': '{name} podano {ago} · za ~{min} min',
    'interp.meds.too_early_detail':'{ago} · kolejna za ~{min} min',
    'interp.sleep.none':           'Brak snu dziś',
    'interp.sleep.none_detail':    'Norma: {min}–{max}h',
    'interp.sleep.below':          'Poniżej normy',
    'interp.sleep.below_detail':   '{total} z {min}–{max}h · brakuje ~{missing}',
    'interp.sleep.slightly_below': 'Nieco poniżej normy',
    'interp.sleep.above':          'Powyżej normy',
    'interp.sleep.above_detail':   '{total} — norma to {min}–{max}h',
    'interp.sleep.in_norm':        'W normie',
    'interp.sleep.of_norm':        '{total} z {min}–{max}h',

    // Age labels
    'age.newborn':                 'Noworodek',
    'age.years':                   '{count} lata',

    // Temperature category labels
    'temp.label.hypothermia':      'Podgorączkowanie',
    'temp.label.normal':           'Prawidłowa',
    'temp.label.fever':            'Gorączka',
    'temp.label.high_fever':       'Wysoka gorączka',

    // Med reminder notification
    'reminder.med.title':          'Czas na kolejną dawkę 💊',
    'reminder.med.body':           'Możesz podać {med}{dose} — minęło {hours}h od ostatniej dawki.',

    // Delete confirmations
    'meds.custom.delete_title':    'Usuń lek własny',
    'milestones.delete_title':     'Usuń kamień milowy',
    'vacc.delete_title':           'Usuń szczepienie',
    'meds.add_custom.notes_ph':    'np. Przed posiłkiem...',
    // Feed types (dropdown labels — Polish values remain as data)
    'feed.type.left':              'Pierś lewa',
    'feed.type.right':             'Pierś prawa',
    'feed.type.bottle':            'Butelka',
    'feed.type.pumped':            'Odciągnięte mleko',

    // Medicine names (dropdown labels)
    'med.name.paracetamol':        'Paracetamol',
    'med.name.ibuprofen':          'Ibuprofen',
    'med.name.saline':             'Sól fizjologiczna',
    'med.name.probiotic':          'Probiotyk',

    // Doctor visit types
    'doctor.visit.pediatrician':   'Pediatra',
    'doctor.visit.emergency':      'Pogotowie',
    'doctor.visit.telehealth':     'Teleporada',
    'doctor.visit.specialist':     'Specjalista',
    'doctor.visit.routine':        'Wizyta kontrolna',

    // Dose info - content bullets
    'dose.paracetamol.single':     'Dawka jednorazowa: {dose} mg (15 mg/kg)',
    'dose.paracetamol.susp120':    'Zawiesina 120 mg/5 ml → {ml} ml',
    'dose.paracetamol.susp240':    'Zawiesina 240 mg/5 ml → {ml} ml',
    'dose.paracetamol.max':        'Maks. dobowa: {max} mg (co 4–6h, maks. 4× dziennie)',
    'dose.ibuprofen.single':       'Dawka jednorazowa: {dose} mg (10 mg/kg)',
    'dose.ibuprofen.susp':         'Zawiesina 100 mg/5 ml → {ml} ml',
    'dose.ibuprofen.max':          'Maks. dobowa: {max} mg (co 6–8h, maks. 3× dziennie)',
    'dose.ibuprofen.min_age':      'Stosować od 3. miesiąca życia',
    'dose.ibuprofen.not_for_infants':'Ibuprofen nie jest zalecany poniżej 3. miesiąca życia.',
    'dose.for_weight':             'Dla wagi: {kg} kg',
    'dose.saline.1':               '3–5 kropli do każdej dziurki nosa',
    'dose.saline.2':               'Podawać 3–4× dziennie',
    'dose.saline.3':               'Wkraplać w pozycji leżącej z lekko odchyloną głową',
    'dose.saline.4':               'Można stosować od urodzenia',
    'dose.probiotic.1':            '1× dziennie, 5–10 kropli lub 1 saszetka (wg ulotki)',
    'dose.probiotic.2':            'Stosować min. 2h po antybiotyku',
    'dose.probiotic.3':            'Można mieszać z mlekiem lub papką',
    'meds.custom.delete_msg':       'Czy na pewno chcesz usunąć ten lek z kalkulatora?',
    // Status bar severity labels (BabyLog UI)
    'status.ok':                   'OK',
    'status.info':                 'INFO',
    'status.warning':              'UWAGA',
    'status.alert':                'ALERT',
    'status.critical':             'PILNE',

    // Temp chart
    'tempchart.last':              'Ostatnie {hours}h',

    'milestones.delete_msg':        'Czy na pewno chcesz usunąć ten kamień milowy?',
    'vacc.delete_msg':              'Czy na pewno chcesz usunąć to szczepienie?',






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
    'login.guest_note':             'You can sign in later from Settings',
    'login.use_without_account': 'Use without account',
    'login.guest_upgrade':'Sign in to sync your data',

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
    'paywall.testimonials.title': 'What parents say',
    'paywall.testimonials.disclaimer': 'Example reviews. After launch — real reviews from Google Play.',

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
    'common.deleted':     'Deleted',
    'tip.label':          'Daily tip',

    // Toast
    'toast.saved':        'Saved',
    'toast.sleep_ended':  'Sleep ended',
    'sleep.today_total':  'total today',
    'toast.temp':         'Temperature saved',
    'toast.med':          'Medicine saved',
    'toast.growth':       'Measurement saved',
    'toast.entry':        'Entry saved',

    // Medical
    'med.important':      '⚠️ Important — please read:',
    'med.disclaimer':     'These doses are reference values based on general guidelines. Always consult your pediatrician or pharmacist before giving any medication. This app does not replace medical advice and bears no responsibility for treatment decisions regarding your child.',
    // Dose modal disclaimers
    'dose.modal.warning':          '⚠️ Consult your doctor before the first dose.',
    'dose.modal.footer':           "These values are guidelines only. Always verify doses with your pediatrician or pharmacist, especially if your child weighs less than 5 kg, has chronic conditions, or takes other medications.",

    // Medical consent (first-run)
    'consent.title':               'Before you start',
    'consent.intro':               'Calm Parent is a support tool for parents — it does not replace your doctor.',
    'consent.p1':                  "The app helps you track your baby's health and suggests when to contact a doctor, but it does not diagnose or treat.",
    'consent.p2':                  "In case of concerning symptoms, high fever, or sudden changes in your baby's condition — call your pediatrician or emergency services (112 in EU / 911 in US).",
    'consent.p3':                  'The medicine dose calculator provides reference values only. Always verify doses with your doctor or pharmacist before the first administration.',
    'consent.p4':                  'SkuDev bears no responsibility for medical decisions made based on this app.',
    'consent.accept':              'I understand — this does not replace a doctor',
    'consent.emergency_title':     'In a life-threatening emergency',
    'consent.emergency_text':      'Call 112 (EU) / 911 (US) or go directly to the nearest hospital.',
    'diaper.note_ph':  'e.g. color, consistency...',
    'diet.name_ph':  'e.g. Mango, Quinoa...',
    'doctor.doctor_ph_short':  'e.g. Smith',
    'doctor.meds_ph':  'e.g. Amoxicillin 2× daily for 5 days',
    'growth.weight_ph':  'e.g. 6.5',
    'growth.height_ph':  'e.g. 65',
    'growth.head_ph':  'e.g. 41',
    'profiles.name_ph':  'e.g. Emma',
    'vacc.name_ph':  'e.g. Meningococcal, Rotavirus...',
    'meds.custom.name_ph':         'e.g. Fenistil, Vibovit...',
    'meds.custom.dosage_ph':       'e.g. 3× daily 5 drops',
    'meds.custom.dose_ph':         'e.g. 2.5 ml',
    'meds.dosage_ph':  'e.g. Paracetamol 120mg',
    'meds.dose_ph':  'e.g. 2 ml',
    'onb.months_ph':  'e.g. 4',
    // Medicine — weight validation
    'meds.no_weight.title':        "Baby's weight is missing",
    'meds.no_weight.desc':         "To calculate safe medicine doses, please enter your baby's current weight in Settings.",
    'meds.no_weight.cta':          'Go to Settings',

    // Placeholders
    'temp.note_after_med_ph':      'e.g. after paracetamol',
    'common.optional_ph':          'optional...',
    'chart.loading':               'Loading chart...',
    // Empty state hero (first-time users)
    'empty_hero.title':            'Welcome to Calm Parent',
    'empty_hero.subtitle':         "Start with one of the features below — they matter most for your baby's health.",
    'empty_hero.temp.title':       'Take temperature',
    'empty_hero.temp.desc':        'The most important signal when your baby is sick',
    'empty_hero.meds.title':       'Check a safe dose',
    'empty_hero.meds.desc':        'Dose calculator for paracetamol and ibuprofen',
    'empty_hero.feed.title':       'Log a feeding',
    'empty_hero.feed.desc':        "One tap — full day's history",
    'dose.modal.log_btn':          'I gave this dose ({dose})',
    'meds.toast.logged':           '{med} — logged',
    'temp.invalid':                'Invalid temperature — enter a value between 30 and 45°C',

    // Age unit labels (if missing)
    'age.unit.years':              'years',
    'age.unit.months':             'months',
    'onb.years_ph':                '0',
    'onb.weight_ph':  'e.g. 6.5',
    'temp.note_label':  'Note',
    'temp.note_ph':  'e.g. after bath, coughing...',
    'sleep.norm_label':  'age norm',


    'med.remind_enable':  'Enable notifications to get an alert when the next dose can be given.',
    'med.remind_btn':     'Enable',
    // Settings
    'settings.title':         'Settings',
    'settings.child.title':   'Child profile',
    'settings.saved':         'Changes saved',
    'settings.trial.title':   'Premium trial: {days} days left',
    'settings.trial.desc':    'You have full access. Buy Premium before trial ends.',
    'settings.trial.cta':     'Buy Premium',
    'settings.export.title':  'Export data',
    'settings.export.desc':   'Download a PDF report with measurements, feeds, and meds — for your doctor.',
    'settings.export.cta':    'Download PDF report',
    'settings.export.loading':'Generating PDF...',
    'settings.export.success':'PDF report saved',
    'settings.export.error':  'Failed to generate PDF',
    'settings.account.title': 'Account',
    'settings.account.premium':'Premium active',
    'settings.account.free':  'Free version',
    'settings.account.guest': 'Using without account. Sign in to sync your data.',

    // Crisis detection
    'crisis.watch.title':     'Watch your baby',
    'crisis.watch.action1':   'Take temperature again',
    'crisis.call.title':      'Call your pediatrician',
    'crisis.emergency.title': 'Call emergency services',
    'crisis.emergency.disclaimer': 'In case of life-threatening emergency, call 112 (EU) / 911 (US) IMMEDIATELY or go to ER.',
    'crisis.action.call_doctor':'Call pediatrician',
    'crisis.action.call_112':   'Call 112',
    'crisis.action.what_to_prepare':'What to tell the doctor',

    // Topbar settings
    'topbar.settings':        'Settings',
    // Streak
    'streak.milestone':   '{days} day streak!',
    'streak.tooltip':     '{days} day streak',

    // Call Doctor Prep
    'prep.title':         'What to tell the doctor',
    'prep.subtitle':      'Info ready for {name}',
    'prep.intro':         'Open this screen when calling your doctor. All important info is organized — just read it out.',
    'prep.months':        'months',
    'prep.at':            'at',
    'prep.yesterday':     'Yesterday',
    'prep.section.child': 'Child info',
    'prep.section.temp':  'Temperature (recent)',
    'prep.section.meds':  'Medications given',
    'prep.section.today': 'Today',
    'prep.section.mention':'Also mention',
    'prep.feeds_today':   'Feeds: {count}',
    'prep.wet_today':     'Wet diapers: {count}',
    'prep.dirty_today':   'Dirty diapers: {count}',
    'prep.mention.1':     'If baby is lethargic, hard to wake',
    'prep.mention.2':     'If refusing food/drink for more than 6h',
    'prep.mention.3':     'If rash or skin color changes appeared',
    'prep.mention.4':     'Other symptoms: vomiting, diarrhea, cough, breathing difficulty',
    'prep.free':          'Free medical hotline — 24/7',


    // Common forms
    'common.time':             'Time',
    'common.duration':          'Duration',
    'common.fell_asleep':       'Fell asleep',
    'common.woke_up':           'Woke up',
    'common.amount_ml':         'Amount (ml)',
    'common.amount_min':        'Duration (min)',
    'common.type':              'Type',
    'common.optional':          '(optional)',

    // Child status
    'status.upgrade_cta':       '🔒 Unlock analysis & alerts — Premium',

    // Feed tab - additional
    'feed.modal.amount':        'Amount',
    'feed.modal.min':           'min',

    // Sleep tab
    'sleep.title':              'Sleep & naps',
    'sleep.desc':               "Track your baby's sleep",
    'sleep.timer_running':      'Tracking sleep...',
    'sleep.timer_idle':         'Tap to start',
    'sleep.btn.wake':           'Woke up ☀️',
    'sleep.btn.sleep':          'Fell asleep 🌙',
    'sleep.empty':              'No sleep sessions yet',
    'sleep.add_manual':         '+ Add manually',
    'sleep.modal.title':        'Add sleep',
    'sleep.modal.type':         'Sleep type',
    'sleep.type.nap':           'Nap',
    'sleep.type.night':         'Night sleep',
    'sleep.premium.quality':    'Sleep quality rating',

    // Temperature tab
    'temp.title':               'Temperature',
    'temp.desc':                "Monitor your baby's fever",
    'temp.history':             'Measurement history',
    'temp.empty':               'No temperature readings yet',
    'temp.add':                 '+ Add reading',
    'temp.modal.title':         'New temperature reading',
    'temp.modal.value':         'Temperature (°C)',
    'temp.modal.method':        'Measurement method',
    'temp.method.rectal':       'Rectal',
    'temp.method.axillary':     'Underarm',
    'temp.method.ear':          'Ear',
    'temp.method.forehead':     'Forehead',
    'temp.premium.analysis':    'Temperature analysis',
    'temp.chart.rising':        '↑ Rising',
    'temp.chart.falling':       '↓ Falling',
    'temp.chart.stable':        '→ Stable',
    'temp.chart.subfebrile':    'Low-grade',
    'temp.chart.fever':         'Fever',
    'temp.chart.high':          'High',
    'temp.chart.no_data':       'No readings in last {hours}h',

    // Meds tab
    'meds.title':               'Medicine',
    'meds.desc_with_weight':    'Dosing for a {weight} kg, {months}-month-old child',
    'meds.desc_no_weight':      'Set weight in Settings to see the dose calculator',
    'meds.calc.title':          'Dose calculator — built-in',
    'meds.calc.weight_needed':  "Set your baby's weight in Settings to see safe doses.",
    'meds.calc.open_settings':  'Open Settings',
    'meds.below_3mo':           'Under 3 months',
    'meds.saline_dose':         '3–5 drops / nostril',
    'meds.probiotic_dose':      '5–10 drops / day',
    'meds.dose_btn':             'Dose',
    'meds.reminder.now':         'can be given now',
    'meds.reminder.in':          'in',
    'meds.reminder.dose_label':  'Dose:',
    'meds.reminder.cancel':      'Cancel reminder',
    'meds.custom.title':         'Custom meds',
    'meds.add_custom':           '+ Add custom medicine',
    'meds.add_custom.modal':     'Add custom medicine',
    'meds.add_custom.name':      'Medicine name',
    'meds.add_custom.dosage':    'Dosage (optional)',
    'meds.add_custom.notes':     'Notes',
    'meds.history':              'Dosing history',
    'meds.history.empty':        'No doses recorded yet',
    'meds.add':                  '+ Add dose',
    'meds.modal.title':          'New medicine dose',
    'meds.modal.drug':           'Medicine',
    'meds.modal.dose':           'Dose',
    'meds.modal.dose_placeholder':'e.g. 2 ml, 50 mg',
    'meds.other':                'Other',
    'meds.delete.confirm':       'Delete this entry?',

    // Growth tab
    'growth.title':              'Growth',
    'growth.desc':               "Track your baby's physical development",
    'growth.stat.weight':        'kg weight',
    'growth.stat.height':        'cm height',
    'growth.stat.head':          'cm head',
    'growth.view.weight':        'Weight',
    'growth.view.height':        'Height',
    'growth.view.head':          'Head',
    'growth.history':            'Measurement history',
    'growth.empty':              'Add your first measurement',
    'growth.head_short':         'head',
    'growth.add':                '+ Add measurement',
    'growth.modal.title':        'New measurement',
    'growth.modal.date':         'Measurement date',
    'growth.modal.weight':       'Weight (kg)',
    'growth.modal.height':       'Height (cm)',
    'growth.modal.head':         'Head circumference (cm)',

    // Milestones tab
    'milestones.title':          'Milestones',
    'milestones.desc':           '{done}/{total} achieved · Custom: {custom}',
    'milestones.filter.upcoming':'Upcoming',
    'milestones.filter.done':    'Achieved',
    'milestones.empty':          'No milestones in this category',
    'milestones.add':            '+ Add custom milestone',
    'milestones.modal.title':    'New milestone',
    'milestones.modal.name':     'Name',
    'milestones.modal.name_ph':  'e.g. First word "mama"',
    'milestones.modal.age':      'Typical age (months)',
    'milestones.modal.age_label':'Age label',
    'milestones.modal.age_ph':   'e.g. 10–12 mo.',
    'milestones.typical_age':    'Typical age',

    // Vaccinations tab
    'vacc.title':                'Vaccinations',
    'vacc.desc':                 '{scheme} schedule · {done}/{total} done · Custom: {custom}',
    'vacc.scheme':               'PSO',
    'vacc.warning':              "This is a reference schedule based on Poland's PSO. Confirm your specific schedule with your doctor.",
    'vacc.important':            'Note:',
    'vacc.scheme_header':        'Vaccinations per PSO',
    'vacc.custom_header':        'Custom / additional vaccinations',
    'vacc.upcoming':             'Upcoming',
    'vacc.done':                 'Done',
    'vacc.add':                  '+ Add custom vaccination',
    'vacc.modal.title':          'New vaccination',
    'vacc.modal.name':           'Vaccine name',
    'vacc.modal.when':           'Due (months)',
    'vacc.modal.when_label':     'Schedule label',
    'vacc.modal.when_ph':        'e.g. 2 months',
    'vacc.month_suffix':         'month',

    // Diet tab
    'diet.title':                'Solids introduction',
    'diet.desc':                 'Tried: {tried} · Available: {available} · Custom: {custom}',
    'diet.warning':              'Introduce new foods one at a time, every 3-4 days. Watch for allergic reactions.',
    'diet.filter.available':     'Available',
    'diet.filter.upcoming':      'Upcoming',
    'diet.from_month':           'from {months} mo.',
    'diet.status.tried':         '✓ Tried',
    'diet.status.reaction':      '✗ Allergic reaction',
    'diet.status.too_early':     '🔒 Too early',
    'diet.tip':                  'Tap once → Tried ✓  |  Again → Reaction ✗  |  Third time → Remove',
    'diet.add_custom':           '+ Add custom food',
    'diet.modal.title':          'Add food',
    'diet.modal.name':           'Food name',
    'diet.modal.months':         'Available from (months)',
    'diet.delete.title':         'Delete food',

    // Diary tab
    'diary.title':               'Diary',
    'diary.desc':                'Memories and important moments',
    'diary.empty':               'Start recording memories!',
    'diary.add':                 '+ Add memory',
    'diary.modal.title':         'New entry',
    'diary.modal.mood':          "Baby's mood",
    'diary.mood.happy':          '😊 Happy',
    'diary.mood.neutral':        '😐 Neutral',
    'diary.mood.sad':            '😢 Sad',
    'diary.mood.sick':           '🤒 Sick',
    'diary.mood.tired':          '😴 Tired',
    'diary.modal.content':       'Content',
    'diary.modal.content_ph':    'What happened? Achievements, funny moments, firsts...',

    // Doctor notes tab
    'doctor.title':              'Doctor notes',
    'doctor.desc':               'Save diagnosis and recommendations after each visit',
    'doctor.desc.count':         '{count} visits recorded',
    'doctor.premium.label':      'Doctor visit notes',
    'doctor.premium.intro':      "It's easy to forget what the doctor said. Premium lets you save:",
    'doctor.premium.f1':         'Diagnosis and symptoms',
    'doctor.premium.f2':         'Recommendations and medications',
    'doctor.premium.f3':         'Follow-up date',
    'doctor.premium.f4':         "Doctor's name",
    'doctor.empty':              "Save what your doctor said after each visit. You'll never forget the recommendations.",
    'doctor.add':                '+ Add visit note',
    'doctor.modal.title':        'New doctor note',
    'doctor.modal.type':         'Visit type',
    'doctor.type.routine':       'Routine check-up',
    'doctor.type.illness':       'Illness',
    'doctor.type.vaccination':   'Vaccination',
    'doctor.type.emergency':     'Emergency room',
    'doctor.type.specialist':    'Specialist',
    'doctor.modal.date':         'Visit date',
    'doctor.modal.doctor':       'Doctor',
    'doctor.modal.doctor_ph':    'e.g. Dr. Smith',
    'doctor.modal.diagnosis':    'Diagnosis and symptoms',
    'doctor.modal.diagnosis_ph': 'What did the doctor say? What symptoms?',
    'doctor.modal.recommendations':'Recommendations',
    'doctor.modal.recommendations_ph':'What to do? How to treat?',
    'doctor.modal.followup':     'Follow-up date (optional)',

    // Profiles
    'profiles.title':            'Children profiles',
    'profiles.desc':             'Select active child or add new',
    'profiles.age.months':       '{count} months',
    'profiles.age.month':        '{count} month',
    'profiles.age.year':         '{count} year',
    'profiles.age.years_months': '{years}y {months}mo',
    'profiles.add':              '+ Add profile',
    'profiles.add.title':        'New child profile',
    'profiles.edit.title':       'Edit profile',
    'profiles.delete.confirm':   'Delete this profile? You will lose all data for this child.',

    // Defaults
    'default.child_name':        'My baby',
    // Crisis reasons
    'crisis.reason.very_high':       'Temperature {temp}°C — very high fever',
    'crisis.reason.newborn_emergency':'Infant < 3 mo with {temp}°C',
    'crisis.reason.newborn_call':    'Infant < 3 mo with fever {temp}°C — consult pediatrician',
    'crisis.reason.high_fever':      'High fever {temp}°C',
    'crisis.reason.watch':           'Fever {temp}°C — monitor every 1-2h',
    'crisis.reason.prolonged':       'Fever lasting > 72h — consultation needed',
    // Rules engine
    'rule.temp_alert.title':       'High fever',
    'rule.temp_alert.msg':         'Last reading: {temp}°C. Give fever-reducing medicine and monitor closely.',
    'rule.temp_critical.title':    'Critical fever',
    'rule.temp_critical.msg':      'Temperature {temp}°C — call the doctor or go to the ER.',
    'rule.temp_rising.title':      'Temperature rising',
    'rule.temp_rising.msg':        'Three consecutive readings: {t1}° → {t2}° → {t3}°C. Upward trend — monitor carefully.',
    'rule.med_not_working.title':  'Medicine not working',
    'rule.med_not_working.msg':    'Temperature did not drop after {med} ({hours}h ago). Contact your doctor.',
    'rule.feed_time.title':        'Feeding time',
    'rule.feed_time.msg':          'Last feed was {hours}h {mins}min ago. Baby may be hungry.',
    'rule.no_entries.title':       'Ready for your first entry?',
    'rule.no_entries.msg':         'Add a feeding or sleep with one tap — the app will analyze patterns.',
    'rule.all_ok.title':           'All good',
    'rule.all_ok.msg':             '{feeds} feeds, {sleeps} naps, no fever. Good job!',
    'rule.med_expired.title':      'Next dose available',
    'rule.med_expired.msg':        '{name} was given {hours}h {mins}m ago — duration has passed. You can give the next dose.',
    'rule.sleep_deficit.title':    'Sleep deficit',
    'rule.sleep_deficit.msg':      "Only {h}h {m}m of sleep today (norm: {min}–{max}h). Create a calm bedtime routine.",
    'rule.combined.title':         'Concerning combination',
    'rule.combined.msg':           'Fever {temp}°C + little sleep + few feedings — your baby needs immediate medical attention.',
    'rule.default.title':          'All good',
    'rule.default.msg':            'No alerts. Keep logging data regularly.',
    // Interpretations
    'interp.ago.min':              '{min} min ago',
    'interp.ago.hm':               '{h}h {m}m ago',
    'interp.ago.h':                '{h}h ago',
    'interp.temp.rising':          'Temperature rising ↑',
    'interp.temp.falling':         'Temperature falling ↓',
    'interp.temp.stable':          'Temperature stable →',
    'interp.temp.last':            'Last: {temp}°C',
    'interp.meds.last_dose':       'Last dose: {med}',
    'interp.meds.due_now':         'Next dose available now',
    'interp.meds.due_now_detail':  '{name} — given {ago}',
    'interp.meds.due_soon':        'Next dose soon',
    'interp.meds.due_soon_detail': '{name} given {ago} · in ~{min} min',
    'interp.meds.too_early_detail':'{ago} · next in ~{min} min',
    'interp.sleep.none':           'No sleep logged today',
    'interp.sleep.none_detail':    'Norm: {min}–{max}h',
    'interp.sleep.below':          'Below norm',
    'interp.sleep.below_detail':   '{total} of {min}–{max}h · missing ~{missing}',
    'interp.sleep.slightly_below': 'Slightly below norm',
    'interp.sleep.above':          'Above norm',
    'interp.sleep.above_detail':   '{total} — norm is {min}–{max}h',
    'interp.sleep.in_norm':        'Within norm',
    'interp.sleep.of_norm':        '{total} of {min}–{max}h',

    // Age labels
    'age.newborn':                 'Newborn',
    'age.years':                   '{count} years',

    // Temperature category labels
    'temp.label.hypothermia':      'Low temp',
    'temp.label.normal':           'Normal',
    'temp.label.fever':            'Fever',
    'temp.label.high_fever':       'High fever',

    // Med reminder notification
    'reminder.med.title':          'Next dose available 💊',
    'reminder.med.body':           'You can give {med}{dose} — {hours}h since last dose.',

    // Delete confirmations
    'meds.custom.delete_title':    'Delete custom medicine',
    'milestones.delete_title':     'Delete milestone',
    'vacc.delete_title':           'Delete vaccination',
    'meds.add_custom.notes_ph':    'e.g. Before meal...',
    // Feed types (dropdown labels)
    'feed.type.left':              'Left breast',
    'feed.type.right':             'Right breast',
    'feed.type.bottle':            'Bottle',
    'feed.type.pumped':            'Pumped milk',

    // Medicine names
    'med.name.paracetamol':        'Paracetamol',
    'med.name.ibuprofen':          'Ibuprofen',
    'med.name.saline':             'Saline drops',
    'med.name.probiotic':          'Probiotic',

    // Doctor visit types
    'doctor.visit.pediatrician':   'Pediatrician',
    'doctor.visit.emergency':      'Emergency',
    'doctor.visit.telehealth':     'Telehealth',
    'doctor.visit.specialist':     'Specialist',
    'doctor.visit.routine':        'Routine check-up',

    // Dose info - content bullets
    'dose.paracetamol.single':     'Single dose: {dose} mg (15 mg/kg)',
    'dose.paracetamol.susp120':    'Suspension 120 mg/5 ml → {ml} ml',
    'dose.paracetamol.susp240':    'Suspension 240 mg/5 ml → {ml} ml',
    'dose.paracetamol.max':        'Max daily: {max} mg (every 4–6h, max 4×/day)',
    'dose.ibuprofen.single':       'Single dose: {dose} mg (10 mg/kg)',
    'dose.ibuprofen.susp':         'Suspension 100 mg/5 ml → {ml} ml',
    'dose.ibuprofen.max':          'Max daily: {max} mg (every 6–8h, max 3×/day)',
    'dose.ibuprofen.min_age':      'Only from 3 months of age',
    'dose.ibuprofen.not_for_infants':'Ibuprofen is not recommended under 3 months of age.',
    'dose.for_weight':             'For weight: {kg} kg',
    'dose.saline.1':               '3–5 drops in each nostril',
    'dose.saline.2':               'Apply 3–4× per day',
    'dose.saline.3':               'Apply lying down with head slightly tilted back',
    'dose.saline.4':               'Safe from birth',
    'dose.probiotic.1':            '1× daily, 5–10 drops or 1 sachet (per leaflet)',
    'dose.probiotic.2':            'Apply at least 2h after antibiotic',
    'dose.probiotic.3':            'Can be mixed with milk or puree',
    'meds.custom.delete_msg':       'Are you sure you want to delete this medicine from the calculator?',
    // Status bar severity labels
    'status.ok':                   'OK',
    'status.info':                 'INFO',
    'status.warning':              'WARNING',
    'status.alert':                'ALERT',
    'status.critical':             'URGENT',

    // Temp chart
    'tempchart.last':              'Last {hours}h',

    'milestones.delete_msg':        'Are you sure you want to delete this milestone?',
    'vacc.delete_msg':              'Are you sure you want to delete this vaccination?',






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
export function t(key, params) {
  let str = TRANSLATIONS[_currentLocale]?.[key] ?? TRANSLATIONS.pl[key] ?? key
  if (params) {
    Object.keys(params).forEach(p => {
      str = str.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p])
    })
  }
  return str
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
