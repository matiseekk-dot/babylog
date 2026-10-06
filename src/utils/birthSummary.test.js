import { describe, it, expect } from 'vitest'
import { birthSummary, parseBirthWeight, parseBirthLength } from './birthSummary'

describe('birthSummary', () => {
  const profile = { dueDate: '2026-10-20', birthDate: '2026-10-15', termDays: 280 }

  it('tydzień przy porodzie i dni przed terminem', () => {
    const s = birthSummary({ profile, locale: 'pl' })
    expect(s.ga).toEqual({ weeks: 39, days: 2 })
    expect(s.earlyDays).toBe(5)
    expect(birthSummary({ profile: { ...profile, birthDate: '2026-10-22' }, locale: 'pl' }).earlyDays).toBe(-2)
  })

  it('Francja liczy w SA (termin 287 dni)', () => {
    const s = birthSummary({ profile: { ...profile, termDays: 287 }, locale: 'fr' })
    expect(s.ga).toEqual({ weeks: 40, days: 2 })
  })

  it('liczy skurcze, sesje ruchów, torbę i badania (bez notatek)', () => {
    const s = birthSummary({
      profile,
      locale: 'pl',
      contractions: [{ id: 'a', start: 1, end: 2 }, { id: 'b', start: 3, end: null }, null],
      kicks: [{ id: 'k', start: 1, end: 2, count: 10 }],
      lists: { bag: { id: true, notes: true } },
      exams: { 'w0:0': true, 'w0:1': false, 'note:w0': 'ok' },
    })
    expect(s.contractions).toBe(2)
    expect(s.kicks).toBe(1)
    expect(s.bag.done).toBe(2)
    expect(s.exams).toBe(1)
  })

  it('bez terminu: brak tygodnia, zera zamiast błędów', () => {
    const s = birthSummary({ profile: { birthDate: '2026-10-15' }, locale: 'en' })
    expect(s.ga).toBeNull()
    expect(s.earlyDays).toBeNull()
    expect(s.contractions).toBe(0)
  })

  it('waga: gramy albo kilogramy, zakres', () => {
    expect(parseBirthWeight('3450')).toBe(3450)
    expect(parseBirthWeight('3,45')).toBe(3450)
    expect(parseBirthWeight('')).toBeNull()
    expect(parseBirthWeight('12000')).toBeNaN()
    expect(parseBirthWeight('abc')).toBeNaN()
  })

  it('długość w cm', () => {
    expect(parseBirthLength('54')).toBe(54)
    expect(parseBirthLength('52,5')).toBe(52.5)
    expect(parseBirthLength('')).toBeNull()
    expect(parseBirthLength('540')).toBeNaN()
  })
})
