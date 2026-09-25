// Vite dla screenshotów z zalogowanym kontem (emulatory Firebase).
// Run: npx vite --config scripts/screenshots/vite.emulators.config.mjs
//
// Różni się od vite.config.js tylko tym, że każdy import src/firebase.js
// trafia do scripts/screenshots/firebase.emulator.js.

import { mergeConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import base from '../../vite.config.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const REAL = path.resolve(here, '../../src/firebase.js').replace(/\\/g, '/')
const EMULATOR = path.resolve(here, 'firebase.emulator.js')

export default mergeConfig(base, {
  root: path.resolve(here, '../..'),
  server: { port: 5174, strictPort: true },
  plugins: [{
    name: 'firebase-emulator-swap',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!/(^|\/)firebase(\.js)?$/.test(source) || !importer) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (resolved && resolved.id.replace(/\\/g, '/') === REAL) return EMULATOR
      return null
    },
  }],
})
