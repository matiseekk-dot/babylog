import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initSentry, captureError } from './sentry'

// Inicjalizuj Sentry przed renderem (lazy, nie blokuje startu)
initSentry()

// ErrorBoundary — ostatnia linia obrony przed białym ekranem
class AppErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    captureError(error, errorInfo)
    console.error('App crash:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // ErrorBoundary musi być odporny na crash i18n.js — czytamy locale
      // bezpośrednio z localStorage/navigator (bez importu i18n).
      // v2.16.10: 5 języków (wcześniej DE/FR/ES widziały ten ekran po polsku).
      const STRINGS = {
        pl: { title: 'Coś poszło nie tak', body: 'Aplikacja napotkała błąd. Twoje dane są bezpieczne. Dotknij poniżej, żeby spróbować ponownie.', btn: 'Przeładuj aplikację' },
        en: { title: 'Something went wrong', body: 'The app ran into an error. Your data is safe. Tap below to try again.', btn: 'Reload app' },
        de: { title: 'Etwas ist schiefgelaufen', body: 'Die App hat einen Fehler festgestellt. Ihre Daten sind sicher. Tippen Sie unten, um es erneut zu versuchen.', btn: 'App neu laden' },
        fr: { title: 'Un problème est survenu', body: 'L’application a rencontré une erreur. Vos données sont en sécurité. Touchez ci-dessous pour réessayer.', btn: 'Recharger l’appli' },
        es: { title: 'Algo ha salido mal', body: 'La app ha encontrado un error. Tus datos están a salvo. Toca abajo para intentarlo de nuevo.', btn: 'Recargar la app' },
      }
      let lang = 'pl'
      try {
        const saved = localStorage.getItem('babylog_locale')
        const nav = typeof navigator !== 'undefined' ? (navigator.language || '').slice(0, 2) : ''
        if (STRINGS[saved]) lang = saved
        else if (STRINGS[nav]) lang = nav
      } catch {}
      const strings = STRINGS[lang]
      return (
        <div style={{
          padding: '40px 24px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 400,
          margin: '0 auto',
          paddingTop: '20vh',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#1a1a18' }}>
            {strings.title}
          </h1>
          <p style={{ fontSize: 14, color: '#5a5a56', lineHeight: 1.5, marginBottom: 24 }}>
            {strings.body}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 48,
            }}
          >
            {strings.btn}
          </button>
          {import.meta.env.DEV && (
            <pre style={{
              marginTop: 24,
              padding: 12,
              background: '#f7f7f5',
              borderRadius: 8,
              fontSize: 11,
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 200,
            }}>
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
)
