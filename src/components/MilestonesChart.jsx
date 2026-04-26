import React, { useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis } from 'recharts'
import { t } from '../i18n'

/**
 * MilestonesChart — wykres scatter pokazujący kiedy dziecko osiągnęło każdy
 * milestone vs typowy wiek wg literatury pediatrycznej (CDC/Denver DDST).
 *
 * Pattern identyczny jak GrowthChart i TeethingChart:
 *   - Statyczne dane referencyjne (months: typowy wiek z MILESTONES array)
 *   - User data: kiedy zaznaczył milestone jako osiągnięty
 *   - BRAK clinical assessment / alertów
 *   - User sam patrzy na wykres i interpretuje
 *
 * Props:
 *   - milestones: MILESTONES array z polami { id, name, emoji, months }
 *   - done: { [milestoneId]: { date: 'YYYY-MM-DD' } | true } — z MilestonesTab
 *   - currentAgeMonths: number — bieżący wiek dziecka
 *   - showReference: bool (Premium feature)
 */
export default function MilestonesChart({
  milestones, done, currentAgeMonths, showReference = false,
}) {
  const { dataReference, dataUser, milestoneLabels } = useMemo(() => {
    if (!milestones?.length) return { dataReference: [], dataUser: [], milestoneLabels: [] }

    // Top 12 milestones — żeby wykres był czytelny
    const sorted = [...milestones].sort((a, b) => a.months - b.months).slice(0, 12)

    const labels = sorted.map((m, i) => ({
      pos: sorted.length - i, // odwracamy żeby wczesne milestone'y były wyżej
      name: m.name,
      emoji: m.emoji,
      months: m.months,
    }))

    const dataRef = sorted.map((m, i) => ({
      ageMonths: m.months,
      pos: sorted.length - i,
      name: m.name,
      emoji: m.emoji,
    }))

    // User data: tylko milestone'y zaznaczone jako done
    const dataU = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i]
      const userDone = done?.[m.id]
      if (!userDone) continue

      let userMonths
      // done[id] może być stringiem 'YYYY-MM-DD' (MilestonesTab) lub obiektem {date}
      let dateStr = null
      if (typeof userDone === 'string') {
        dateStr = userDone
      } else if (typeof userDone === 'object' && userDone.date) {
        dateStr = userDone.date
      }

      if (dateStr && currentAgeMonths != null) {
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          const daysAgo = Math.max(0, (today - d) / (1000 * 60 * 60 * 24))
          userMonths = currentAgeMonths - (daysAgo / 30.4375)
        }
      }

      if (userMonths == null) {
        // Fallback gdy zaznaczono bez daty — zakładamy "teraz"
        userMonths = currentAgeMonths || m.months
      }

      if (userMonths < 0) continue

      dataU.push({
        ageMonths: Math.round(userMonths * 10) / 10,
        pos: sorted.length - i,
        name: m.name,
        emoji: m.emoji,
      })
    }

    return { dataReference: dataRef, dataUser: dataU, milestoneLabels: labels }
  }, [milestones, done, currentAgeMonths])

  if (!milestones?.length) return null

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 16, bottom: 30, left: 90 }}>
            <XAxis
              type="number"
              dataKey="ageMonths"
              tick={{ fontSize: 11 }}
              label={{
                value: t('chart.age_months'),
                position: 'insideBottom',
                offset: -10,
                fontSize: 11,
                fill: 'var(--text-3)',
              }}
              domain={[0, 'dataMax + 2']}
            />
            <YAxis
              type="number"
              dataKey="pos"
              tick={{ fontSize: 10 }}
              ticks={milestoneLabels.map(l => l.pos)}
              tickFormatter={(value) => {
                const m = milestoneLabels.find(l => l.pos === value)
                if (!m) return ''
                const short = m.name.length > 14 ? m.name.slice(0, 12) + '…' : m.name
                return `${m.emoji} ${short}`
              }}
              domain={[0, milestoneLabels.length + 1]}
              width={90}
            />
            <ZAxis range={[80, 80]} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name, props) => {
                if (props.payload?.name) {
                  return [
                    `${Math.round(value * 10) / 10} ${t('chart.months_short')}`,
                    `${props.payload.emoji} ${props.payload.name}`,
                  ]
                }
                return [value, name]
              }}
            />

            {currentAgeMonths != null && currentAgeMonths > 0 && (
              <ReferenceLine
                x={currentAgeMonths}
                stroke="#9A9A94"
                strokeDasharray="2 2"
                label={{ value: t('chart.now'), fontSize: 10, position: 'top', fill: '#9A9A94' }}
              />
            )}

            {/* TYPOWY WIEK — niebieskie kropki (Premium) */}
            {showReference && (
              <Scatter
                name={t('milechart.typical')}
                data={dataReference}
                fill="#85B7EB"
                shape="circle"
              />
            )}

            {/* USER ACHIEVED — zielone kropki */}
            <Scatter
              name={t('milechart.achieved')}
              data={dataUser}
              fill="#1D9E75"
              shape="circle"
            />
          </ScatterChart>
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
        {showReference && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 8, height: 8, background: '#85B7EB',
              borderRadius: '50%', display: 'inline-block',
            }} />
            {t('milechart.typical')}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 8, height: 8, background: '#1D9E75',
            borderRadius: '50%', display: 'inline-block',
          }} />
          {t('milechart.achieved')}
        </span>
      </div>

      <div style={{
        marginTop: 'var(--space-snug)',
        fontSize: 10,
        color: 'var(--text-3)',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        {t('milechart.disclaimer')}
      </div>
    </div>
  )
}
