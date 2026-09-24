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

// Plan `lifetime` wymaga produktu jednorazowego (in-app product, NIE subskrypcji)
// w Play Console o ID spokojny_rodzic_premium_lifetime, podpiętego w RevenueCat
// pod entitlement "Spokojny Rodzic Pro". Bez tego klik daje "SKU not found".
// ID jest też na liście LIFETIME_PRODUCT_IDS w useRevenueCat.js.
// v2.11.33 — DE pricing dodane.
// v2.12.0 — FR pricing dodane (Phase 2).
// v2.12.0 — ES pricing dodane (Phase 3 — Hiszpania + LATAM).
// Strategia per kraj:
//   PL: 119 zł/rok (podniesione z 99,99 zł w commit 3bfe40a)
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
//     PL → 119 PLN
//     DE → 24,99 EUR
//     FR → 24,99 EUR
//     ES → 24,99 EUR
//     MX → ~399 MXN (auto Google FX)
//     AR/CO/CL → auto Google FX
//     US → 24,99 USD (set in Play Console default)
//     UK → 19,99 GBP (Phase 4)
//
// v2.14.0 — added perMonth display for yearly (conversion booster: pokazuje
// user'owi że yearly to niski koszt miesięczny, zwiększa perceived value).
// Wyliczone jako yearlyRaw / 12, zaokrąglone matematycznie do 2 miejsc,
// sformatowane per lokalne konwencje (przecinek PL/DE/FR/ES, kropka EN).
//   PL:      119    / 12 = 9,916  → "9,92 zł"
//   DE/FR/ES: 24,99 / 12 = 2,0825 → "2,08 €"
//   EN:       24.99 / 12 = 2.0825 → "$2.08"
// Oszczędność yearly vs monthly ×12 (dla badge'a paywall.badge.yearly w i18n):
//   PL:      (14,99 × 12 − 119)   / (14,99 × 12) = 33,85% → 34%
//   DE/FR/ES: (3,99 × 12 − 24,99) / (3,99 × 12)  = 47,80% → 48%
//   EN:       (3.99 × 12 − 24.99) / (3.99 × 12)  = 47,80% → 48%
// Dożywotnia ≈ 2× roczna: rodzic korzysta intensywnie ~2 lata, więc to mniej
// więcej tyle, ile zapłaciłby na subskrypcji. Taniej (np. 149 zł) zjadałoby
// sprzedaż rocznej. Ceny display-only — realne ustawia się w Play Console
// dla produktu jednorazowego spokojny_rodzic_premium_lifetime.
const PRICES_BY_LOCALE = {
  pl: { monthly: '14,99 zł', yearly: '119 zł',   yearlyPerMonth: '9,92 zł', lifetime: '249 zł'  },
  de: { monthly: '3,99 €',   yearly: '24,99 €',  yearlyPerMonth: '2,08 €',  lifetime: '49,99 €' },
  fr: { monthly: '3,99 €',   yearly: '24,99 €',  yearlyPerMonth: '2,08 €',  lifetime: '49,99 €' },
  es: { monthly: '3,99 €',   yearly: '24,99 €',  yearlyPerMonth: '2,08 €',  lifetime: '49,99 €' },
  en: { monthly: '$3.99',    yearly: '$24.99',   yearlyPerMonth: '$2.08',   lifetime: '$49.99'  },
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
      perMonth: null,
    },
    {
      id: 'yearly',
      label: t('paywall.plan.yearly'),
      price: prices.yearly,
      period: t('paywall.per.yearly'),
      productId: 'spokojny_rodzic_premium_yearly',
      popular: true,
      badge: t('paywall.badge.yearly'),
      // v2.14.0: display-only, np. "9,92 zł" — używane w PaywallScreen do
      // pokazania "≈ 9,92 zł/mc" pod ceną roczną. Nie wpływa na charge —
      // płatność zawsze pobierana jako yearly.
      perMonth: prices.yearlyPerMonth,
    },
    {
      id: 'lifetime',
      label: t('paywall.plan.lifetime'),
      price: prices.lifetime,
      period: t('paywall.per.lifetime'),
      productId: 'spokojny_rodzic_premium_lifetime',
      popular: false,
      badge: t('paywall.badge.lifetime'),
      perMonth: null,
      // Produkt jednorazowy (nie subskrypcja) — RevenueCat getProducts
      // domyślnie szuka tylko subskrypcji, więc trzeba podać typ.
      oneTime: true,
    },
  ]
}

/**
 * Helper — znajdź plan po id.
 */
export function findPlan(locale, planId) {
  return getPlans(locale).find(p => p.id === planId) || null
}
