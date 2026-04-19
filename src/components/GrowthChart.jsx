import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

/**
 * GrowthChart — extracted from GrowthTab so it can be lazy-loaded.
 * Recharts is ~150KB gzipped and shouldn't load until the user actually
 * opens the Growth tab with data.
 */
export default function GrowthChart({ data, dataKey }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={36} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="var(--green)"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
