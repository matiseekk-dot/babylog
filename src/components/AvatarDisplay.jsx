import React from 'react'

/**
 * AvatarDisplay — jednolity render awatara dziecka.
 *
 * Prezentacja:
 *   - Jeśli profile.avatarPhoto (URL lub data URL) → <img> okrągłe
 *   - W przeciwnym razie → emoji z profile.avatar (fallback)
 *
 * v2.14.0 — dodane dla Premium photo avatar feature.
 * Zachowuje backwards compat z emoji-only profilami z poprzednich wersji.
 *
 * Props:
 *   profile — {avatar, avatarPhoto?, avatarColor?}
 *   size    — px (kolo, 1:1) — domyślnie 40
 *   style   — dodatkowe inline styles
 */
export default function AvatarDisplay({ profile, size = 40, style = {} }) {
  const baseStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    ...style,
  }

  if (profile?.avatarPhoto) {
    return (
      <span style={baseStyle}>
        <img
          src={profile.avatarPhoto}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) => {
            // Photo nie ładuje się (URL wygasł, offline, etc.) — fallback do emoji
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement.textContent = profile.avatar || '👶'
            e.currentTarget.parentElement.style.fontSize = `${Math.round(size * 0.6)}px`
            e.currentTarget.parentElement.style.background = profile.avatarColor || '#FFD6E8'
          }}
        />
      </span>
    )
  }

  // Emoji fallback (legacy profile bez photo)
  return (
    <span
      style={{
        ...baseStyle,
        background: profile?.avatarColor || '#FFD6E8',
        fontSize: Math.round(size * 0.6),
      }}
    >
      {profile?.avatar || '👶'}
    </span>
  )
}
