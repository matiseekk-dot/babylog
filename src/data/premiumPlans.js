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

export function getPlans(locale) {
  const isEN = locale === 'en'
  const prices = isEN
    ? { monthly: '$6.99', yearly: '$49.99', lifetime: '$99.99' }
    : { monthly: '14,99 zł', yearly: '99,99 zł', lifetime: '199,99 zł' }

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
    {
      id: 'lifetime',
      label: t('paywall.plan.lifetime'),
      price: prices.lifetime,
      period: t('paywall.per.lifetime'),
      productId: 'spokojny_rodzic_premium_lifetime',
      popular: false,
      badge: null,
    },
  ]
}

/**
 * Helper — znajdź plan po id.
 */
export function findPlan(locale, planId) {
  return getPlans(locale).find(p => p.id === planId) || null
}
