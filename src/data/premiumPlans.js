import { t } from '../i18n'

/**
 * Premium Plans — single source of truth (v2.9.2).
 *
 * Wcześniej (do 2.9.1) ceny i lista planów były ZDUPLIKOWANE w:
 *   - src/hooks/useRevenueCat.js (dla logiki zakupu)
 *   - src/components/PaywallScreen.jsx (dla UI)
 * Plus rozbieżność: useRevenueCat oznaczał monthly jako "popular", PaywallScreen
 * yearly jako "popular". Teraz oba importują tę samą funkcję.
 *
 * Jeśli zmieniasz cenę:
 *   1. Edytuj funkcję getPlans() poniżej
 *   2. Zsynchronizuj productId z Google Play Console (musi się zgadzać 1:1)
 *   3. Zsynchronizuj z RevenueCat dashboardem (offerings → packages)
 *   4. NIE EDYTUJ cen tylko tutaj jeśli już są aktywne subskrypcje w Play Console —
 *      Google Play wymaga osobnej procedury obniżki/podwyżki ceny dla
 *      istniejących subskrybentów.
 *
 * Format zwracanego planu:
 *   id        — internal identifier (monthly/yearly/lifetime)
 *   label     — UI label (i18n)
 *   price     — formatted display string ("99,99 zł" / "$49.99")
 *   period    — UI suffix ("/ rok", "jednorazowo")
 *   productId — Google Play product SKU (stały, NIE zmieniać po launchu)
 *   popular   — który plan ma highlight "POPULAR"
 *   badge     — opcjonalny label nad planem ("Najlepsza oferta")
 */

// v2.11.32 — Sprint B P1-2d: usunięto plan `lifetime`. Nie jest aktywny w
// Google Play Console (tylko monthly/yearly subscriptions skonfigurowane).
// Klik "Lifetime" przez user'a powodował błąd "SKU not found" → modal failure
// → confidence killer na nowo zdobytych userach.
//
// Aby przywrócić lifetime: utworzyć "in-app product" (NIE subscription, lifetime
// to one-time non-consumable) w Play Console:
//   Monetize → Products → In-app products → Create
//   ID: spokojny_rodzic_premium_lifetime
// Plus zsynchronizować z RC dashboard jako entitlement attached do lifetime.
// Plus dodać do LIFETIME_PRODUCT_IDS w useRevenueCat.js (już jest tam
// defensywnie — patrz v2.11.14 commit).
// v2.11.33 — DE pricing dodane.
// v2.12.0 — FR pricing dodane (Phase 2).
// v2.12.0 — ES pricing dodane (Phase 3 — Hiszpania + LATAM).
// Strategia per kraj:
//   PL: 99,99 zł/rok (flagship, niska konkurencja, low CAC)
//   EN-US: $24.99/rok (under Huckleberry $96 → 4× tańszy)
//   DE: 24,99 €/rok (vs Familie Pieks free, ale my mamy więcej feature)
//   FR: 24,99 €/rok (paritet z DE — wspólna strefa euro, podobny rynek)
//   ES: 24,99 €/rok (Hiszpania), Play Console konfiguruje LATAM auto-conversion
//                    (MX ~399 MXN, AR ~varies, CO ~95k COP — auto FX)
//
// IMPORTANT: ceny tutaj są tylko display labels. Real charging robi Google
// Play który ma per-region pricing skonfigurowane w Play Console. Trzeba
// zsynchronizować Play Console pricing z tymi liczbami (jeden SKU, cena
// per region):
//   spokojny_rodzic_premium_yearly:
//     PL → 99,99 PLN
//     DE → 24,99 EUR
//     FR → 24,99 EUR
//     ES → 24,99 EUR
//     MX → ~399 MXN (auto Google FX)
//     AR/CO/CL → auto Google FX
//     US → 24,99 USD (set in Play Console default)
//     UK → 19,99 GBP (Phase 4)
const PRICES_BY_LOCALE = {
  pl: { monthly: '14,99 zł', yearly: '99,99 zł' },
  de: { monthly: '3,99 €',   yearly: '24,99 €' },
  fr: { monthly: '3,99 €',   yearly: '24,99 €' },
  es: { monthly: '3,99 €',   yearly: '24,99 €' },
  en: { monthly: '$3.99',    yearly: '$24.99' },
}

export function getPlans(locale) {
  const prices = PRICES_BY_LOCALE[locale] || PRICES_BY_LOCALE.en

  return [
    {
      id: 'monthly',
      label: t('paywall.plan.monthly'),
      price: prices.monthly,
      period: t('paywall.per.monthly'),
      productId: 'spokojny_rodzic_premium_monthly',
      popular: false,
      badge: null,
    },
    {
      id: 'yearly',
      label: t('paywall.plan.yearly'),
      price: prices.yearly,
      period: t('paywall.per.yearly'),
      productId: 'spokojny_rodzic_premium_yearly',
      popular: true,
      badge: t('paywall.badge.yearly'),
    },
  ]
}

/**
 * Helper — znajdź plan po id.
 */
export function findPlan(locale, planId) {
  return getPlans(locale).find(p => p.id === planId) || null
}
