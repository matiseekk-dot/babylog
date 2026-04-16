import React, { useState } from 'react'

export default function LoginScreen({ onLogin, loading }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async () => {
    setBusy(true)
    setError(null)
    try {
      await onLogin()
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Nie udało się zalogować. Spróbuj ponownie.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: '#fff',
    }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0F6E56 0%, #1D9E75 60%, #5DCAA5 100%)',
        padding: '72px 32px 48px',
        textAlign: 'center',
        flex: '0 0 auto',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🍼</div>
        <div style={{
          fontSize: 26, fontWeight: 800, color: '#fff',
          letterSpacing: -0.5, lineHeight: 1.2,
        }}>
          Spokojny Rodzic
        </div>
        <div style={{
          fontSize: 14, color: 'rgba(255,255,255,0.8)',
          marginTop: 10, lineHeight: 1.5,
        }}>
          Aplikacja, która pomaga Ci wiedzieć<br />co robić, gdy dziecko jest chore.
        </div>
      </div>

      {/* Treść */}
      <div style={{ flex: 1, padding: '36px 28px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Benefity */}
        {[
          { icon: '☁️', text: 'Dane synchronizowane między urządzeniami' },
          { icon: '🔒', text: 'Twoje dane są prywatne i bezpieczne' },
          { icon: '📱', text: 'Działa offline — nawet bez internetu' },
        ].map(b => (
          <div key={b.icon} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#E1F5EE', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{b.icon}</div>
            <span style={{ fontSize: 14, color: '#3a3a36', lineHeight: 1.4 }}>{b.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        padding: '28px 28px',
        paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
      }}>
        {error && (
          <div style={{
            fontSize: 13, color: '#712B13', background: '#FAECE7',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14, textAlign: 'center',
          }}>{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={busy || loading}
          style={{
            width: '100%', padding: '15px',
            background: busy || loading ? '#9a9a94' : '#fff',
            color: '#3a3a36',
            border: '0.5px solid rgba(0,0,0,0.15)',
            borderRadius: 14, fontSize: 16, fontWeight: 700,
            cursor: busy || loading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            minHeight: 54,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >
          {/* Google G icon */}
          {!busy ? (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          ) : (
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid #ccc', borderTopColor: '#1D9E75',
              animation: 'spin .8s linear infinite',
            }} />
          )}
          {busy ? 'Logowanie...' : 'Zaloguj się przez Google'}
        </button>

        <p style={{
          fontSize: 11, color: '#9a9a94', textAlign: 'center',
          marginTop: 14, lineHeight: 1.5,
        }}>
          Kontynuując, akceptujesz naszą Politykę Prywatności.<br />
          Twoje dane zdrowotne są przechowywane tylko na Twoim koncie Google.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
