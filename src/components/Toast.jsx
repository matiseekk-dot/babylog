import React, { useState, useEffect, useCallback } from 'react'

let _showToast = null

export function toast(message, type = 'success') {
  _showToast?.({ message, type, id: Date.now() })
}

export function toastWithUndo(message, onUndo) {
  _showToast?.({ message, type: 'warn', id: Date.now(), undo: onUndo })
}

const STYLES = {
  success: { bg: '#1D9E75', icon: '✓' },
  info:    { bg: '#185FA5', icon: 'ℹ' },
  warn:    { bg: '#BA7517', icon: '!' },
  error:   { bg: '#D85A30', icon: '✕' },
}

export default function ToastContainer() {
  const [items, setItems] = useState([])

  useEffect(() => {
    _showToast = (item) => {
      setItems(prev => [...prev, item])
      const duration = item.undo ? 5000 : 2200
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== item.id))
      }, duration)
    }
    return () => { _showToast = null }
  }, [])

  if (!items.length) return null

  return (
    // v2.11.27: z-index 9999 + bottom 24px (zamiast nav+12 ~76px).
    // Wcześniej:
    //   • z-index 999 — modal-backdrop ma z-index 200, ale modal-sheet jest
    //     w środku z opaque background — toast się rendere POD nim wizualnie
    //     mimo wyższego z-index (bo modal-sheet stacking context).
    //   • bottom: nav+12 (~76px) — modal sheet zajmuje dolne ~80% ekranu
    //     (max-height: 90dvh), toast wlatywał w obszar modal sheet i był
    //     przykryty.
    // Teraz:
    //   • z-index: 9999 — wyższy niż modal-backdrop (200).
    //   • Top position dla widzialności gdy modal otwarty.
    <div style={{
      position: 'fixed',
      top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'center',
      pointerEvents: 'none',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      {items.map(item => {
        const s = STYLES[item.type] || STYLES.success
        return (
          <div key={item.id} style={{
            background: s.bg,
            color: '#fff',
            borderRadius: 24,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            animation: 'toastIn 0.2s ease',
            // v2.11.27: zostawiamy zawijanie tekstu — długi tekst by się ucinał
            // przy nowrap. Maks szerokość trzyma rozmiar w viewport.
            maxWidth: '100%',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 15 }}>{s.icon}</span>
            <span>{item.message}</span>
            {item.undo && (
              <button
                onClick={() => {
                  item.undo()
                  setItems(prev => prev.filter(i => i.id !== item.id))
                }}
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  border: 'none', borderRadius: 12,
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  padding: '4px 10px', cursor: 'pointer', marginLeft: 4,
                  pointerEvents: 'auto',
                }}
              >
                ↶
              </button>
            )}
          </div>
        )
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  )
}
