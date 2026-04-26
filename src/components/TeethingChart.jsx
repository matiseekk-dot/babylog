import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { t } from '../i18n'

/**
 * TeethingChart — wykres liczby wyrżniętych zębów vs typowy zakres wiekowy.
 *
 * Pattern identyczny jak GrowthChart z percentylami WHO:
 *   - Statyczne dane referencyjne (zakresy AAPD — typowy wiek wyrżnięcia każdego z 20 zębów)
 *   - User data nakładkowo (linia kumulacyjna ile zębów dziecko ma w wieku X)
 *   - BRAK clinical assessment / alertów "twoje dziecko jest opóźnione"
 *
 * To jest information surface — user sam patrzy i interpretuje.
 *
 * Props:
 *   - teeth: { [toothId]: { date: 'YYYY-MM-DD', note?: string } } (z TeethingTab)
 *   - teethDef: TEETH array z TeethingTab (z polami id, typical: '6-10')
 *   - currentAgeMonths: number — bieżący wiek dziecka w miesiącach (z profilu)
 *   - showReference: bool (Premium feature)
 */
export default function TeethingChart({ teeth, teethDef, currentAgeMonths, showReference = false }) {
  // ── Wiek dziecka w dacie wyrżnięcia każdego zęba ────────────────────────────
  const userPoints = useMemo(() => {
    if (currentAgeMonths == null) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const erupted = Object.entries(teeth || {})
      .filter(([id, t]) => t?.date)
      .map(([id, t]) => {
        const eruptDate = new Date(t.date)
        if (isNaN(eruptDate.getTime())) return null
        const daysAgo = Math.max(0, (today - eruptDate) / (1000 * 60 * 60 * 24))
        const ageAtErupt = currentAgeMonths - (daysAgo / 30.4375)
        if (ageAtErupt < 0) return null
        return { toothId: id, ageMonths: ageAtErupt }
      })
      .filter(Boolean)
      .sort((a, b) => a.ageMonths - b.ageMonths)

    if (!erupted.length) return []

    const points = []
    let count = 0
    for (const e of erupted) {
      count++
      points.push({
        ageMonths: Math.round(e.ageMonths * 10) / 10,
        teeth: count,
      })
    }
    return points
  }, [teeth, currentAgeMonths])

  // ── Statyczne dane referencyjne (3 linie: dolny, środek, górny zakres) ─────
  const referencePoints = useMemo(() => {
    if (!showReference || !teethDef) return []

    const sorted = [...teethDef]
      .map(td => {
        const [min, max] = (td.typical || '').split('-').map(Number)
        if (isNaN(min) || isNaN(max)) return null
        return { id: td.id, min, max }
      })
      .filter(Boolean)
      .sort((a, b) => a.min - b.min)

    const points = []
    for (let i = 0; i < sorted.length; i++) {
      const tooth = sorted[i]
      points.push({ ageMonths: tooth.min, countEarly: i + 1 })
      points.push({ ageMonths: (tooth.min + tooth.max) / 2, countMedian: i + 1 })
      points.push({ ageMonths: tooth.max, countLate: i + 1 })
    }
    return points
  }, [teethDef, showReference])

  const chartData = useMemo(() => {
    const map = new Map()

    for (const p of referencePoints) {
      const key = p.ageMonths
      const existing = map.get(key) || { ageMonths: p.ageMonths }
      map.set(key, {
        ...existing,
        ...(p.countEarly != null ? { countEarly: p.countEarly } : {}),
        ...(p.countMedian != null ? { countMedian: p.countMedian } : {}),
        ...(p.countLate != null ? { countLate: p.countLate } : {}),
      })
    }

    for (const p of userPoints) {
      const key = p.ageMonths
      const existing = map.get(key) || { ageMonths: p.ageMonths }
      map.set(key, { ...existing, teeth: p.teeth })
    }

    return [...map.values()].sort((a, b) => a.ageMonths - b.ageMonths)
  }, [userPoints, referencePoints])

  if (!userPoints.length && !showReference) {
    return (
      <div style={{
        padding: 'var(--space)',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text-3)',
      }}>
        {t('teethchart.empty')}
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 20, left: 0 }}>
            <XAxis
              dataKey="ageMonths"
              tick={{ fontSize: 11 }}
              type="number"
              domain={[0, 36]}
              ticks={[0, 6, 12, 18, 24, 30, 36]}
              label={{ value: t('chart.age_months'), position: 'insideBottom', offset: -8, fontSize: 11, fill: 'var(--text-3)' }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              width={30}
              domain={[0, 20]}
              ticks={[0, 5, 10, 15, 20]}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value, name) => {
                if (value == null) return ['—', name]
                const labels = {
                  teeth: t('teethchart.your_child'),
                  countEarly: t('teethchart.early'),
                  countMedian: t('teethchart.typical'),
                  countLate: t('teethchart.late'),
                }
                return [Math.round(value), labels[name] || name]
              }}
              labelFormatter={(label) => `${label} ${t('chart.months_short')}`}
            />

            {/* REFERENCE LINES — typowy zakres (Premium) */}
            {showReference && (
              <>
                <Line
                  type="monotone"
                  dataKey="countEarly"
                  stroke="#D0D0CC"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="countMedian"
                  stroke="#9FE1CB"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="countLate"
                  stroke="#D0D0CC"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls
                />
              </>
            )}

            {/* USER LINE */}
            {userPoints.length > 0 && (
              <Line
                type="stepAfter"
                dataKey="teeth"
                stroke="var(--brand-500)"
                strokeWidth={2.5}
                dot={{ fill: '#1D9E75', r: 3 }}
                connectNulls
              />
            )}
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
        {userPoints.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 2, background: '#1D9E75', display: 'inline-block' }} />
            {t('teethchart.your_child')}
          </span>
        )}
        {showReference && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 1.5, background: '#9FE1CB', display: 'inline-block' }} />
            {t('teethchart.typical_range')}
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
        {t('teethchart.disclaimer')}
      </div>
    </div>
  )
}
