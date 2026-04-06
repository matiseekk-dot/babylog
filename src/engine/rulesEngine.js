/**
 * rulesEngine.js
 *
 * Architektura:
 *   - ctx (context) zawiera wszystkie dane dziecka
 *   - każda reguła to { id, check(ctx) -> Message | null }
 *   - Message: { status, title, message, section }
 *   - status hierarchy: ok < info < warning < alert < critical
 *
 * Żadnych importów React. Żadnych efektów ubocznych.
 * Łatwe do rozbudowy — dodaj nowy obiekt do tablicy RULES.
 */

// ─── Status hierarchy ────────────────────────────────────────────────────────

export const STATUS_RANK = { ok: 0, info: 1, warning: 2, alert: 3, critical: 4 }

export function higherStatus(a, b) {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minuty od danego czasu i daty. Zwraca Infinity jeśli brak danych. */
export function minutesSince(timeStr, dateStr) {
  if (!timeStr) return Infinity
  const now = new Date()
  const ref = new Date(dateStr || todayStr())
  const [h, m] = timeStr.split(':').map(Number)
  ref.setHours(h, m, 0, 0)
  return Math.max(0, Math.floor((now - ref) / 60000))
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/** Wpisy z dziś, posortowane od najnowszego. */
function todayLogs(logs) {
  const today = todayStr()
  return (logs || [])
    .filter(l => l.date === today)
    .sort((a, b) => b.time.localeCompare(a.time))
}

/** Ostatni wpis z dziś. */
function lastOf(logs) {
  return todayLogs(logs)[0] || null
}

/** Norma snu wg wieku (godziny). */
function sleepNorm(ageMonths) {
  if (ageMonths < 3)  return { min: 14, max: 17 }
  if (ageMonths < 6)  return { min: 12, max: 15 }
  if (ageMonths < 12) return { min: 11, max: 14 }
  if (ageMonths < 24) return { min: 11, max: 14 }
  return { min: 10, max: 13 }
}

/** Norma karmień wg wieku. */
function feedNorm(ageMonths) {
  if (ageMonths < 1)  return { minPerDay: 8, maxGapH: 3 }
  if (ageMonths < 3)  return { minPerDay: 7, maxGapH: 3 }
  if (ageMonths < 6)  return { minPerDay: 5, maxGapH: 4 }
  if (ageMonths < 9)  return { minPerDay: 4, maxGapH: 5 }
  return                     { minPerDay: 3, maxGapH: 6 }
}

/** Ostatni podany lek o nazwie zawierającej fragment. */
function lastMedMatching(medLogs, fragment) {
  return (medLogs || [])
    .filter(l => l.med?.toLowerCase().includes(fragment.toLowerCase()))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0] || null
}

// ─── Reguły ──────────────────────────────────────────────────────────────────
//
// Każda reguła ma:
//   id      – unikalny string (do debugowania)
//   section – do której sekcji należy ('temp' | 'sleep' | 'feed' | 'meds' | 'global')
//   check(ctx) – zwraca Message lub null (null = reguła nieaktywna)
//
// Kolejność nie ma znaczenia dla wyniku — wszystkie są sprawdzane.

const RULES = [

  // ── Reguła 1: temp >= 38.5 → alert ────────────────────────────────────────
  {
    id: 'temp_alert',
    section: 'temp',
    check({ tempLogs }) {
      const last = lastOf(tempLogs)
      if (!last || last.temp < 38.5 || last.temp >= 39) return null
      return {
        status: 'alert',
        title: 'Wysoka gorączka',
        message: `Ostatni pomiar: ${last.temp.toFixed(1)}°C. Podaj lek przeciwgorączkowy i obserwuj dziecko.`,
      }
    },
  },

  // ── Reguła 2: temp >= 39 → critical ───────────────────────────────────────
  {
    id: 'temp_critical',
    section: 'temp',
    check({ tempLogs }) {
      const last = lastOf(tempLogs)
      if (!last || last.temp < 39) return null
      return {
        status: 'critical',
        title: 'Gorączka krytyczna',
        message: `Temperatura ${last.temp.toFixed(1)}°C — zadzwoń do lekarza lub jedź na izbę przyjęć.`,
      }
    },
  },

  // ── Reguła 3: rosnące temperatury w 3 kolejnych pomiarach → warning ────────
  {
    id: 'temp_rising',
    section: 'temp',
    check({ tempLogs }) {
      // Weź 3 ostatnie pomiary (dowolny dzień), posortowane chronologicznie
      const sorted = [...(tempLogs || [])]
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      if (sorted.length < 3) return null

      const last3 = sorted.slice(-3)
      const isRising = last3[0].temp < last3[1].temp && last3[1].temp < last3[2].temp
      if (!isRising) return null

      const [t1, t2, t3] = last3.map(l => Number(l.temp).toFixed(1))
      return {
        status: 'warning',
        title: 'Temperatura rośnie',
        message: `Trzy kolejne pomiary: ${t1}° → ${t2}° → ${t3}°C. Tendencja wzrostowa — obserwuj uważnie.`,
      }
    },
  },

  // ── Reguła 4: brak spadku temperatury 2h po leku → alert ──────────────────
  {
    id: 'temp_no_drop_after_med',
    section: 'temp',
    check({ tempLogs, medLogs }) {
      const lastMed = lastMedMatching(medLogs, 'paracetamol')
        || lastMedMatching(medLogs, 'ibuprofen')
      if (!lastMed) return null

      const minAgo = minutesSince(lastMed.time, lastMed.date)
      // Okno 2h–4h po leku
      if (minAgo < 120 || minAgo > 240) return null

      // Znajdź temperaturę przed lekiem i po leku
      const allSorted = [...(tempLogs || [])]
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

      const medTimestamp = lastMed.date + lastMed.time.replace(':', '')
      const beforeMed = allSorted.filter(l => (l.date + l.time.replace(':', '')) <= medTimestamp)
      const afterMed  = allSorted.filter(l => (l.date + l.time.replace(':', '')) >  medTimestamp)

      if (!beforeMed.length || !afterMed.length) return null

      const tempBefore = beforeMed[beforeMed.length - 1].temp
      const tempAfter  = afterMed[afterMed.length - 1].temp

      // Brak spadku = różnica < 0.3°C
      if (tempBefore - tempAfter >= 0.3) return null

      return {
        status: 'alert',
        title: 'Lek nie działa',
        message: `Temperatura nie spadła po ${lastMed.med} (${Math.floor(minAgo / 60)}h temu). Skontaktuj się z lekarzem.`,
      }
    },
  },

  // ── Reguła 5: minął czas działania leku → info ─────────────────────────────
  {
    id: 'med_expired',
    section: 'meds',
    check({ medLogs, tempLogs }) {
      // Aktywna tylko przy gorączce
      const lastTemp = lastOf(tempLogs)
      if (!lastTemp || lastTemp.temp < 38.0) return null

      const lastParac = lastMedMatching(medLogs, 'paracetamol')
      const lastIbu   = lastMedMatching(medLogs, 'ibuprofen')

      const paracMin = lastParac ? minutesSince(lastParac.time, lastParac.date) : Infinity
      const ibuMin   = lastIbu   ? minutesSince(lastIbu.time,   lastIbu.date)   : Infinity

      // Paracetamol działa ~6h, ibuprofen ~8h
      const paracExpired = lastParac && paracMin >= 360
      const ibuExpired   = lastIbu   && ibuMin   >= 480
      const anyExpired   = paracExpired || ibuExpired

      if (!anyExpired) return null

      const name = paracExpired ? 'Paracetamol' : 'Ibuprofen'
      const ago  = paracExpired ? paracMin : ibuMin
      return {
        status: 'info',
        title: 'Czas na kolejną dawkę',
        message: `${name} podano ${Math.floor(ago / 60)}h ${ago % 60}m temu — czas działania minął. Możesz podać kolejną dawkę.`,
      }
    },
  },

  // ── Reguła 6: sen poniżej normy → warning ─────────────────────────────────
  {
    id: 'sleep_deficit',
    section: 'sleep',
    check({ sleepLogs, ageMonths }) {
      const hour = new Date().getHours()
      // Sprawdzaj tylko po 18:00
      if (hour < 18) return null

      const totalMin = todayLogs(sleepLogs)
        .reduce((sum, l) => sum + (l.durationMin || 0), 0)
      const norm = sleepNorm(ageMonths)
      const minNormMin = norm.min * 60

      // Poniżej 75% normy minimum
      if (totalMin >= minNormMin * 0.75) return null

      const h = Math.floor(totalMin / 60)
      const m = totalMin % 60
      return {
        status: 'warning',
        title: 'Niedobór snu',
        message: `Dziś tylko ${h}h ${m}m snu (norma: ${norm.min}–${norm.max}h). Zadbaj o wyciszenie i rytuał zasypiania.`,
      }
    },
  },

  // ── Reguła 7: gorączka + brak snu + brak jedzenia → critical ──────────────
  {
    id: 'combined_critical',
    section: 'global',
    check({ tempLogs, sleepLogs, feedLogs, ageMonths }) {
      const lastTemp = lastOf(tempLogs)
      const hasFever = lastTemp && lastTemp.temp >= 38.0

      const totalSleepMin = todayLogs(sleepLogs)
        .reduce((sum, l) => sum + (l.durationMin || 0), 0)
      const norm = sleepNorm(ageMonths)
      const lowSleep = totalSleepMin < norm.min * 60 * 0.5

      const feedCount = todayLogs(feedLogs).length
      const fnorm = feedNorm(ageMonths)
      const hour = new Date().getHours()
      const expectedFeeds = Math.ceil(fnorm.minPerDay * hour / 24)
      const lowFeed = feedCount < Math.max(1, expectedFeeds - 2)

      if (!hasFever || !lowSleep || !lowFeed) return null

      return {
        status: 'critical',
        title: 'Zły stan ogólny',
        message: `Gorączka ${lastTemp.temp.toFixed(1)}°C + mało snu + mało karmień — dziecko wymaga natychmiastowej uwagi lekarza.`,
      }
    },
  },

  // ── Reguła 8: brak problemów → ok ─────────────────────────────────────────
  {
    id: 'all_ok',
    section: 'global',
    check() {
      // Zawsze aktywna — filtrowana gdy są inne alerty
      return {
        status: 'ok',
        title: 'Wszystko w porządku',
        message: 'Brak alertów. Kontynuuj regularne logowanie danych.',
      }
    },
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Uruchamia wszystkie reguły i zwraca wynik.
 *
 * @param {Object} ctx - { tempLogs, sleepLogs, feedLogs, medLogs, ageMonths, weightKg }
 * @returns {{ messages: Message[], topStatus: string }}
 *
 * Message: { id, status, title, message, section }
 */
export function evaluateRules(ctx) {
  const messages = []

  for (const rule of RULES) {
    try {
      const result = rule.check(ctx)
      if (result) {
        messages.push({ id: rule.id, section: rule.section, ...result })
      }
    } catch (_) {
      // Reguła nie może crashować UI
    }
  }

  // Usuń 'ok' jeśli są jakiekolwiek inne alerty
  const nonOk = messages.filter(m => m.status !== 'ok')
  const active = nonOk.length > 0 ? nonOk : messages.filter(m => m.status === 'ok')

  // Najwyższy status
  const topStatus = active.reduce(
    (top, m) => STATUS_RANK[m.status] > STATUS_RANK[top] ? m.status : top,
    'ok'
  )

  return { messages: active, topStatus }
}

/**
 * Zwraca aktywne komunikaty dla konkretnej sekcji.
 */
export function getSectionMessages(messages, section) {
  return messages.filter(m => m.section === section)
}

/**
 * Zwraca globalny status (najważniejszy komunikat).
 */
export function getGlobalStatus(messages, topStatus) {
  if (topStatus === 'ok') {
    return messages.find(m => m.status === 'ok') || {
      status: 'ok', title: 'Wszystko w porządku', message: ''
    }
  }
  // Priorytet: critical > alert > warning > info
  const order = ['critical', 'alert', 'warning', 'info']
  for (const s of order) {
    const found = messages.find(m => m.status === s)
    if (found) return found
  }
  return messages[0]
}
