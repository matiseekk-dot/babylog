import { t } from '../i18n'
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
        title: t('rule.temp_alert.title'),
        message: t('rule.temp_alert.msg', {temp: last.temp.toFixed(1)}),
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
        title: t('rule.temp_critical.title'),
        message: t('rule.temp_critical.msg', {temp: last.temp.toFixed(1)}),
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
        title: t('rule.temp_rising.title'),
        message: t('rule.temp_rising.msg', {t1, t2, t3}),
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
        title: t('rule.med_not_working.title'),
        message: t('rule.med_not_working.msg', {med: lastMed.med, hours: Math.floor(minAgo / 60)}),
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
        title: t('rule.med_expired.title'),
        message: t('rule.med_expired.msg', {name, hours: Math.floor(ago/60), mins: ago % 60}),
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
        title: t('rule.sleep_deficit.title'),
        message: t('rule.sleep_deficit.msg', {h, m, min: norm.min, max: norm.max}),
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
        title: t('rule.combined.title'),
        message: t('rule.combined.msg', {temp: lastTemp.temp.toFixed(1)}),
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
        title: t('rule.default.title'),
        message: t('rule.default.msg'),
      }
    },
  },

  // ── Reguła 9: czas na karmienie (>3h od ostatniego) → info ─────────────────
  // BUG-008: pomijaj gdy dziecko śpi (aktywny stoper lub sleep log bez endTime)
  {
    id: 'feed_time',
    section: 'feed',
    check({ feedLogs, sleepLogs, ageMonths }) {
      const last = lastOf(feedLogs)
      if (!last) return null

      // Sprawdź czy dziecko obecnie śpi
      const activeSleep = (sleepLogs || []).find(s => s.endTime == null || s.endTime === '')
      if (activeSleep) return null  // dziecko śpi — nie budź

      // Lub ostatni sleep w ciągu ostatniej godziny (świeżo się obudziło — daj chwilę)
      const recentSleep = (sleepLogs || [])
        .filter(s => s.endTime)
        .sort((a,b) => (b.date+b.endTime).localeCompare(a.date+a.endTime))[0]
      if (recentSleep) {
        const endedMinAgo = minutesSince(recentSleep.endTime, recentSleep.date)
        if (endedMinAgo < 30) return null
      }

      const minAgo = minutesSince(last.time, last.date)
      const expected = ageMonths < 3 ? 150 : ageMonths < 6 ? 180 : 240
      if (minAgo < expected) return null
      if (minAgo > 720) return null
      const h = Math.floor(minAgo / 60)
      return {
        status: 'info',
        title: t('rule.feed_time.title'),
        message: t('rule.feed_time.msg', {hours: h, mins: minAgo % 60}),
      }
    },
  },

  // ── Reguła 10: brak wpisów do południa → info (BUG-009 — neutralny ton) ───
  {
    id: 'no_entries_today',
    section: 'global',
    check({ feedLogs, diaperLogs, sleepLogs, tempLogs }) {
      const now = new Date()
      if (now.getHours() < 12) return null
      const today = todayStr()
      const hasAny = [...(feedLogs||[]), ...(diaperLogs||[]), ...(sleepLogs||[]), ...(tempLogs||[])]
        .some(l => l.date === today)
      if (hasAny) return null
      return {
        status: 'info',
        title: t('rule.no_entries.title'),
        message: t('rule.no_entries.msg'),
      }
    },
  },

  // ── Reguła 11: all OK — wszystko w normie → ok ─────────────────────────────
  {
    id: 'all_ok',
    section: 'global',
    check({ feedLogs, tempLogs, sleepLogs }) {
      const today = todayStr()
      const feedsToday = (feedLogs||[]).filter(l => l.date === today).length
      const tempsToday = (tempLogs||[]).filter(l => l.date === today)
      const sleepsToday = (sleepLogs||[]).filter(l => l.date === today).length

      // All OK requires: at least 3 feeds, no fever, at least 1 sleep
      if (feedsToday < 3) return null
      if (sleepsToday < 1) return null
      const latestTemp = lastOf(tempsToday)
      if (latestTemp && latestTemp.temp >= 37.5) return null

      return {
        status: 'ok',
        title: t('rule.all_ok.title'),
        message: t('rule.all_ok.msg', {feeds: feedsToday, sleeps: sleepsToday}),
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
      status: 'ok', title: t('rule.default.title'), message: ''
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
