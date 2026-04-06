import React from 'react'

const FEATURES = [
  {
    icon: '🌡️',
    title: 'Analiza temperatury',
    desc: 'Trend rosnący / stabilny / spadający w czasie rzeczywistym',
  },
  {
    icon: '🚨',
    title: 'Alerty zdrowotne',
    desc: 'Powiadomienia o gorączce, niedoborze snu i lekach',
  },
  {
    icon: '💡',
    title: 'Wskazówki co teraz zrobić',
    desc: 'Kontekstowe komunikaty dopasowane do stanu dziecka',
  },
  {
    icon: '💊',
    title: 'Inteligentny kalkulator leków',
    desc: 'Informacja kiedy można podać kolejną dawkę',
  },
  {
    icon: '😴',
    title: 'Ocena jakości snu',
    desc: 'Porównanie z normą wiekową i rekomendacje',
  },
]

/**
 * PaywallScreen
 *
 * Props:
 *   onActivate  – fn() wywoływane po naciśnięciu CTA (podpiąć pod płatność)
 *   onClose     – fn() zamknięcie paywall bez zakupu
 */
export default function PaywallScreen({ onActivate, onClose }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      background: '#fff',
    }}>

      {/* Zamknij */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16, right: 16,
          background: 'rgba(0,0,0,0.06)',
          border: 'none',
          borderRadius: '50%',
          width: 36, height: 36,
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#5a5a56',
          zIndex: 1,
        }}
        aria-label="Zamknij"
      >
        ✕
      </button>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0F6E56 0%, #1D9E75 60%, #5DCAA5 100%)',
        padding: '48px 24px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍼</div>
        <div style={{
          fontSize: 24, fontWeight: 800,
          color: '#fff',
          lineHeight: 1.25,
          letterSpacing: -0.5,
        }}>
          Spokojny Rodzic<br />Premium
        </div>
        <div style={{
          fontSize: 14, color: 'rgba(255,255,255,0.8)',
          marginTop: 8, lineHeight: 1.5,
        }}>
          Pełna analiza danych dziecka.<br />
          Wiesz więcej — martwisz się mniej.
        </div>
      </div>

      {/* Lista funkcji */}
      <div style={{ flex: 1, padding: '20px 20px 0' }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '13px 0',
            borderBottom: i < FEATURES.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none',
          }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 10,
              background: '#E1F5EE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a18', marginBottom: 2 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 12, color: '#5a5a56', lineHeight: 1.4 }}>
                {f.desc}
              </div>
            </div>
            <div style={{
              marginLeft: 'auto', flexShrink: 0,
              color: '#1D9E75', fontSize: 16, marginTop: 10,
            }}>
              ✓
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '20px 20px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>

        {/* Cena */}
        <div style={{
          textAlign: 'center',
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#1a1a18' }}>14,99 zł</span>
          <span style={{ fontSize: 14, color: '#9a9a94', marginLeft: 4 }}>/ miesiąc</span>
          <div style={{ fontSize: 12, color: '#9a9a94', marginTop: 3 }}>
            Anuluj w dowolnym momencie
          </div>
        </div>

        {/* Przycisk główny */}
        <button
          onClick={onActivate}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 17,
            fontWeight: 800,
            cursor: 'pointer',
            minHeight: 54,
            letterSpacing: -0.2,
          }}
        >
          Odblokuj spokój
        </button>

        <div style={{
          textAlign: 'center',
          fontSize: 11,
          color: '#9a9a94',
          marginTop: 10,
          lineHeight: 1.5,
        }}>
          Płatność przez App Store / Google Play.<br />
          Brak ukrytych opłat.
        </div>
      </div>
    </div>
  )
}
