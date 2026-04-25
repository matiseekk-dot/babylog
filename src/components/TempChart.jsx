import { t, useLocale } from '../i18n'
import React, { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Dot
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempColor(temp) {
  if (temp >= 39)   return '#A32D2D'
  if (temp >= 38.5) return '#D85A30'
  if (temp >= 38.0) return '#BA7517'
  if (temp >= 37.5) return '#639922'
  return '#1D9E75'
}

function formatHour(dateStr, timeStr) {
  if (!dateStr || !timeStr) return ''
  const [h] = timeStr.split(':').map(Number)
  // Zwracamy HH:00 — format uniwersalny dla PL i EN, omija iOS Safari toLocaleTimeString
  return `${String(h).padStart(2, '0')}:00`
}

function hoursAgo(dateStr, timeStr) {
  if (!dateStr || !timeStr) return Infinity
  const ref = new Date(dateStr + 'T00:00:00')
  const [h, m] = timeStr.split(':').map(Number)
  ref.setHours(h, m, 0, 0)
  return (Date.now() - ref.getTime()) / 3600000
}

// ─── Custom Dot ───────────────────────────────────────────────────────────────

function TempDot(props) {
  const { cx, cy, payload } = props
  if (!payload?.temp) return null
  const color = tempColor(payload.temp)
  const r = payload.temp >= 38.5 ? 6 : 4
  return <circle cx={cx} cy={cy} r={r} fill={color} stroke="#fff" strokeWidth={1.5} />
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function TempTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const color = tempColor(d.temp)
  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${color}`,
      borderRadius: 8, padding: '6px 10px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color }}>{Number(d.temp).toFixed(1)}°C</div>
      <div style={{ color: '#5a5a56', marginTop: 2 }}>{d.label}</div>
      {d.method && <div style={{ color: '#9a9a94' }}>{
        d.method === 'Odbytniczo' ? t('temp.method.rectal')
      : d.method === 'Pod pachą'  ? t('temp.method.axillary')
      : d.method === 'W uchu'     ? t('temp.method.ear')
      : d.method === 'Na czole'   ? t('temp.method.forehead')
      : d.method
    }</div>}
    </div>
  )
}

// ─── Trend badge ─────────────────────────────────────────────────────────────

function TrendBadge({ data }) {
  useLocale()
  if (data.length < 2) return null
  const recent = data.slice(-3)
  let trend = 'stable'
  if (recent.length >= 2) {
    const diff = recent[recent.length-1].temp - recent[0].temp
    if (diff > 0.3) trend = 'rising'
    else if (diff < -0.3) trend = 'falling'
  }
  const CFG = {
    rising:  { label: t('temp.chart.rising'),  color: '#D85A30', bg: '#FAECE7' },
    falling: { label: t('temp.chart.falling'), color: '#1D9E75', bg: '#E1F5EE' },
    stable:  { label: t('temp.chart.stable'),  color: '#185FA5', bg: '#E6F1FB' },
  }
  const c = CFG[trend]
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      color: c.color, background: c.bg,
      padding: '2px 8px', borderRadius: 20,
    }}>
      {c.label}
    </span>
  )
}

// ─── Główny komponent ─────────────────────────────────────────────────────────

/**
 * TempChart
 * Props:
 *   logs – pełna lista pomiarów temperatury
 */
export default function TempChart({ logs }) {
  const [window, setWindow] = useState(24) // 24h lub 48h

  if (!logs?.length) return null

  // Filtruj do wybranego okna czasowego
  const filtered = logs
    .filter(l => hoursAgo(l.date, l.time) <= window)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  if (!filtered.length) return null

  const chartData = filtered.map(l => ({
    temp: Number(l.temp),
    label: `${l.date?.slice(5) || ''} ${l.time || ''}`,
    method: l.method,
    time: l.time,
    date: l.date,
  }))

  const temps = chartData.map(d => d.temp)
  const minTemp = Math.max(35.5, Math.min(...temps) - 0.5)
  const maxTemp = Math.min(42, Math.max(...temps) + 0.5)

  return (
    <div className="card" style={{ padding: '12px 14px', margin: '8px 16px 0' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
            {t('tempchart.last', { hours: window })}
          </span>
          <TrendBadge data={chartData} />
        </div>
        {/* Przełącznik 24h/48h */}
        <div style={{ display: 'flex', background: 'var(--gray-light)', borderRadius: 8, padding: 2, gap: 2 }}>
          {[24, 48].map(h => (
            <button
              key={h}
              onClick={() => setWindow(h)}
              style={{
                padding: '3px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                background: window === h ? 'var(--surface)' : 'transparent',
                color: window === h ? 'var(--text)' : 'var(--text-3)',
                boxShadow: window === h ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Legenda poziomów */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        {[
          { label: 'Norma', color: '#1D9E75', range: '< 37.5°' },
          { label: t('temp.chart.subfebrile'), color: '#639922', range: '37.5–38°' },
          { label: t('temp.chart.fever'), color: '#BA7517', range: '38–38.5°' },
          { label: t('temp.chart.high'), color: '#D85A30', range: '≥ 38.5°' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{l.range}</span>
          </div>
        ))}
      </div>

      {/* Wykres */}
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>

            {/* Strefy kolorowe */}
            <ReferenceArea y1={35.5} y2={37.5} fill="#E1F5EE" fillOpacity={0.4} />
            <ReferenceArea y1={37.5} y2={38.0} fill="#EAF3DE" fillOpacity={0.5} />
            <ReferenceArea y1={38.0} y2={38.5} fill="#FAEEDA" fillOpacity={0.5} />
            <ReferenceArea y1={38.5} y2={42}   fill="#FAECE7" fillOpacity={0.4} />

            {/* Linie referencyjne */}
            <ReferenceLine y={37.5} stroke="#639922" strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine y={38.0} stroke="#BA7517" strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine y={38.5} stroke="#D85A30" strokeDasharray="3 3" strokeWidth={1.5} />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'var(--text-3)' }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[minTemp, maxTemp]}
              tick={{ fontSize: 10, fill: 'var(--text-3)' }}
              width={32}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v.toFixed(1)}°`}
            />
            <Tooltip content={<TempTooltip />} />
            <Line
              type="monotone"
              dataKey="temp"
              stroke="#BA7517"
              strokeWidth={2}
              dot={<TempDot />}
              activeDot={{ r: 7, fill: '#BA7517', stroke: '#fff', strokeWidth: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pusty stan dla okna */}
      {chartData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
          {t('temp.chart.no_data', {hours: window})}
        </div>
      )}
    </div>
  )
}
