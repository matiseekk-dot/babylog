import { useState } from 'react'

const PREFIX = 'babylog_'

function load(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key, value) {
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
