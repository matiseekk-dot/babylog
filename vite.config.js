import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Podział paczki (build.rollupOptions.output.manualChunks).
const NM = '[\\\\/]node_modules[\\\\/]'
const REACT_MODULES = new RegExp(`${NM}(react|react-dom|scheduler)[\\\\/]`)
// Recharts i jego zależności: pobierane dopiero z pierwszym wykresem.
const CHART_MODULES = new RegExp(`${NM}(recharts|recharts-scale|react-smooth|victory-vendor|d3-[^\\\\/]+|internmap|decimal\\.js-light|eventemitter3|lodash|tiny-invariant|fast-equals|react-transition-group|dom-helpers|clsx)[\\\\/]`)
// Firebase potrzebny na starcie (app, auth, firestore i ich wspólne moduły).
const FIREBASE_MODULES = new RegExp(`${NM}(firebase[\\\\/](app|auth|firestore)|@firebase[\\\\/](app|auth|firestore|component|util|logger|webchannel-wrapper))[\\\\/]`)

export default defineConfig({
  plugins: [react()],
  base: '/babylog/',
  publicDir: 'public',
  // Wstrzyknij wersję z package.json jako globalną stałą.
  // Używane w Settings > stopka ("Spokojny Rodzic v2.7.5").
  // Dzięki temu version bump wymaga tylko edycji package.json + git tag.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.js'],
    // functions/ ma własne testy (node --test functions/*.test.js)
    exclude: ['**/node_modules/**', '**/dist/**', 'functions/**'],
  },
  build: {
    assetsDir: 'assets',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // v2.16.12: przypisanie po ścieżce modułu. Forma obiektowa zostawiała
        // Reacta (moduły CommonJS) w chunku 'charts', więc wykresy (147 KB po
        // kompresji) pobierały się na starcie, choć same ładują się leniwie.
        manualChunks(id) {
          if (REACT_MODULES.test(id)) return 'react-vendor'
          if (CHART_MODULES.test(id)) return 'charts'
          if (FIREBASE_MODULES.test(id)) return 'firebase-vendor'
        },
      },
    },
  },
})
