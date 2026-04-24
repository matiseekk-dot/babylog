import React from 'react'

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  const titleId = title ? `modal-title-${Math.random().toString(36).slice(2, 8)}` : undefined
  return (
    <div
      className="modal-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="modal-sheet">
        <div className="modal-handle" aria-hidden="true" />
        {title && <div className="modal-title" id={titleId}>{title}</div>}
        {children}
      </div>
    </div>
  )
}
