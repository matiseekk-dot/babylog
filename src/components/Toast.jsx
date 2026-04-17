import React, { useState, useEffect, useCallback } from 'react'

let _showToast = null

export function toast(message, type = 'success') {
  _showToast?.({ message, type, id: Date.now() })
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
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== item.id))
      }, 2200)
    }
    return () => { _showToast = null }
  }, [])

  if (!items.length) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(var(--nav-h, 64px) + 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'center',
      pointerEvents: 'none',
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
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 15 }}>{s.icon}</span>
            {item.message}
          </div>
        )
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  )
}
