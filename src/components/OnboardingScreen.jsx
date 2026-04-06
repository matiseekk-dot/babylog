import React, { useState } from 'react'

// ─── Dane slajdów ─────────────────────────────────────────────────────────────

const SLIDES = [
  {
    emoji: '📋',
    accentColor: '#1D9E75',
    accentLight: '#E1F5EE',
    title: 'Zapisuj zdrowie\ndziecka',
    body: 'Temperatura, karmienie, sen, leki — wszystko w jednym miejscu. Szybko, bez zbędnych kroków.',
    note: null,
  },
  {
    emoji: '🔍',
    accentColor: '#185FA5',
    accentLight: '#E6F1FB',
    title: 'Zrozum\nco się dzieje',
    body: 'Aplikacja analizuje dane i pokazuje czy temperatura rośnie, czy sen jest poniżej normy i kiedy można podać kolejną dawkę leku.',
    note: 'Bez szukania w Google o 3 w nocy.',
  },
  {
    emoji: '💡',
    accentColor: '#BA7517',
    accentLight: '#FAEEDA',
    title: 'Wiedz\nco zrobić',
    body: 'Konkretne wskazówki dopasowane do stanu dziecka. Aplikacja podpowiada — Ty decydujesz.',
    note: 'Mniej stresu. Więcej spokoju.',
  },
]

// ─── Pomocnicze ───────────────────────────────────────────────────────────────

function Dot({ active, color }) {
  return (
    <div style={{
      width: active ? 20 : 7,
      height: 7,
      borderRadius: 4,
      background: active ? color : 'rgba(0,0,0,0.12)',
      transition: 'width 0.25s ease, background 0.25s ease',
    }} />
  )
}

// ─── Komponent główny ─────────────────────────────────────────────────────────

/**
 * OnboardingScreen
 *
 * Props:
 *   onComplete – fn() wywoływane po kliknięciu "Zaczynamy" na ostatnim slajdzie
 */
export default function OnboardingScreen({ onComplete }) {
  const [current, setCurrent] = useState(0)
  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1

  const next = () => {
    if (isLast) { onComplete(); return }
    setCurrent(c => c + 1)
  }

  const skip = () => onComplete()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#fff',
      userSelect: 'none',
    }}>

      {/* Pomiń — prawy górny róg */}
      {!isLast && (
        <button
          onClick={skip}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none',
            fontSize: 14, color: '#9a9a94',
            cursor: 'pointer', padding: '8px 4px',
            fontFamily: 'inherit',
          }}
        >
          Pomiń
        </button>
      )}

      {/* Ilustracja / Hero */}
      <div style={{
        flex: '0 0 auto',
        background: slide.accentLight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 32px 48px',
        transition: 'background 0.3s ease',
      }}>
        {/* Duże emoji w kółku */}
        <div style={{
          width: 96, height: 96,
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          boxShadow: `0 4px 20px ${slide.accentColor}22`,
          marginBottom: 28,
        }}>
          {slide.emoji}
        </div>

        {/* Tytuł */}
        <div style={{
          fontSize: 26,
          fontWeight: 800,
          color: '#1a1a18',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: -0.5,
          whiteSpace: 'pre-line',
        }}>
          {slide.title}
        </div>
      </div>

      {/* Treść */}
      <div style={{
        flex: 1,
        padding: '28px 28px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <p style={{
          fontSize: 16,
          color: '#3a3a36',
          lineHeight: 1.65,
          margin: 0,
        }}>
          {slide.body}
        </p>

        {slide.note && (
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            color: slide.accentColor,
            marginTop: 16,
            lineHeight: 1.4,
          }}>
            {slide.note}
          </p>
        )}
      </div>

      {/* Dolna część: dots + przycisk */}
      <div style={{
        padding: '24px 28px',
        paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        alignItems: 'center',
      }}>

        {/* Dots nawigacja */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === current} color={slide.accentColor} />
          ))}
        </div>

        {/* Przycisk */}
        <button
          onClick={next}
          style={{
            width: '100%',
            padding: '16px',
            background: slide.accentColor,
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 17,
            fontWeight: 800,
            cursor: 'pointer',
            minHeight: 54,
            letterSpacing: -0.2,
            transition: 'background 0.2s ease',
          }}
        >
          {isLast ? 'Zaczynamy 🍼' : 'Dalej'}
        </button>

        {/* Pozycjonowanie — subline na ostatnim slajdzie */}
        {isLast && (
          <p style={{
            fontSize: 12,
            color: '#9a9a94',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Aplikacja, która pomaga Ci wiedzieć co robić,<br />
            gdy dziecko jest chore.
          </p>
        )}
      </div>
    </div>
  )
}
