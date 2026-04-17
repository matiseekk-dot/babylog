export function nowTime() {
  const d = new Date()
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0')
}

export function todayDate() {
  return new Date().toISOString().slice(0,10)
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
}

export function formatAge(months) {
  if (months < 1) return 'Noworodek'
  if (months === 1) return '1 miesiąc'
  if (months < 5) return `${months} miesiące`
  if (months < 12) return `${months} miesięcy`
  const y = Math.floor(months / 12)
  const m = months % 12
  if (m === 0) return y === 1 ? '1 rok' : `${y} lata`
  return `${y} r. ${m} mies.`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
}

export function calcParacetamol(weightKg) {
  const dose = Math.round(weightKg * 15)
  const mlStd = (dose / 24).toFixed(1) // 120mg/5ml = 24mg/ml
  const mlFort = (dose / 48).toFixed(1) // 240mg/5ml = 48mg/ml
  const maxDaily = Math.round(weightKg * 60)
  return { dose, mlStd, mlFort, maxDaily }
}

export function calcIbuprofen(weightKg, months) {
  if (months < 3) return null
  const dose = Math.round(weightKg * 10)
  const ml = (dose / 20).toFixed(1) // 100mg/5ml = 20mg/ml
  const maxDaily = Math.round(weightKg * 30)
  return { dose, ml, maxDaily }
}

export function getTempClass(temp) {
  if (temp < 36.0) return 'temp-sub'
  if (temp < 37.5) return 'temp-normal'
  if (temp < 38.5) return 'temp-fever'
  return 'temp-high'
}

export function getTempLabel(temp) {
  if (temp < 36.0) return 'Podgorączkowanie'
  if (temp < 37.5) return 'Prawidłowa'
  if (temp < 38.5) return 'Gorączka'
  return 'Wysoka gorączka'
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6)
}

export const genId = uid
