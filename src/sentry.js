/**
 * Sentry — error monitoring dla apki medycznej
 *
 * ZEROCONFIGURACYJNE: nie wymaga instalacji @sentry/react żeby apka
 * się zbudowała. Jeśli pakiet nie jest zainstalowany — no-op.
 *
 * SETUP:
 * 1. Załóż konto na sentry.io (free tier: 5000 events/mies)
 * 2. Stwórz projekt typu "React"
 * 3. Skopiuj DSN (format: https://xxx@o000.ingest.sentry.io/000)
 * 4. Wklej do stałej SENTRY_DSN poniżej
 * 5. Zainstaluj pakiet: npm install @sentry/react
 * 6. `npm run build` — Sentry zacznie łapać errory w produkcji
 *
 * GDZIE ZOBACZYĆ BŁĘDY:
 * sentry.io → Projects → babylog → Issues
 */

// ⚠️ WKLEJ SWÓJ DSN TUTAJ (z sentry.io → Settings → Projects → babylog → Client Keys)
const SENTRY_DSN = ''  // np. 'https://abc123@o123.ingest.sentry.io/456'

// Flaga — czy Sentry udało się zainicjalizować
let sentryReady = false

export async function initSentry() {
  // Skip jeśli DSN nie ustawiony (dev / przed setupem konta)
  if (!SENTRY_DSN) return

  // Skip w dev (nie zaśmiecaj błędami z hot reload)
  if (import.meta.env.DEV) return

  try {
    // Dynamic import z vite-ignore żeby bundler nie próbował resolve przy build
    const Sentry = await import(/* @vite-ignore */ '@sentry/react')
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Failed to fetch',
      ],
      beforeSend(event) {
        if (event.request?.url) {
          event.request.url = event.request.url.replace(/[\w.-]+@[\w.-]+/g, '[email]')
        }
        return event
      },
    })
    sentryReady = true
  } catch (e) {
    // Pakiet @sentry/react nie zainstalowany lub init failed — nie blokuj apki
    if (import.meta.env.DEV) {
      console.warn('Sentry not available (install @sentry/react to enable):', e.message)
    }
  }
}

/**
 * captureError — wywołuj w catch bloków krytycznych
 * No-op jeśli Sentry niezainicjalizowany.
 */
export function captureError(error, context = {}) {
  if (!sentryReady) {
    console.error('captureError:', error, context)
    return
  }
  import(/* @vite-ignore */ '@sentry/react').then(Sentry => {
    Sentry.captureException(error, { extra: context })
  }).catch(() => {})
}
