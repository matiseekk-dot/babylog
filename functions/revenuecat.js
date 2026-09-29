// Aktualny stan Premium w RevenueCat (v2.16.13).
//
// Webhook mówi tylko, co się stało z JEDNYM zakupem (np. EXPIRATION starej
// subskrypcji), a nie, czy klient nadal ma Premium. Klient z planem
// dożywotnim, któremu wygasła wcześniejsza subskrypcja, dostawał więc
// premium_purchased = false. RevenueCat zaleca po webhooku pobrać aktualny
// stan klienta z REST API i na nim opierać decyzję.

const RC_API = 'https://api.revenuecat.com/v1'
// Publiczny klucz SDK (ten sam co w apce, src/hooks/useRevenueCat.js) wystarcza
// do odczytu klienta. Nie jest tajny.
const RC_PUBLIC_KEY = 'goog_CePHovfsjHOiYaoKwnFhtcDFnwq'
const ENTITLEMENT = 'Spokojny Rodzic Pro'
// Subskrypcja kończąca się za chwilę nie blokuje odebrania Premium (zegar
// RevenueCat i funkcji może się minimalnie różnić).
const EXPIRY_MARGIN_MS = 10 * 60 * 1000

/**
 * Czy klient ma teraz aktywne uprawnienie. Bez expires_date = plan dożywotni
 * albo przyznane ręcznie w RevenueCat (oba ustawia tylko sklep lub właściciel).
 */
function entitlementActive(subscriber, now = Date.now()) {
  const ent = subscriber?.entitlements?.[ENTITLEMENT]
  if (!ent) return false
  if (!ent.expires_date) return true
  return new Date(ent.expires_date).getTime() > now + EXPIRY_MARGIN_MS
}

async function fetchEntitlementActive(appUserId, fetchImpl = fetch) {
  const res = await fetchImpl(`${RC_API}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${RC_PUBLIC_KEY}`, 'X-Platform': 'android' },
  })
  if (!res.ok) throw new Error(`RC ${res.status}`)
  const data = await res.json()
  if (!data?.subscriber) throw new Error('RC: odpowiedź bez subscriber')
  return entitlementActive(data.subscriber)
}

/**
 * Identyfikatory kont z TRANSFER. Tylko UID-y Firebase: anonimowe konta
 * RevenueCat ($RCAnonymousID:...) nie mają dokumentów w Firestore.
 */
function transferUserIds(event) {
  const ids = [...(event?.transferred_from || []), ...(event?.transferred_to || [])]
  return [...new Set(ids.filter(id => typeof id === 'string' && /^[\w-]{1,128}$/.test(id)))]
}

module.exports = { entitlementActive, fetchEntitlementActive, transferUserIds, ENTITLEMENT }
