import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { getWhoPercentiles } from '../data/whoNorms'

/**
 * GrowthChart — wykres wzrostu dziecka z percentylami WHO w tle.
 *
 * Linie percentylowe:
 *   - P3, P15, P85, P97 — szare, cienkie (granice normy)
 *   - P50 (mediana) — zielona, kropkowana (środek)
 *   - Linia dziecka — pogrubiona, kolorowa
 *
 * Dane WHO są interpolowane dla każdego miesiąca wieku dziecka.
 * Jeśli brak daty urodzenia lub płci — pokazujemy tylko linię dziecka bez norm.
 *
 * Props:
 *   - data: [{ date, weight, height, headCirc, ageMonths }]
 *   - dataKey: 'weight' | 'height' | 'headCirc'
 *   - sex: 'M' | 'F' | null
 *   - showWhoNorms: bool (Premium feature)
 */
export default function GrowthChart({ data, dataKey, sex, showWhoNorms = false }) {
  // Jeśli brak płci — pokaż tylko linię dziecka
  const canShowWho = showWhoNorms && sex && (sex === 'M' || sex === 'F')

  // Generuj percentyle dla każdej daty na wykresie
  const enhancedData = useMemo(() => {
    if (!canShowWho) return data

    const whoType = dataKey === 'weight' ? 'weight'
                  : dataKey === 'height' ? 'height'
                  : 'head'

    return data.map(point => {
      const percentiles = point.ageMonths != null
        ? getWhoPercentiles(whoType, sex, point.ageMonths)
        : null

      return {
        ...point,
        P3: percentiles?.P3,
        P15: percentiles?.P15,
        P50: percentiles?.P50,
        P85: percentiles?.P85,
        P97: percentiles?.P97,
      }
    })
  }, [data, dataKey, sex, canShowWho])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={enhancedData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={36} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value, name) => {
            if (value == null) return ['—', name]
            const rounded = Number(value).toFixed(1)
            return [rounded, name]
          }}
        />

        {/* Linie percentylowe WHO — tylko jeśli mamy płeć i Premium */}
        {canShowWho && (
          <>
            <Line
              type="monotone"
              dataKey="P3"
              stroke="#D0D0CC"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="P3"
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="P15"
              stroke="#C0C0BB"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="P15"
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="P50"
              stroke="#1D9E75"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              name="P50 (mediana)"
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="P85"
              stroke="#C0C0BB"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="P85"
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="P97"
              stroke="#D0D0CC"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="P97"
              activeDot={false}
            />
          </>
        )}

        {/* Linia dziecka — pogrubiona, na wierzchu */}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#C95A48"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#C95A48' }}
          connectNulls
          name="Twoje dziecko"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
