// Zamiennik src/firebase.js dla screenshotów wymagających zalogowanego konta.
//
// Podpinany przez vite.emulators.config.mjs (plugin resolveId) — produkcyjny
// src/firebase.js zostaje nietknięty. Łączy się z lokalnymi emulatorami
// Auth (9099) i Firestore (8080), bez App Check, Analytics i FCM.
//
// window.__emu udostępnia skryptowi puppeteer logowanie i zapis danych demo.

import { initializeApp } from 'firebase/app'
import {
  getAuth, GoogleAuthProvider, connectAuthEmulator, signInWithCredential,
} from 'firebase/auth'
import {
  getFirestore, connectFirestoreEmulator, doc, setDoc,
} from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

const app = initializeApp({
  apiKey:     'demo-key',
  authDomain: 'babylog-3c1cc.firebaseapp.com',
  projectId:  'babylog-3c1cc',
  appId:      '1:955437303426:web:fbb2637420255e5561969b',
})

export const VAPID_KEY = ''
export const appCheck  = null

export const auth     = getAuth(app)
export const provider = new GoogleAuthProvider()
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

export const db = getFirestore(app)
connectFirestoreEmulator(db, '127.0.0.1', 8080)

// Funkcje zostają na produkcyjnym adresie — skrypt przechwytuje te requesty
// w puppeteer i odpowiada danymi demo (np. kod zaproszenia).
export const functions = getFunctions(app, 'europe-west3')
export const storage   = getStorage(app)

export async function getAnalyticsIfSupported() { return null }
export async function getMessagingIfSupported() { return null }

window.__emu = {
  async signIn(sub, name) {
    // Bez e-maila — karta Konto pokaże wtedy samo imię.
    const cred = GoogleAuthProvider.credential(JSON.stringify({ sub, name }))
    const res = await signInWithCredential(auth, cred)
    return res.user.uid
  },
  async seed(uid, docs, partners) {
    for (const [key, value] of Object.entries(docs)) {
      await setDoc(doc(db, 'users', uid, 'data', key), { value })
    }
    for (const [partnerUid, data] of Object.entries(partners)) {
      await setDoc(doc(db, 'users', uid, 'partners', partnerUid), data)
    }
  },
}
