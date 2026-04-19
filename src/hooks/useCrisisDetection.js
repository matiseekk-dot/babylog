import { useState, useEffect } from 'react'

/**
 * useCrisisDetection(tempLogs, ageMonths)
 *
 * Analizuje dane dziecka i zwraca poziom zagrożenia:
 *   - null (brak kryzysu)
 *   - { severity: 'watch', reason }
 *   - { severity: 'call', reason }
 *   - { severity: 'emergency', reason }
 *
 * UWAGA: tempLogs są przekazywane z useFirestore (w App.jsx), nie czytane z localStorage.
 * Dzięki temu działa zarówno dla guest jak i zalogowanego usera.
 *
 * Reguły kliniczne:
 *   - < 3 mies. + temp ≥ 38.0°C        → call
 *   - < 3 mies. + temp ≥ 39.0°C        → emergency
 *   - dowolny wiek + temp ≥ 40.0°C     → emergency
 *   - temp ≥ 39.5°C                    → call
 *   - temp ≥ 38.5°C trwa > 72h         → call
 *   - temp ≥ 38.5°C                    → watch
 */
export function useCrisisDetection(tempLogs, ageMonths) {
  const [crisis, setCrisis] = useState(null)
  const [dismissedId, setDismissedId] = useState(null)

  useEffect(() => {
    // Skip if no logs — oszczędza baterię (BUG-PERF-002)
    if (!tempLogs || !tempLogs.length) {
      setCrisis(null)
      return
    }

    const check = () => {
      const sorted = [...tempLogs].sort((a, b) =>
        (b.date + b.time).localeCompare(a.date + a.time)
      )
      const latest = sorted[0]
      const temp = Number(latest.temp)

      const latestTs = dateTimeToTs(latest.date, latest.time)
      const minutesAgo = (Date.now() - latestTs) / 60000

      // Stare pomiary (>6h) nie są już aktualne
      if (minutesAgo > 360) { setCrisis(null); return }

      let result = null

      if (temp >= 40.0) {
        result = { id: `em-${latest.id}`, severity: 'emergency',
          reason: `Temperatura ${temp.toFixed(1)}°C — bardzo wysoka gorączka` }
      } else if (ageMonths < 3 && temp >= 39.0) {
        result = { id: `em-${latest.id}`, severity: 'emergency',
          reason: `Niemowlę < 3 mies. z temp. ${temp.toFixed(1)}°C` }
      } else if (ageMonths < 3 && temp >= 38.0) {
        result = { id: `call-${latest.id}`, severity: 'call',
          reason: `Niemowlę < 3 mies. z gorączką ${temp.toFixed(1)}°C — skonsultuj z pediatrą` }
      } else if (temp >= 39.5) {
        result = { id: `call-${latest.id}`, severity: 'call',
          reason: `Wysoka gorączka ${temp.toFixed(1)}°C` }
      } else if (temp >= 38.5) {
        result = { id: `watch-${latest.id}`, severity: 'watch',
          reason: `Gorączka ${temp.toFixed(1)}°C — monitoruj co 1-2h` }
      }

      // Prolonged fever check
      if (!result && sorted.length >= 3) {
        const last3 = sorted.slice(0, 3)
        const allFeverish = last3.every(l => Number(l.temp) >= 38.5)
        if (allFeverish) {
          const firstTs = dateTimeToTs(last3[2].date, last3[2].time)
          const hoursSpan = (Date.now() - firstTs) / 3600000
          if (hoursSpan >= 72) {
            result = { id: `call-prolonged-${last3[2].id}`, severity: 'call',
              reason: `Gorączka utrzymuje się > 72h — konieczna konsultacja` }
          }
        }
      }

      if (result && result.id === dismissedId) result = null
      setCrisis(result)
    }

    check()
    const id = setInterval(check, 60000) // co 60s (dla oszczędności baterii)
    return () => clearInterval(id)
  }, [tempLogs, ageMonths, dismissedId])

  const dismiss = () => {
    if (crisis?.id) setDismissedId(crisis.id)
  }

  return { crisis, dismiss }
}

function dateTimeToTs(dateStr, timeStr) {
  const d = new Date(dateStr)
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}
