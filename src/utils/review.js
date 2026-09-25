/**
 * Kiedy poprosić o ocenę w Google Play (v2.16.5, natywne v55).
 *
 * Tylko u kogoś, kto realnie korzysta: minimum 7 dni od pierwszego wpisu
 * i 10 wpisów, zaraz po dodaniu wpisu (dobry moment), najwyżej raz na
 * 120 dni. Google i tak sam ogranicza, jak często okienko się pojawia.
 */

const FIRST_ENTRY_AT = 'babylog_first_entry_at'
const ASKED_AT = 'babylog_review_asked_at'
const DAY = 24 * 60 * 60 * 1000

export const REVIEW_MIN_DAYS = 7
export const REVIEW_MIN_ENTRIES = 10
export const REVIEW_COOLDOWN_DAYS = 120

function readNumber(key) {
  try { return Number(localStorage.getItem(key)) || 0 } catch { return 0 }
}

/** Zapamiętaj moment pierwszego wpisu (u istniejących użytkowników — pierwsze uruchomienie tej wersji). */
export function markFirstEntryTime(now = Date.now()) {
  try {
    if (!localStorage.getItem(FIRST_ENTRY_AT)) localStorage.setItem(FIRST_ENTRY_AT, String(now))
  } catch {}
}

export function shouldRequestReview({ entryCount, now = Date.now() }) {
  const firstAt = readNumber(FIRST_ENTRY_AT)
  if (!firstAt || now - firstAt < REVIEW_MIN_DAYS * DAY) return false
  if (entryCount < REVIEW_MIN_ENTRIES) return false
  const askedAt = readNumber(ASKED_AT)
  if (askedAt && now - askedAt < REVIEW_COOLDOWN_DAYS * DAY) return false
  return true
}

export function markReviewRequested(now = Date.now()) {
  try { localStorage.setItem(ASKED_AT, String(now)) } catch {}
}
