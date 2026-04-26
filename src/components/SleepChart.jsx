import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'
import { t } from '../i18n'
import { getSleepRange } from '../data/sleepNorms'

/**
 * SleepChart — wykres dziennego snu vs typowy zakres wg wieku.
 *
 * Pattern identyczny jak GrowthChart/TeethingChart/MilestonesChart:
 *   - Statyczne dane referencyjne (AAP/NSF zakresy snu wg wieku)
 *   - User data: agregacja godzin snu / dzień
 *   - BRAK clinical assessment / alertów
 *   - Information surface — user sam patrzy i interpretuje
 *
 * Wykres pokazuje ostatnie 14 dni:
 *   - Zielona linia: faktyczne godziny snu / dzień
 *   - Zielona kropkowana linia: 7-day rolling average (smoother trend)
 *   - Zielona strefa (Premium): typowy zakres dla bieżącego wieku dziecka
 *
 * Props:
 *   - sleepLogs: array z FeedTab/SleepTab — { date: 'YYYY-MM-DD', durationMin }
 *   - currentAgeMonths: number — bieżący wiek dziecka
 *   - showReference: bool (Premium feature)
 *   - daysWindow: number = 14 — ile ostatnich dni pokazać
 */
export default function SleepChart({ sleepLogs, currentAgeMonths, showReference = false, daysWindow = 14 }) {
  // ── Agregacja godzin snu / dzień + 7-day rolling avg ──────────────────────
  const chartData = useMemo(() => {
    if (!sleepLogs?.length) return []

    // Bucket logów po dacie
    const byDate = {}
    for (const log of sleepLogs) {
      if (!log?.date || log.durationMin == null) continue
      byDate[log.date] = (byDate[log.date] || 0) + log.durationMin
    }

    // Buduj last N days backwards from today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = []
    for (let i = daysWindow - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ymd = d.toISOString().slice(0, 10)
      const minutes = byDate[ymd] || 0
      days.push({
        date: ymd,
        dateLabel: `${d.getDate()}.${d.getMonth() + 1}`,
        hours: Math.round((minutes / 60) * 10) / 10,
      })
    }

    // Rolling 7-day average (centered, but here last-7-day trailing)
    for (let i = 0; i < days.length; i++) {
      const start = Math.max(0, i - 6)
      const window = days.slice(start, i + 1)
      const validHours = window.filter(d => d.hours > 0)
      if (validHours.length >= 3) {
        const sum = validHours.reduce((s, d) => s + d.hours, 0)
        days[i].rollingAvg = Math.round((sum / validHours.length) * 10) / 10
      }
    }

    return days
  }, [sleepLogs, daysWindow])

  // ── Typowy zakres dla aktualnego wieku ─────────────────────────────────────
  const referenceRange = useMemo(() => {
    if (!showReference || currentAgeMonths == null) return null
    return getSleepRange(currentAgeMonths)
  }, [currentAgeMonths, showReference])

  // ── Pusty stan ──────────────────────────────────────────────────────────────
  const hasAnyData = chartData.some(d => d.hours > 0)
  if (!hasAnyData) {
    return (
      <div style={{
        padding: 'var(--space)',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text-3)',
      }}>
        {t('sleepchart.empty')}
      </div>
    )
  }

  // Y-axis domain — uwzględnia user data + reference range
  const allValues = chartData.map(d => d.hours).filter(h => h > 0)
  const userMax = Math.max(...allValues, 0)
  const refMax = referenceRange?.hoursMax || 0
  const yMax = Math.max(userMax, refMax) + 2

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 20, left: 0 }}>
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(daysWindow / 7))}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              width={36}
              domain={[0, yMax]}
              ticks={[0, 4, 8, 12, 16, 20]}
              label={{ value: 'h', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-3)' }}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value, name) => {
                if (value == null) return ['—', name]
                const labels = {
                  hours: t('sleepchart.hours'),
                  rollingAvg: t('sleepchart.rolling'),
                }
                return [`${value} h`, labels[name] || name]
              }}
            />

            {/* TYPOWY ZAKRES (Premium) — pasek tła */}
            {referenceRange && (
              <ReferenceArea
                y1={referenceRange.hoursMin}
                y2={referenceRange.hoursMax}
                fill="#9FE1CB"
                fillOpacity={0.18}
                stroke="#9FE1CB"
                strokeOpacity={0.4}
                strokeDasharray="3 3"
                label={{
                  value: `${referenceRange.hoursMin}-${referenceRange.hoursMax}h`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#0F6E56',
                }}
              />
            )}

            {/* USER LINE — dzienny sen */}
            <Line
              type="monotone"
              dataKey="hours"
              stroke="var(--brand-500)"
              strokeWidth={2}
              dot={{ fill: '#1D9E75', r: 2.5 }}
              connectNulls={false}
              name="hours"
            />

            {/* USER LINE — 7-day rolling avg (smoother trend) */}
            <Line
              type="monotone"
              dataKey="rollingAvg"
              stroke="#0F6E56"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              name="rollingAvg"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space)',
        justifyContent: 'center',
        marginTop: 'var(--space-snug)',
        fontSize: 11,
        color: 'var(--text-2)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 2, background: '#1D9E75', display: 'inline-block' }} />
          {t('sleepchart.daily')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 12, height: 2, background: '#0F6E56', display: 'inline-block',
            backgroundImage: 'linear-gradient(to right, #0F6E56 50%, transparent 50%)',
            backgroundSize: '6px 2px',
          }} />
          {t('sleepchart.rolling')}
        </span>
        {referenceRange && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 8, background: '#9FE1CB', opacity: 0.4, display: 'inline-block', borderRadius: 2 }} />
            {t('sleepchart.typical_range')} ({referenceRange.label})
          </span>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: 'var(--space-snug)',
        fontSize: 10,
        color: 'var(--text-3)',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        {t('sleepchart.disclaimer')}
      </div>
    </div>
  )
}
