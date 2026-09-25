import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { t } from '../i18n'

/**
 * Wspólne konto — logika współdzielona przez Ustawienia, onboarding
 * i kartę zaproszenia na ekranie Dziś.
 */

const KNOWN_ERRORS = [
  'not-premium', 'too-many-partners', 'is-partner', 'invite-not-found',
  'invite-expired', 'own-invite', 'already-linked', 'has-partners',
]

export function partnerErrorText(err) {
  const code = err?.message
  return KNOWN_ERRORS.includes(code) ? t(`partner.error.${code}`) : t('partner.error.generic')
}

export async function callPartnerFn(name, data = {}) {
  const res = await httpsCallable(functions, name)(data)
  return res.data
}

/** Kod zaproszenia: 6 znaków A-Z/0-9, wielkie litery (partner wpisuje ręcznie). */
export function normalizeInviteCode(value) {
  return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

/**
 * Czy pokazać na ekranie Dziś kartę "Zaproś drugiego rodzica".
 *
 * Tylko właściciel konta z Premium (trial też), bez partnerów, który karty
 * nie zamknął. W trialu dopiero po ~2 dniach używania (trialDaysLeft ≤ 12) —
 * wcześniej rodzic jeszcze poznaje apkę. partnersCount === null znaczy, że
 * lista partnerów się ładuje — wtedy nie pokazujemy, żeby karta nie mignęła.
 */
export function shouldShowPartnerInvite({
  uid, isPartner, isPremium, isOnTrial, trialDaysLeft, partnersCount, dismissed,
}) {
  if (!uid || isPartner || !isPremium || dismissed) return false
  if (partnersCount !== 0) return false
  return isOnTrial ? trialDaysLeft <= 12 : true
}
