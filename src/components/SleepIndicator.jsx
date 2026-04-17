import React, { useState, useEffect } from 'react'
import { formatDuration } from '../utils/helpers'

/**
 * SleepIndicator
 * Shows active sleep timer in topbar when sleep is being tracked.
 * Props:
 *   startTs  – timestamp (ms) when sleep started, null if not running
 *   onPress  – navigate to sleep tab
 */
export default function SleepIndicator({ startTs, onPress }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startTs) { setElapsed(0); return }
    const tick = () => setElapsed(Math.floor((Date.now() - startTs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTs])

  if (!startTs) return null

  return (
    <button
      onClick={onPress}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: '#EEEDFE', color: '#3C3489',
        border: 'none', borderRadius: 20,
        padding: '4px 10px', fontSize: 11, fontWeight: 700,
        cursor: 'pointer', animation: 'sleepPulse 2s ease-in-out infinite',
      }}
    >
      🌙 {formatDuration(elapsed)}
      <style>{`
        @keyframes sleepPulse {
          0%,100%{opacity:1} 50%{opacity:0.7}
        }
      `}</style>
    </button>
  )
}
