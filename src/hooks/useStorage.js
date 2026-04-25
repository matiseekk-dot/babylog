import { useState } from 'react'

const PREFIX = 'babylog_'
const GUEST_PREFIX = 'babylog_guest_'

/**
 * Wybiera odpowiedni prefix:
 *  - jeśli klucz istnieje pod `babylog_<key>` → tego używa (zalogowany user)
 *  - inaczej → próbuje `babylog_guest_<key>` (tryb gościa)
 *
 * BUG-FIX (v2.7.5): Wcześniej zawsze używał `babylog_*`, przez co w trybie
 * gościa silnik reguł i reminder-engine nie widziały żadnych wpisów (są one
 * zapisywane przez useFirestore pod `babylog_guest_*`).
 */
function resolveKey(key) {
  try {
    const userKey = PREFIX + key
    if (localStorage.getItem(userKey) !== null) return userKey
    return GUEST_PREFIX + key
  } catch {
    return PREFIX + key
  }
}

function load(key, fallback) {
  try {
    const v = localStorage.getItem(resolveKey(key))
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key, value) {
  // Zapis: zawsze pod oryginalnym prefiksem (apka decyduje przez useFirestore).
  // useStorage jest używany do read-only-style operacji w hookach engine'u.
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch {}
}

export function useStorage(key, fallback) {
  const [state, setState] = useState(() => load(key, fallback))

  const set = (val) => {
    const next = typeof val === 'function' ? val(state) : val
    save(key, next)
    setState(next)
  }

  return [state, set]
}

export function saveToStorage(key, value) {
  save(key, value)
}

export function loadFromStorage(key, fallback) {
  return load(key, fallback)
}
