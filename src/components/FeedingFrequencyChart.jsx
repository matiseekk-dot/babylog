import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'
import { t } from '../i18n'
import { getFeedingRange } from '../data/feedingNorms'

/**
 * FeedingFrequencyChart — wykres liczby karmień / dzień vs typowy zakres
 * AAP/ESPGHAN dla wieku dziecka.
 *
 * Pattern identyczny jak SleepChart/GrowthChart:
 *   - Statyczne dane referencyjne (zakresy karmień wg wieku z AAP/ESPGHAN)
 *   - User data: agregacja liczby karmień (mleko) / dzień
 *   - BRAK clinical assessment / alertów
 *   - User sam patrzy i interpretuje
 *
 * Liczy TYLKO karmienia mlekiem (pierś + butelka + mleko mod.). Posiłki stałe
 * (BLW, papki, łyżeczki) są tracking'owane ale NIE liczone do tej metryki —
 * normy AAP/ESPGHAN dotyczą tylko karmień mlecznych.
 *
 * Props:
 *   - feedLogs: array z FeedTab — { date: 'YYYY-MM-DD', type: 'Pierś left'/... }
 *   - currentAgeMonths: number — bieżący wiek dziecka
 *   - showReference: bool (Premium feature)
 *   - daysWindow: number = 14 — ile ostatnich dni pokazać
 */
export default function FeedingFrequencyChart({ feedLogs, currentAgeMonths, showReference = false, daysWindow = 14 }) {
  // ── Filtr: tylko karmienia MLECZNE (pierś + butelka + mleko mod.) ────────
  // Posiłki stałe (BLW/papki) są w `type` jako 'Stały', 'BLW', 'Papka' itd.
  const isMilkFeed = (type) => {
    if (!type) return false
    const t = String(type).toLowerCase()
    return t.includes('pierś')
        || t.includes('breast')
        || t.includes('butelka')
        || t.includes('bottle')
        || t.includes('mleko')
        || t.includes('milk')
        || t.includes('formula')
        || t.includes('mod.')
  }

  // ── Agregacja liczby karmień / dzień ──────────────────────────────────────
  const chartData = useMemo(() => {
    if (!feedLogs?.length) return []

    const byDate = {}
    for (const log of feedLogs) {
      if (!log?.date) continue
      if (!isMilkFeed(log.type)) continue
      byDate[log.date] = (byDate[log.date] || 0) + 1
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = []
    for (let i = daysWindow - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ymd = d.toISOString().slice(0, 10)
      days.push({
        date: ymd,
        dateLabel: `${d.getDate()}.${d.getMonth() + 1}`,
        count: byDate[ymd] || 0,
      })
    }

    // 7-day rolling avg
    for (let i = 0; i < days.length; i++) {
      const start = Math.max(0, i - 6)
      const window = days.slice(start, i + 1)
      const validDays = window.filter(d => d.count > 0)
      if (validDays.length >= 3) {
        const sum = validDays.reduce((s, d) => s + d.count, 0)
        days[i].rollingAvg = Math.round((sum / validDays.length) * 10) / 10
      }
    }

    return days
  }, [feedLogs, daysWindow])

  const referenceRange = useMemo(() => {
    if (!showReference || currentAgeMonths == null) return null
    return getFeedingRange(currentAgeMonths)
  }, [currentAgeMonths, showReference])

  const hasAnyData = chartData.some(d => d.count > 0)
  if (!hasAnyData) {
    return (
      <div style={{
        padding: 'var(--space)',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text-3)',
      }}>
        {t('feedchart.empty')}
      </div>
    )
  }

  const allValues = chartData.map(d => d.count).filter(c => c > 0)
  const userMax = Math.max(...allValues, 0)
  const refMax = referenceRange?.feedingsMax || 0
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
              width={28}
              domain={[0, yMax]}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value, name) => {
                if (value == null) return ['—', name]
                const labels = {
                  count: t('feedchart.count'),
                  rollingAvg: t('feedchart.rolling'),
                }
                return [Math.round(value * 10) / 10, labels[name] || name]
              }}
            />

            {/* TYPOWY ZAKRES (Premium) */}
            {referenceRange && (
              <ReferenceArea
                y1={referenceRange.feedingsMin}
                y2={referenceRange.feedingsMax}
                fill="#9FE1CB"
                fillOpacity={0.18}
                stroke="#9FE1CB"
                strokeOpacity={0.4}
                strokeDasharray="3 3"
                label={{
                  value: `${referenceRange.feedingsMin}-${referenceRange.feedingsMax}/d`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#0F6E56',
                }}
              />
            )}

            {/* USER LINE — dzienna liczba karmień */}
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--brand-500)"
              strokeWidth={2}
              dot={{ fill: '#1D9E75', r: 2.5 }}
              connectNulls={false}
              name="count"
            />

            {/* 7-day rolling avg */}
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
          {t('feedchart.daily')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 12, height: 2,
            backgroundImage: 'linear-gradient(to right, #0F6E56 50%, transparent 50%)',
            backgroundSize: '6px 2px', display: 'inline-block',
          }} />
          {t('feedchart.rolling')}
        </span>
        {referenceRange && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 8, background: '#9FE1CB', opacity: 0.4, display: 'inline-block', borderRadius: 2 }} />
            {t('feedchart.typical_range')} ({referenceRange.label})
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
        {t('feedchart.disclaimer')}
      </div>
    </div>
  )
}
