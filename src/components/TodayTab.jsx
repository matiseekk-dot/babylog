import React, { useMemo } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { todayDate } from '../utils/helpers'
import { t, useLocale } from '../i18n'

/**
 * TodayTab — centralny widok "co działo się dziś".
 *
 * v2.9.3: nowy główny tab. Jest miejscem do którego user wraca między
 * sesjami: szybki rzut oka na statystyki dnia + chronologiczny timeline
 * wszystkich wpisów dziś (feed/sleep/diaper/temp/meds).
 *
 * Status Card, Crisis Card, AlertBanner, OnboardingTipsBanner, EmptyStateHero
 * są renderowane WYŻEJ w App.jsx (przed `renderTab()`) — czyli pojawiają się
 * też tutaj. TodayTab dokłada timeline pod nimi.
 *
 * Timeline:
 *   - Czyta wpisy ze wszystkich kluczy via useFirestore (real-time updates)
 *   - Filtruje po dzisiejszej dacie
 *   - Sortuje chronologicznie odwrotnie (najnowsze na górze)
 *   - Każdy item — onClick przekierowuje do odpowiedniego taba
 *   - Empty state pokazany tylko gdy NIC się dziś nie wydarzyło
 *
 * Props:
 *   uid          — Firebase user ID (lub null dla guest)
 *   babyId       — aktywny profil dziecka
 *   onNavigate   — fn(tabId) — przełącz tab w bottom nav
 */
