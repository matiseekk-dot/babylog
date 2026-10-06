// Karta "Będzie nas troje" (v2.17.2): obrazek 1080×1350 (format posta na
// Instagramie) rysowany na canvasie, bez sieci i bez zewnętrznych czcionek.

export const ANNOUNCE_W = 1080
export const ANNOUNCE_H = 1350

export const THEMES = {
  sage: { from: '#EAF5EE', to: '#CDE6D7', text: '#0F3D33', soft: '#1D9E75' },
  peach: { from: '#FDEDE5', to: '#F5D0BF', text: '#5A2A1C', soft: '#D85A30' },
  night: { from: '#1E2A44', to: '#33466F', text: '#F5F0E0', soft: '#F2C14E' },
}

// Pora roku terminu (półkula północna: tam jest większość użytkowników;
// dla innych zostaje wariant z miesiącem).
export function seasonIndex(ymd) {
  const m = Number(String(ymd).slice(5, 7))
  if (m === 12 || m <= 2) return 0  // zima
  if (m <= 5) return 1              // wiosna
  if (m <= 8) return 2              // lato
  return 3                          // jesień
}

export function dueYear(ymd) {
  return String(ymd).slice(0, 4)
}

/** "Styczeń 2027" w języku aplikacji (wielka litera na początku). */
export function monthYear(ymd, locale) {
  const d = new Date(`${ymd}T12:00:00`)
  if (isNaN(d.getTime())) return ''
  const s = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Rysuje kartę na canvasie.
 * @param {HTMLCanvasElement} canvas
 * @param {{ dateLine: string, headline: string, names?: string, theme?: string, footer?: string|null }} o
 */
export function drawAnnouncement(canvas, o) {
  const T = THEMES[o.theme] || THEMES.sage
  canvas.width = ANNOUNCE_W
  canvas.height = ANNOUNCE_H
  const ctx = canvas.getContext('2d')
  const W = ANNOUNCE_W
  const H = ANNOUNCE_H

  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, T.from)
  g.addColorStop(1, T.to)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Miękkie koła w tle.
  ctx.globalAlpha = o.theme === 'night' ? 0.07 : 0.12
  ctx.fillStyle = T.soft
  for (const [x, y, r] of [[150, 170, 210], [960, 300, 160], [880, 1170, 260], [110, 1110, 120]]) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = T.text

  // Data: pora roku albo miesiąc.
  ctx.font = '600 48px system-ui, -apple-system, Roboto, sans-serif'
  if ('letterSpacing' in ctx) ctx.letterSpacing = '6px'
  ctx.fillText(String(o.dateLine || '').toUpperCase(), W / 2, 330)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'

  ctx.font = '150px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
  ctx.fillText('👣', W / 2, 545)

  // Napis główny, zawijany.
  ctx.font = '600 112px Georgia, "Noto Serif", serif'
  const lines = wrap(ctx, o.headline, 900).slice(0, 3)
  const lineH = 128
  const top = 760 - ((lines.length - 1) * lineH) / 2
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lineH))

  if (o.names) {
    ctx.font = 'italic 54px Georgia, "Noto Serif", serif'
    ctx.globalAlpha = 0.85
    ctx.fillText(String(o.names).slice(0, 40), W / 2, top + lines.length * lineH + 40)
    ctx.globalAlpha = 1
  }

  drawFooter(ctx, o.footer)
  return canvas
}

function drawFooter(ctx, footer) {
  if (!footer) return
  ctx.font = '600 34px system-ui, -apple-system, Roboto, sans-serif'
  ctx.globalAlpha = 0.6
  ctx.fillText(`♡ ${footer}`, ANNOUNCE_W / 2, ANNOUNCE_H - 70)
  ctx.globalAlpha = 1
}

/**
 * Karta narodzin (v2.17.7): to samo tło co ogłoszenie ciąży, na środku imię,
 * pod nim data z godziną i (jeśli podane) waga i długość.
 * @param {HTMLCanvasElement} canvas
 * @param {{ kicker: string, name: string, dateLine: string, details?: string, parents?: string, theme?: string, footer?: string|null }} o
 */
export function drawBirthCard(canvas, o) {
  const T = THEMES[o.theme] || THEMES.sage
  canvas.width = ANNOUNCE_W
  canvas.height = ANNOUNCE_H
  const ctx = canvas.getContext('2d')
  const W = ANNOUNCE_W
  const H = ANNOUNCE_H

  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, T.from)
  g.addColorStop(1, T.to)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  ctx.globalAlpha = o.theme === 'night' ? 0.07 : 0.12
  ctx.fillStyle = T.soft
  for (const [x, y, r] of [[170, 150, 190], [980, 380, 150], [860, 1190, 250], [90, 1000, 130]]) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = T.text

  ctx.font = '600 48px system-ui, -apple-system, Roboto, sans-serif'
  if ('letterSpacing' in ctx) ctx.letterSpacing = '6px'
  ctx.fillText(String(o.kicker || '').toUpperCase(), W / 2, 290)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'

  ctx.font = '150px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
  ctx.fillText('👶', W / 2, 500)

  // Imię: duże, zmniejszane aż się zmieści w jednej linii.
  let size = 150
  ctx.font = `600 ${size}px Georgia, "Noto Serif", serif`
  const name = String(o.name || '').slice(0, 30)
  while (ctx.measureText(name).width > 920 && size > 70) {
    size -= 6
    ctx.font = `600 ${size}px Georgia, "Noto Serif", serif`
  }
  ctx.fillText(name, W / 2, 720)

  ctx.font = '600 50px system-ui, -apple-system, Roboto, sans-serif'
  ctx.fillText(String(o.dateLine || ''), W / 2, 840)
  let y = 840
  if (o.details) {
    y += 84
    ctx.font = '700 58px system-ui, -apple-system, Roboto, sans-serif'
    ctx.fillStyle = T.soft
    ctx.fillText(o.details, W / 2, y)
    ctx.fillStyle = T.text
  }
  if (o.parents) {
    ctx.font = 'italic 54px Georgia, "Noto Serif", serif'
    ctx.globalAlpha = 0.85
    ctx.fillText(String(o.parents).slice(0, 40), W / 2, y + 110)
    ctx.globalAlpha = 1
  }
  drawFooter(ctx, o.footer)
  return canvas
}
