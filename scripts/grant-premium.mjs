/**
 * grant-premium.mjs
 *
 * One-off admin script — manually grant Premium to a Firebase user.
 *
 * KIEDY UŻYĆ:
 *   - User zapłacił przez Google Play, ale webhook RC nie aktywował Premium
 *     (np. Service Account permissions w Play Console nie były gotowe,
 *     RC webhook URL nie był ustawiony, token zgubił się przed v2.11.13).
 *   - Reklamacja / supportowy refund + ponowne nadanie.
 *   - Test E2E na konkretnym UID.
 *
 * CO ROBI:
 *   1. Pisze users/{uid}/data/premium_purchased = { value: true }
 *   2. Pisze users/{uid}/data/premium_meta z manualną metadaną
 *   3. (Opcjonalnie) ustawia expires_at jeśli podasz --expires
 *
 * CO NIE ROBI:
 *   - NIE komunikuje się z RevenueCat — RC nadal nie wie o tym useru.
 *     To OK gdy webhook się nie udało, ale za miesiąc gdy "subskrypcja"
 *     wygasa, nic nie odnowi się automatycznie. Trzeba wtedy:
 *       (a) zrobić ręczny refund w Play Console + manual grant
 *       (b) albo rzeczywiście naprawić RC webhook i przesłać RTDN
 *     Najlepiej użyć tego skryptu TYLKO gdy user dotknął problemu i czeka
 *     — a w tle naprawić RC integrację.
 *
 * UŻYCIE:
 *   1. Pobierz Service Account JSON z Firebase Console:
 *      Project Settings → Service accounts → "Generate new private key"
 *   2. Zapisz jako `service-account.json` w roocie projektu (jest w .gitignore)
 *   3. Zainstaluj firebase-admin lokalnie (jeśli nie masz):
 *      npm install --no-save firebase-admin
 *   4. Uruchom:
 *      node scripts/grant-premium.mjs <uid> [--expires=YYYY-MM-DD] [--note="reason"]
 *
 *   Przykład:
 *      node scripts/grant-premium.mjs abc123XYZ --expires=2027-05-02 --note="manual after RC webhook fail v2.11.13"
 *
 * JAK ZNALEŹĆ UID:
 *   Firebase Console → Authentication → Users
 *   Znajdź email/numer/anon ID i skopiuj UID
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import admin from 'firebase-admin'

// ─── parse argv ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const uid = args.find(a => !a.startsWith('--'))
const expires = args.find(a => a.startsWith('--expires='))?.split('=')[1]
const note = args.find(a => a.startsWith('--note='))?.split('=')[1] || 'manual-grant'
const productId = args.find(a => a.startsWith('--product='))?.split('=')[1] || 'spokojny_rodzic_premium_yearly'

if (!uid) {
  console.error('USAGE: node scripts/grant-premium.mjs <uid> [--expires=YYYY-MM-DD] [--note="..."] [--product=spokojny_rodzic_premium_yearly]')
  process.exit(1)
}

// ─── init admin SDK ────────────────────────────────────────────────────────────

const SA_PATH = resolve(process.cwd(), 'service-account.json')
let credential
try {
  const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'))
  credential = admin.credential.cert(sa)
} catch (e) {
  console.error(`\n[ERROR] Nie znaleziono service-account.json w ${SA_PATH}`)
  console.error('Pobierz Service Account JSON z Firebase Console:')
  console.error('  Project Settings → Service accounts → "Generate new private key"')
  console.error('Zapisz jako service-account.json w roocie projektu.\n')
  process.exit(2)
}

admin.initializeApp({ credential })
const db = admin.firestore()

// ─── do the grant ──────────────────────────────────────────────────────────────

const expiresAtMs = expires ? new Date(expires).getTime() : null
if (expires && Number.isNaN(expiresAtMs)) {
  console.error(`[ERROR] --expires nie jest valid date: "${expires}". Format: YYYY-MM-DD`)
  process.exit(3)
}

const userDataRef = db.collection('users').doc(uid).collection('data')

console.log(`\n[grant-premium] uid=${uid}`)
console.log(`[grant-premium] productId=${productId}`)
console.log(`[grant-premium] expires=${expires || 'lifetime (no expiration)'}`)
console.log(`[grant-premium] note="${note}"\n`)

// Sprawdź czy user istnieje (niekrytyczne — jeśli nie, dopisze i tak,
// ale ostrzeżemy)
try {
  const userRecord = await admin.auth().getUser(uid)
  console.log(`[grant-premium] User found: ${userRecord.email || userRecord.phoneNumber || '(anon)'}`)
} catch {
  console.warn(`[grant-premium] WARN: user not found in Firebase Auth — kontynuujemy zapis Firestore tak czy tak`)
}

// Sprawdź obecny stan Premium
try {
  const cur = await userDataRef.doc('premium_purchased').get()
  if (cur.exists && cur.data()?.value === true) {
    console.log(`[grant-premium] User has premium_purchased=true ALREADY. Re-affirming + updating meta.\n`)
  }
} catch {}

const batch = db.batch()
batch.set(userDataRef.doc('premium_purchased'), { value: true }, { merge: true })
batch.set(userDataRef.doc('premium_meta'), {
  value: {
    last_event: 'MANUAL_GRANT',
    last_event_at: Date.now(),
    expires_at: expiresAtMs,
    product_id: productId,
    store: 'manual',
    note,
  },
}, { merge: true })

await batch.commit()

console.log(`[grant-premium] ✅ Premium granted.`)
console.log(`[grant-premium] User powinien zobaczyć "Premium" w topbar przy następnym auth state change`)
console.log(`[grant-premium] (lub po reload — Firestore listener push'uje zmiany w real-time).\n`)

process.exit(0)
