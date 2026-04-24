/**
 * Test setup — ładowany w beforeAll globalnie
 */

import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Ustaw polski locale ZANIM i18n się załaduje
if (typeof localStorage !== 'undefined') {
  try {
    localStorage.setItem('babylog_locale', 'pl')
  } catch {}
}

// Cleanup React components po każdym teście (inaczej DOM się kumuluje między testami)
afterEach(() => {
  cleanup()
})
