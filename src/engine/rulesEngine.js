import { t } from '../i18n'
import { todayDate } from '../utils/helpers'
/**
 * rulesEngine.js
 *
 * v2.11.0 — MDR EXIT (engine surface).
 *
 * Wcześniej silnik produkował severity-classified messages (critical/alert/warning),
 * co wraz z UI rendering czyniło apkę MDSW pod MDR Rule 11. v2.10.6 usunęło
 * globalny crisis UI z App.jsx; v2.11.0 usuwa source — silnik nie generuje już
 * żadnych klasyfikacji severity. Wszystkie zachowane reguły zwracają
 * neutralne `status: 'info'` observations.
 *
 * Co zostało usunięte (per CHANGELOG-v2.10.5):
 *   temp_infant_emergency, temp_extreme, temp_critical, temp_alert,
 *   temp_young_infant, temp_no_drop_after_med, med_too_soon, med_daily_limit,
 *   med_expired, sleep_deficit, combined_critical, no_entries_today, all_ok.
 *
 * Co zostało zachowane (jako neutralne observations):
 *   temp_rising — fakt obserwacyjny "ostatnie 3 pomiary rosną"
 *   feed_time   — fakt "ostatnie karmienie X godzin temu"
 *
 * Backwards-compat shim:
 *   - `STATUS_RANK`, `higherStatus`, `getGlobalStatus` zostają w eksporcie
 *     (mogłyby być użyte przez legacy konsumentów).
 *   - `evaluateRules` zwraca tę samą strukturę `{messages, topStatus}`,
 *     ale `topStatus` zawsze będzie 'ok' lub 'info' (severity hierarchy
 *     skończyła się przy 'info').
 *
 * Architektura:
 *   - ctx (context) zawiera wszystkie dane dziecka
 *   - każda reguła to { id, check(ctx) -> Message | null }
 *   - Message: { status: 'info', title, message, section }
 *   - Żadnych importów React. Żadnych efektów ubocznych.
 */

// ─── Status hierarchy (zachowane jako shim) ─────────────────────────────────

export const STATUS_RANK = { ok: 0, info: 1, warning: 2, alert: 3, critical: 4 }

export function higherStatus(a, b) {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minuty od danego czasu i daty. Zwraca Infinity jeśli brak danych. */
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

// ─── Reguły (neutralne observations) ────────────────────────────────────────
//
// Każda reguła ma:
//   id      – unikalny string (do debugowania)
//   section – do której sekcji należy ('temp' | 'sleep' | 'feed' | 'meds' | 'global')
//   check(ctx) – zwraca Message lub null (null = reguła nieaktywna)
//
// v2.11.0: status zawsze 'info'. Brak progów klinicznych decydujących o
// severity. Reguły są obserwacyjne — pokazują FAKTY z danych, nie ocenę.

const RULES = [

  // ── Temp rising — fakt obserwacyjny: 3 ostatnie pomiary rosną ─────────────
  // Wcześniej `warning`. Teraz `info` — neutralna obserwacja, użytkownik sam
  // wnioskuje co z tym zrobić (zaglądając do biblioteki wytycznych w More tab).
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
        status: 'info',
        title: t('rule.temp_rising.title'),
        message: t('rule.temp_rising.msg', { t1, t2, t3 }),
        source: 'rule.source.observation',
      }
    },
  },

  // ── Feed time — fakt: ostatnie karmienie X godzin temu ────────────────────
  // BUG-008: pomijaj gdy dziecko śpi (aktywny stoper lub sleep log bez endTime)
  {
    id: 'feed_time',
    section: 'feed',
    check({ feedLogs, sleepLogs, ageMonths }) {
      const last = lastOf(feedLogs)
      if (!last) return null

      // Sprawdź czy dziecko obecnie śpi
      const activeSleep = (sleepLogs || []).find(s => s.endTime == null || s.endTime === '')
      if (activeSleep) return null

      // Lub ostatni sleep w ciągu ostatniej godziny (świeżo się obudziło — daj chwilę)
      const recentSleep = (sleepLogs || [])
        .filter(s => s.endTime)
        .sort((a, b) => (b.date + b.endTime).localeCompare(a.date + a.endTime))[0]
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
        message: t('rule.feed_time.msg', { hours: h, mins: minAgo % 60 }),
        source: 'rule.source.observation',
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
 * Message: { id, status: 'info', title, message, section, source }
 *
 * v2.11.0: topStatus zawsze 'ok' (brak observations) lub 'info' (jakieś są).
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

  const topStatus = messages.length > 0 ? 'info' : 'ok'

  return { messages, topStatus }
}

/**
 * Zwraca aktywne komunikaty dla konkretnej sekcji.
 */
export function getSectionMessages(messages, section) {
  return messages.filter(m => m.section === section)
}

/**
 * Zwraca globalny status (najważniejszy komunikat).
 *
 * v2.11.0 — backwards compat shim. Dawniej zwracało critical/alert/warning;
 * teraz max severity to 'info'. Komponenty UI App.jsx już tego nie konsumują
 * (TodaySummaryCard zastąpiło ChildStatusCard), ale eksport zostawiamy
 * dla legacy importów spoza scope tej refaktoryzacji.
 */
export function getGlobalStatus(messages, topStatus) {
  if (topStatus === 'ok') {
    return {
      status: 'ok',
      title: t('rule.default.title'),
      message: '',
    }
  }
  return messages[0] || { status: 'ok', title: t('rule.default.title'), message: '' }
}
