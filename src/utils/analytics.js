/**
 * Analytics — funnel event tracking via Firebase Analytics
 *
 * v2.11.32 (Sprint B P1-6): wcześniej apka miała ZERO analytics. Każda
 * decyzja produktowa (gdzie userzy odpadają, który feature najczęściej
 * konwertuje, ile czasu od install do paywall) była strzelaniem na ślepo.
 *
 * Co mierzymy (6 funnel events):
 *
 *   1. consent_accepted            — user przeszedł przez MedicalConsent
 *   2. onboarding_completed        — user wpisał imię + DOB + zaakceptował
 *   3. first_entry_added           — pierwszy data point (feed/sleep/temp/...)
 *                                    To jest "aha moment" — przeszedł od
 *                                    instalu do faktycznego użycia.
 *   4. paywall_viewed              — paywall się otworzył (z trigger source)
 *   5. paywall_cta_clicked         — user kliknął "Aktywuj Premium"
 *                                    (z planu: monthly/yearly)
 *   6. purchase_completed          — Premium granted (po RC webhook)
 *
 * Bonus events (free, niski koszt):
 *   - purchase_failed              — failed activation (z RC error code)
 *   - tab_viewed                   — który tab z 14 jest faktycznie używany
 *
 * UWAGA RODO:
 *   Firebase Analytics zbiera anonymous app instance ID (nie email).
 *   Nie wysyłamy PII (imię dziecka, DOB, etc.) — wszystkie eventy są bez
 *   user-identifiable data. Przesyłamy tylko meta (`plan: 'yearly'`,
 *   `entry_type: 'feed'`, `tab: 'today'`).
 *
 *   Privacy policy (public/privacy.html) wymienia "Firebase (Google)" jako
 *   data processor. Analytics jest sub-feature — w aktualnej polityce nie
 *   jest explicitly wymieniony, ale zgodnie z TOS Firebase data analytics
 *   collection jest opt-in dla nowych projektów.
 *
 *   TODO: zaktualizować privacy.html o wzmianke "Firebase Analytics — anonymized
 *   funnel events for product improvement, no PII".
 */

import { getAnalyticsIfSupported } from '../firebase'

// Cache instance — getAnalyticsIfSupported jest async ale zwraca synchronicznie
// po pierwszym wywołaniu (memoizes).
let analyticsPromise = null

function ensureAnalytics() {
  if (!analyticsPromise) {
    analyticsPromise = getAnalyticsIfSupported()
  }
  return analyticsPromise
}

/**
 * track — wywołaj dla custom event.
 *
 * No-op gdy analytics niedostępny (no internet, Brave, etc.) — apka działa
 * normalnie, tylko bez data collection.
 *
 * @param {string} eventName — snake_case (Firebase convention)
 * @param {object} params — flat object, max 25 params, każdy <100 chars
 */
export async function track(eventName, params = {}) {
  try {
    const analytics = await ensureAnalytics()
    if (!analytics) return
    const { logEvent } = await import('firebase/analytics')
    // Sanitize params — Firebase wymaga string/number values
    const sanitized = {}
    for (const [k, v] of Object.entries(params)) {
      if (v === null || v === undefined) continue
      sanitized[k] = typeof v === 'object' ? JSON.stringify(v).slice(0, 100) : v
    }
    logEvent(analytics, eventName, sanitized)
  } catch (err) {
    // Niekrytyczne — nie psuj UX gdy analytics jest down
    console.warn('[analytics] track failed:', eventName, err?.message || err)
  }
}

// ─── Funnel events (6 critical) ──────────────────────────────────────────────

/** User zaakceptował medical consent. Pierwszy krok lifecycle. */
export const trackConsentAccepted = () => track('consent_accepted')

/**
 * Onboarding zakończony — user wpisał name + DOB.
 * @param {object} params — { ageMonths, sex }
 */
export const trackOnboardingCompleted = (params) =>
  track('onboarding_completed', params)

/**
 * Pierwszy wpis danych — user dodał feed/sleep/temp/diaper/med.
 * To jest "aha moment". Mierzymy distance install→first_entry.
 * @param {string} entryType — 'feed' | 'sleep' | 'temp' | 'diaper' | 'med' | ...
 */
export const trackFirstEntry = (entryType) =>
  track('first_entry_added', { entry_type: entryType })

/**
 * Paywall się otworzył.
 * @param {string} trigger — 'topbar' | 'premium_feature' | 'profile_limit' | 'pdf_export' | ...
 */
export const trackPaywallViewed = (trigger) =>
  track('paywall_viewed', { trigger })

/**
 * User kliknął "Aktywuj Premium" z konkretnego planu.
 * @param {string} plan — 'monthly' | 'yearly'
 * @param {string} trigger — same as paywall_viewed
 */
export const trackPaywallCTAClicked = (plan, trigger) =>
  track('paywall_cta_clicked', { plan, trigger })

/**
 * Premium aktywowane — RC webhook wystrzelił INITIAL_PURCHASE → Firestore
 * premium_purchased = true → ten event triggeruje się gdy klient widzi
 * przejście (false → true).
 * @param {string} plan — 'monthly' | 'yearly' | 'unknown'
 */
export const trackPurchaseCompleted = (plan) =>
  track('purchase_completed', { plan })

/**
 * Bonus: failed activation — przy każdym RC reject.
 * @param {object} params — { plan, error_code, status }
 */
export const trackPurchaseFailed = (params) =>
  track('purchase_failed', params)

/**
 * Bonus: tab navigation — który tab z 14 jest faktycznie używany.
 * Wywołać raz per session per tab (nie spamować przy każdym scroll).
 * @param {string} tabId — 'today' | 'feed' | 'sleep' | 'health' | 'reference' | ...
 */
export const trackTabViewed = (tabId) =>
  track('tab_viewed', { tab: tabId })
