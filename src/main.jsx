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
      let lang = 'pl'
      try {
        const saved = localStorage.getItem('babylog_locale')
        if (saved === 'en' || saved === 'pl') {
          lang = saved
        } else if (typeof navigator !== 'undefined' && navigator.language?.startsWith('en')) {
          lang = 'en'
        }
      } catch {}
      const strings = lang === 'en' ? {
        title: 'Something went wrong',
        body: 'The app encountered an error. Your data is safe. Click below to try again.',
        btn: 'Reload app',
      } : {
        title: 'Coś poszło nie tak',
        body: 'Apka napotkała błąd. Twoje dane są bezpieczne. Kliknij poniżej, żeby spróbować ponownie.',
        btn: 'Przeładuj aplikację',
      }
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
