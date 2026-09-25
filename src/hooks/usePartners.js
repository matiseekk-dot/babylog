import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { captureError } from '../sentry'

/**
 * Lista partnerów wspólnego konta właściciela (users/{authUid}/partners).
 * Zwraca null dopóki lista się ładuje (albo gdy wyłączone — np. dla partnera,
 * który sam nie ma partnerów), potem tablicę [{ uid, name, linkedAt }].
 */
export function usePartners(authUid, enabled = true) {
  const [partners, setPartners] = useState(null)

  useEffect(() => {
    setPartners(null)
    if (!authUid || !enabled) return
    return onSnapshot(
      collection(db, 'users', authUid, 'partners'),
      snap => setPartners(snap.docs.map(d => ({ uid: d.id, ...d.data() }))),
      err => captureError(err, { context: 'partners-list' }),
    )
  }, [authUid, enabled])

  return partners
}