export default function TodayTab({ uid, babyId, onNavigate }) {
  useLocale()
  const today = todayDate()

  // Czytamy WSZYSTKIE źródła przez useFirestore — drobny duplicate listener
  // względem FeedTab/SleepTab/HealthTab gdy te są aktywne, ale pozwala
  // na real-time refresh timeline gdy user dodaje wpis FAB-em z TodayTab
  // bez przechodzenia do innego taba.
  const [feedLogs]   = useFirestore(uid, `feed_${babyId}`,   [])
  const [sleepLogs]  = useFirestore(uid, `sleep_${babyId}`,  [])
  const [diaperLogs] = useFirestore(uid, `diaper_${babyId}`, [])
  const [tempLogs]   = useFirestore(uid, `temp_${babyId}`,   [])
  const [medLogs]    = useFirestore(uid, `meds_${babyId}`,   [])

  // ── Statystyki dnia ───────────────────────────────────────────────────────
  const todayFeeds = feedLogs.filter(l => l.date === today)
  const todaySleeps = sleepLogs.filter(l => l.date === today)
  const todayDiapers = diaperLogs.filter(l => l.date === today)
  const todayTemps = tempLogs.filter(l => l.date === today)
  const todayMeds = medLogs.filter(l => l.date === today)

  const totalSleepMin = todaySleeps.reduce((s, l) => s + (l.durationMin || 0), 0)
  const sleepHours = Math.floor(totalSleepMin / 60)
  const sleepRemainder = totalSleepMin % 60

  const lastTemp = todayTemps.length > 0
    ? [...todayTemps].sort((a, b) => b.time.localeCompare(a.time))[0]
    : null

  // ── Timeline — łączymy wszystkie wpisy z tagiem typu i czasem ────────────
  const timeline = useMemo(() => {
    const items = []

    todayFeeds.forEach(l => {
      const amount = l.amount ? ` · ${l.amount} ml` : ''
      items.push({
        id: `feed-${l.id}`,
        time: l.time,
        sortKey: l.time,
        emoji: emojiForFeed(l.type),
        title: translateFeedType(l.type),
        sub: amount,
        targetTab: 'feed',
      })
    })

    todaySleeps.forEach(l => {
      // Sleep nie ma `time` field; używamy endTs (jeśli jest) → HH:MM,
      // inaczej startTs → HH:MM. Jeśli ani jednego, fallback do "—".
      const ts = l.endTs || l.startTs
      const time = ts ? formatTime(ts) : '—'
      const sortKey = ts ? formatTime(ts) : '00:00'
      const dur = l.durationMin || 0
      const h = Math.floor(dur / 60)
      const m = dur % 60
      const sub = h > 0 ? ` · ${h}h ${m}min` : ` · ${m} min`
      items.push({
        id: `sleep-${l.id}`,
        time,
        sortKey,
        emoji: '😴',
        title: t('today.timeline.sleep'),
        sub,
        targetTab: 'sleep',
      })
    })

    todayDiapers.forEach(l => {
      items.push({
        id: `diaper-${l.id}`,
        time: l.time,
        sortKey: l.time,
        emoji: emojiForDiaper(l.type),
        title: translateDiaperType(l.type),
        sub: '',
        targetTab: 'feed',  // Diaper jest sub-segmentem Feed taba
      })
    })

    todayTemps.forEach(l => {
      const tempVal = typeof l.temp === 'number' ? l.temp.toFixed(1) : l.temp
      items.push({
        id: `temp-${l.id}`,
        time: l.time,
        sortKey: l.time,
        emoji: '🌡️',
        title: `${tempVal}°C`,
        sub: l.method ? ` · ${l.method}` : '',
        targetTab: 'health',
      })
    })

    todayMeds.forEach(l => {
      items.push({
        id: `med-${l.id}`,
        time: l.time,
        sortKey: l.time,
        emoji: '💊',
        title: l.med || t('today.timeline.med'),
        sub: l.dose ? ` · ${l.dose}` : '',
        targetTab: 'health',
      })
    })

    // Sortuj odwrotnie chronologicznie (najnowsze na górze)
    return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  }, [todayFeeds, todaySleeps, todayDiapers, todayTemps, todayMeds])

  const totalEvents = timeline.length

  // Lokalizowana data: "wtorek, 26 kwietnia"
  const dateLabel = useMemo(() => {
    try {
      const d = new Date(today + 'T12:00:00')
      // Locale tabel pełnej daty zdefiniowany lokalnie — nie chcemy tu sięgać
      // do Intl bo różnica polski/angielski jest spora; trzymamy się i18n templates
      const weekday = t(`today.weekday.${d.getDay()}`)
      const month = t(`today.month.${d.getMonth()}`)
      return t('today.date_format', { weekday, day: d.getDate(), month })
    } catch {
      return today
    }
  }, [today])

  return (
    <div style={{ padding: '4px 0 80px' }}>
      {/* Header dnia */}
      <div style={{
        padding: '8px 16px 12px',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          marginBottom: 2,
        }}>
          {t('today.header')}
        </div>
        <div style={{
          fontSize: 18, fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.02em', textTransform: 'capitalize',
        }}>
          {dateLabel}
        </div>
      </div>

      {/* Quick stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
        padding: '0 16px 12px',
      }}>
        <StatTile
          emoji="🍼"
          value={todayFeeds.length}
          label={t('today.stat.feeds')}
          onClick={() => onNavigate('feed')}
          accent="#1D9E75"
          accentBg="#E1F5EE"
        />
        <StatTile
          emoji="😴"
          value={totalSleepMin > 0 ? `${sleepHours}h ${sleepRemainder}m` : '—'}
          label={t('today.stat.sleep')}
          onClick={() => onNavigate('sleep')}
          accent="#5346B3"
          accentBg="#EEEDFE"
        />
        <StatTile
          emoji="👶"
          value={todayDiapers.length}
          label={t('today.stat.diapers')}
          onClick={() => onNavigate('feed')}
          accent="#185FA5"
          accentBg="#E6F1FB"
        />
        <StatTile
          emoji="🌡️"
          value={lastTemp ? `${typeof lastTemp.temp === 'number' ? lastTemp.temp.toFixed(1) : lastTemp.temp}°` : '—'}
          label={lastTemp ? t('today.stat.last_temp') : t('today.stat.no_temp')}
          onClick={() => onNavigate('health')}
          accent="#D85A30"
          accentBg="#FEF3EE"
        />
      </div>

      {/* Timeline */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'var(--text-2)',
          padding: '8px 4px 6px',
          letterSpacing: '-0.01em',
        }}>
          {t('today.timeline.header')} {totalEvents > 0 && `· ${totalEvents}`}
        </div>

        {totalEvents === 0 ? (
          <div style={{
            padding: '32px 20px',
            textAlign: 'center',
            background: '#F7F7F5',
            borderRadius: 14,
            color: 'var(--text-3)',
            fontSize: 14, lineHeight: 1.5,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ marginBottom: 4, fontWeight: 600, color: 'var(--text-2)' }}>
              {t('today.timeline.empty_title')}
            </div>
            <div style={{ fontSize: 13 }}>
              {t('today.timeline.empty_hint')}
            </div>
          </div>
        ) : (
          <div style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {timeline.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.targetTab)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: i === 0 ? 'none' : '0.5px solid var(--border)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  minHeight: 52,
                }}
              >
                <div style={{
                  fontSize: 22, lineHeight: 1, flexShrink: 0,
                  width: 32, textAlign: 'center',
                }}>
                  {item.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.title}{item.sub && (
                      <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>{item.sub}</span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--text-3)',
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {item.time}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function StatTile({ emoji, value, label, onClick, accent, accentBg }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: accentBg,
        border: 'none',
        borderRadius: 12,
        padding: '12px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        minHeight: 68,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#5a5a56', fontWeight: 500 }}>
        {label}
      </div>
    </button>
  )
}

function formatTime(ts) {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function emojiForFeed(type) {
  if (!type) return '🍼'
  if (type.startsWith('Pierś')) return '🤱'
  if (type === 'Butelka' || type === 'Odciągnięte mleko') return '🍼'
  return '🍼'
}

function translateFeedType(type) {
  const map = {
    'Pierś lewa':           t('feed.quick.left'),
    'Pierś prawa':          t('feed.quick.right'),
    'Butelka':              t('feed.quick.bottle'),
    'Odciągnięte mleko':    t('today.feed.expressed'),
  }
  return map[type] || type
}

function emojiForDiaper(type) {
  if (!type) return '👶'
  if (type === 'Mokra' || type === 'Siku' || type === 'Nocnik-siku') return '💧'
  if (type === 'Brudna' || type === 'Kupa' || type === 'Nocnik-kupa') return '💩'
  if (type === 'Obydwie') return '🔄'
  return '👶'
}

function translateDiaperType(type) {
  const map = {
    'Mokra':       t('diaper.wet'),
    'Brudna':      t('diaper.dirty'),
    'Obydwie':     t('diaper.both'),
    'Nocnik-siku': t('diaper.potty_pee'),
    'Nocnik-kupa': t('diaper.potty_poo'),
    'Siku':        t('diaper.toilet_pee'),
    'Kupa':        t('diaper.toilet_poo'),
  }
  return map[type] || type
}
