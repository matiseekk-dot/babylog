import React, { useEffect } from 'react'
import { useStreak } from '../hooks/useStreak'
import { toast } from './Toast'
import { t, useLocale } from '../i18n'

/**
 * StreakBadge — pokazuje aktualną serię dni w topbarze
 * + automatyczny toast przy milestone
 */
export default function StreakBadge() {
  useLocale()
  const { streak, milestone, celebrate } = useStreak()

  useEffect(() => {
    if (milestone) {
      toast(t('streak.milestone', { days: milestone }) + ' 🎉', 'success')
      celebrate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestone])

  if (streak < 2) return null

  // Color tiers
  let bg = '#FEF3EE', color = '#BA5417'  // bronze
  if (streak >= 7)   { bg = '#FEF9F0'; color = '#854F0B' } // copper
  if (streak >= 30)  { bg = '#E1F5EE'; color = '#0F6E56' } // green
  if (streak >= 100) { bg = '#EEEDFE'; color = '#3C3489' } // purple

  return (
    <div
      title={t('streak.tooltip', { days: streak })}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: bg, color,
        borderRadius: 20, padding: '3px 9px',
        fontSize: 11, fontWeight: 700,
      }}
    >
      🔥 {streak}
    </div>
  )
}
