import { t } from '../i18n'
import { todayDate } from '../utils/helpers'

/**
 * rulesEngine.js — v2.10.3 MDR EXIT REFACTOR
 *
 * GŁÓWNA ZMIANA vs v2.10.2:
 *   Engine NIE generuje już personalized clinical assessments z statusami
 *   severity (critical/alert/warning). Zamiast tego zwraca neutralne
 *   observations w jednym poziomie (kategoria 'observation').
 *
 * Dlaczego: MDR Rule 11 + MDCG 2019-11 klasyfikują software które
 *   (1) bierze personal health data + (2) generuje patient-specific output
 *   wpływający na decyzje medyczne — jako MDSW Class IIa minimum.
 *
 *   Po tym refactorze apka pokazuje:
 *   - Pomiary użytkownika (raw data, journal)
 *   - Neutralne observation labels ("ostatnie karmienie 5h temu")
 *   - Statyczne tabele referencyjne PTP/AAP w osobnym widoku (ReferenceLibrary)
 *
 *   Apka NIE generuje:
 *   - Severity classification (critical/alert/warning)
 *   - Active alerts ("twoje dziecko wymaga pilnej oceny")
 *   - Personalizowanych clinical recommendations
 *
 * Co znika z engine:
 *   - temp_infant_emergency, temp_extreme, temp_critical, temp_alert,
 *     temp_young_infant, combined_critical, no_entries_today, all_ok
 *   - status hierarchy (STATUS_RANK)
 *
 * Co zostaje (jako neutralne observations):
 *   - temp_rising — fact obserwacyjny (3 kolejne pomiary rosną)
 *   - feed_time — fakt: ostatnie karmienie X godzin temu
 *   - sleep_norm_info — pasywna info: norma snu wg wieku to X-Y godzin
 *
 * Co zostaje (jako referencja, nie status):
 *   - med_too_soon, med_expired, med_daily_limit — neutralne timer-based info
 *     bez "alert" / "critical" statusu
 *   - med_not_working — usunięty (to jest clinical assessment efektywności leku)
 *
 * Public API:
 *   evaluateRules(ctx) → { observations: Observation[] }
 *   getSectionObservations(observations, section) → Observation[]
 *
 * Observation:
 *   { id, section, type, title, message, source }
 *
 *   type — kategoria neutralna ('info' lub 'reference'). NIE severity.
 *   - 'info'      — neutralna informacja o danych usera (timer, fakt z timeline)
 *   - 'reference' — pasywne wskazanie na tabelę referencyjną (link do ReferenceLibrary)
 *
 * Brak importów React. Brak efektów ubocznych.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function minutesSince(timeStr, dateStr) {
  if (!timeStr) return Infinity
  const now = new Date()
  const d = dateStr || todayStr()
  const ref = new Date(d + 'T00:00:00')
  const [h, m] = timeStr.split(':').map(Number)
  ref.setHours(h, m, 0, 0)
  return Math.max(0, Math.floor((now - ref) / 60000))
}

function todayStr() {
  return todayDate()
}

function todayLogs(logs) {
  const today = todayStr()
  return (logs || [])
    .filter(l => l.date === today)
    .sort((a, b) => b.time.localeCompare(a.time))
}

function lastOf(logs) {
  return todayLogs(logs)[0] || null
}

function lastMedMatching(medLogs, fragment) {
  return (medLogs || [])
    .filter(l => l.med?.toLowerCase().includes(fragment.toLowerCase()))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0] || null
}

// ─── Reguły — wszystkie w kategorii 'info' lub 'reference', BEZ severity ─────

const RULES = [

  // ── Temp rising — neutralna obserwacja trendu (nie ocena) ─────────────────
  // Pokazuje fact: "trzy kolejne pomiary rosną". Bez wniosków klinicznych.
  // User sam ocenia czy zwrócić uwagę.
  {
    id: 'temp_rising',
    section: 'temp',
    check({ tempLogs }) {
      const sorted = [...(tempLogs || [])]
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      if (sorted.length < 3) return null

      const last3 = sorted.slice(-3)
      const isRising = last3[0].temp < last3[1].temp && last3[1].temp < last3[2].temp
      if (!isRising) return null

      const [t1, t2, t3] = last3.map(l => Number(l.temp).toFixed(1))
      return {
        type: 'info',
        title: t('obs.temp_rising.title'),
        message: t('obs.temp_rising.msg', { t1, t2, t3 }),
        source: 'rule.source.observation',
      }
    },
  },

  // v2.10.5b: rule temp_reference_available USUNIĘTA. Powód:
  //   - Generowała observation w TempTab z action: 'open_reference_temp'
  //     które AlertBanner renderował jako tekst guzika "open reference temp"
  //     (action powinno być labelem, nie identifierem)
  //   - Redundancja: link do ReferenceLibrary jest już w TodaySummaryCard
  //     i w More tab → "Wytyczne PTP/AAP". Trzecie miejsce = spam.
  //   - User feedback: "po co powtarzać, zostawmy tylko te wytyczne"

  // ── Feed time — neutralny fakt: ostatnie karmienie X godzin temu ──────────
  // Pasywna informacja, nie ostrzeżenie. Bez wskazania "powinieneś nakarmić".
  {
    id: 'feed_time',
    section: 'feed',
    check({ feedLogs, sleepLogs, ageMonths }) {
      const last = lastOf(feedLogs)
      if (!last) return null

      // Dziecko śpi → nie pokazuj
      const activeSleep = (sleepLogs || []).find(s => s.endTime == null || s.endTime === '')
      if (activeSleep) return null

      const recentSleep = (sleepLogs || [])
        .filter(s => s.endTime)
        .sort((a, b) => (b.date + b.endTime).localeCompare(a.date + a.endTime))[0]
      if (recentSleep) {
        const endedMinAgo = minutesSince(recentSleep.endTime, recentSleep.date)
        if (endedMinAgo < 30) return null
      }

      const minAgo = minutesSince(last.time, last.date)
      // Pokazujemy tylko jeśli minęło >3h (dla niemowląt) — neutralny fakt
      const minHours = ageMonths < 6 ? 180 : 240
      if (minAgo < minHours) return null
      if (minAgo > 720) return null

      const h = Math.floor(minAgo / 60)
      return {
        type: 'info',
        title: t('obs.feed_time.title'),
        message: t('obs.feed_time.msg', { hours: h, mins: minAgo % 60 }),
        source: 'rule.source.observation',
      }
    },
  },

  // ── Med interval — neutralny timer (bez statusu severity) ──────────────────
  // "Minęło 6h od paracetamolu. Sprawdź ulotkę przed kolejną dawką."
  // Bez "musisz podać kolejną" / "lek przestał działać". To jest TIMER.
  {
    id: 'med_interval_passed',
    section: 'meds',
    check({ medLogs }) {
      const lastParac = lastMedMatching(medLogs, 'paracetamol')
      const lastIbu = lastMedMatching(medLogs, 'ibuprofen')

      const paracMin = lastParac ? minutesSince(lastParac.time, lastParac.date) : Infinity
      const ibuMin = lastIbu ? minutesSince(lastIbu.time, lastIbu.date) : Infinity

      // Pokazuj tylko window 6h-24h od ostatniej dawki — żeby nie spamować
      const paracInWindow = lastParac && paracMin >= 360 && paracMin <= 1440
      const ibuInWindow = lastIbu && ibuMin >= 480 && ibuMin <= 1440

      if (!paracInWindow && !ibuInWindow) return null

      const name = paracInWindow ? 'Paracetamol' : 'Ibuprofen'
      const ago = paracInWindow ? paracMin : ibuMin
      return {
        type: 'info',
        title: t('obs.med_interval.title'),
        message: t('obs.med_interval.msg', {
          name,
          hours: Math.floor(ago / 60),
          mins: ago % 60,
        }),
        source: 'rule.source.smpc',
      }
    },
  },

  // ── Med daily count — neutralny licznik (bez "alert") ──────────────────────
  // Pokazuje fakt: "podano 4× paracetamol w ciągu 24h". User sam wnioskuje.
  // Bez tonów alarmowych ani porady "nie podawaj więcej".
  {
    id: 'med_count_24h',
    section: 'meds',
    check({ medLogs }) {
      const last24h = (medLogs || []).filter(l => {
        const ts = new Date(l.date + 'T' + (l.time || '00:00'))
        return (Date.now() - ts.getTime()) < 24 * 60 * 60 * 1000
      })
      const paracCount = last24h.filter(l => l.med?.toLowerCase().includes('paracetamol')).length
      const ibuCount = last24h.filter(l => l.med?.toLowerCase().includes('ibuprofen')).length

      // Pokazuj tylko jeśli jest >= 3 dawek (kontekstowo użyteczne)
      if (paracCount < 3 && ibuCount < 3) return null

      // Lista neutralnych count'ów
      const parts = []
      if (paracCount >= 3) parts.push(`Paracetamol: ${paracCount}×`)
      if (ibuCount >= 3) parts.push(`Ibuprofen: ${ibuCount}×`)

      return {
        type: 'info',
        title: t('obs.med_count.title'),
        message: t('obs.med_count.msg', { list: parts.join(', ') }),
        source: 'rule.source.observation',
      }
    },
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Uruchamia wszystkie reguły i zwraca neutralne observations.
 *
 * Zauważ: BRAK topStatus, BRAK severity, BRAK getGlobalStatus.
 * To jest celowe — apka nie ma "globalnego statusu zdrowia dziecka",
 * bo to byłoby clinical assessment.
 *
 * @param {Object} ctx - { tempLogs, sleepLogs, feedLogs, medLogs, ageMonths }
 * @returns {{ observations: Observation[] }}
 */
