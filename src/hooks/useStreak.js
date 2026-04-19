import { useState, useEffect } from 'react'

const LS_KEY = 'babylog_streak'

/**
 * useStreak
 *
 * Trackuje liczbę kolejnych dni korzystania z apki.
 * Jeśli rodzic nie otworzy apki ponad 48h → streak reset.
 *
 * Zwraca:
 *   streak         — aktualna seria dni
 *   isNewRecord    — czy dzisiaj to nowy rekord
 *   lastMilestone  — ostatni osiągnięty milestone (7, 14, 30, 60, 100 dni)
 */
export function useStreak() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return { current: 0, best: 0, lastSeen: null, celebratedMilestone: 0 }
  })

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    if (state.lastSeen === today) return // already counted today

    let newCurrent = 1
    if (state.lastSeen === yesterday) {
      newCurrent = state.current + 1
    } else if (state.lastSeen === null) {
      newCurrent = 1
    } else {
      // gap detected — reset
      newCurrent = 1
    }

    const newState = {
      current: newCurrent,
      best: Math.max(state.best, newCurrent),
      lastSeen: today,
      celebratedMilestone: state.celebratedMilestone,
    }

    try { localStorage.setItem(LS_KEY, JSON.stringify(newState)) } catch {}
    setState(newState)
  }, [])

  // Check if we just hit a milestone
  const MILESTONES = [3, 7, 14, 30, 60, 100, 365]
  const currentMilestone = MILESTONES.reverse().find(m => state.current >= m) || 0
  const shouldCelebrate = currentMilestone > state.celebratedMilestone

  const celebrate = () => {
    const newState = { ...state, celebratedMilestone: currentMilestone }
    try { localStorage.setItem(LS_KEY, JSON.stringify(newState)) } catch {}
    setState(newState)
  }

  return {
    streak: state.current,
    bestStreak: state.best,
    milestone: shouldCelebrate ? currentMilestone : null,
    celebrate,
  }
}
