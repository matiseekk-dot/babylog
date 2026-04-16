import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyBDpM68v2BAdMX3sxcMe6ypnOIoNMR2Z4w",
  authDomain:        "babylog-3c1cc.firebaseapp.com",
  projectId:         "babylog-3c1cc",
  storageBucket:     "babylog-3c1cc.firebasestorage.app",
  messagingSenderId: "955437303426",
  appId:             "1:955437303426:web:fbb2637420255e5561969b",
}

const app      = initializeApp(firebaseConfig)
export const auth     = getAuth(app)
export const db       = getFirestore(app)
export const provider = new GoogleAuthProvider()