export function evaluateRules(ctx) {
  const observations = []

  for (const rule of RULES) {
    try {
      const result = rule.check(ctx)
      if (result) {
        observations.push({ id: rule.id, section: rule.section, ...result })
      }
    } catch (_) {
      // Reguła nie może crashować UI
    }
  }

  return { observations }
}

/**
 * Zwraca observations dla konkretnej sekcji.
 */
export function getSectionObservations(observations, section) {
  return observations.filter(o => o.section === section)
}

// ─── Backwards compat exports (deprecated, do usunięcia w v2.11) ─────────────
//
// Stare API (evaluateRules zwracał { messages, topStatus }, plus getGlobalStatus,
// getSectionMessages) jest zachowane jako shim, żeby istniejący kod nie wybuchł
// natychmiast. Ale wszystkie zwracają NEUTRALNE wartości — bez severity.
//
// Plan migracji:
//   - v2.10.3: shim, używanie nowego API w nowym kodzie (TodaySummaryCard)
//   - v2.11.0: usunąć shim, wszystkie referencje migrowane

export const STATUS_RANK = { ok: 0, info: 1 } // legacy shim — tylko dwa poziomy

export function higherStatus(a, b) {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b
}

/**
 * @deprecated użyj getSectionObservations
 */
export function getSectionMessages(messages, section) {
  return (messages || []).filter(m => m.section === section)
}

/**
 * @deprecated apka nie ma globalnego clinical status
 * Zwraca pusty placeholder żeby nic nie crashowało.
 */
export function getGlobalStatus() {
  return {
    status: 'ok',
    title: '',
    message: '',
  }
}
