import React, { useRef, useState } from 'react'
import { t, useLocale } from '../i18n'
import { uploadAvatar, deleteAvatar } from '../utils/avatarStorage'

/**
 * PhotoAvatarPicker — modal do wyboru/upload zdjęcia dziecka jako awatar.
 *
 * v2.14.0 — Premium feature. Free user'y widzą PremiumTeaser zamiast tego
 * (gate w parent components).
 *
 * Flow:
 *   1. User klika "Wybierz z galerii" → input file → wybiera zdjęcie
 *   2. Preview (canvas cropped do kwadratu 512×512)
 *   3. Klik "Zapisz" → upload do Firebase Storage (albo localStorage dla guesta)
 *   4. Zwraca URL do parent przez onSaved(url)
 *
 * Props:
 *   open        — czy modal widoczny
 *   uid         — Firebase Auth UID (null = guest, użyj localStorage)
 *   profileId   — id profilu (klucz w storage)
 *   currentUrl  — obecne zdjęcie (do pokazania preview + "Usuń")
 *   onClose     — fn(): user zamknął modal bez zmian
 *   onSaved     — fn(url): user zapisał nowe zdjęcie (URL)
 *   onDeleted   — fn(): user usunął zdjęcie (wraca do emoji)
 */
export default function PhotoAvatarPicker({ open, uid, profileId, currentUrl, onClose, onSaved, onDeleted }) {
  useLocale()
  const fileInputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(currentUrl || null)
  const [pendingFile, setPendingFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Validation
    if (!file.type.startsWith('image/')) {
      setError(t('avatar.error.not_image'))
      return
    }
    // Max 10 MB przed compresją (canvas i tak zmniejszy)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('avatar.error.too_large'))
      return
    }
    setError('')
    setPendingFile(file)
    // Local preview przed uploadem
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!pendingFile) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadAvatar(uid, profileId, pendingFile)
      onSaved(url)
    } catch (err) {
      setError(err?.message || t('avatar.error.upload_failed'))
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    setUploading(true)
    setError('')
    try {
      await deleteAvatar(uid, profileId)
      onDeleted()
    } catch (err) {
      setError(err?.message || t('avatar.error.delete_failed'))
      setUploading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, padding: 24,
        maxWidth: 400, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{
          fontSize: 20, fontWeight: 800, textAlign: 'center',
          margin: '0 0 16px', color: '#1a1a18',
        }}>
          {t('avatar.picker.title')}
        </h2>

        {/* Preview kwadratowe 200×200 */}
        <div style={{
          width: 200, height: 200, margin: '0 auto 20px',
          borderRadius: 100, overflow: 'hidden',
          background: '#F0EEEA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '3px solid #D77460',
        }}>
          {previewUrl ? (
            <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 72 }}>👶</span>
          )}
        </div>

        {/* File input (ukryte, wywoływane przez button) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {error && (
          <div style={{
            padding: '8px 12px', background: '#FEE2E2', color: '#991B1B',
            borderRadius: 8, fontSize: 13, marginBottom: 12, textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: '100%', padding: 14, minHeight: 48,
              background: '#F0EEEA', color: '#1a1a18',
              border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: uploading ? 'default' : 'pointer',
            }}
          >
            📷 {t('avatar.picker.choose')}
          </button>

          {pendingFile && (
            <button
              onClick={handleSave}
              disabled={uploading}
              style={{
                width: '100%', padding: 14, minHeight: 48,
                background: uploading ? '#7a7a74' : 'linear-gradient(135deg,#0F6E56,#1D9E75)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: uploading ? 'default' : 'pointer',
              }}
            >
              {uploading ? t('avatar.picker.uploading') : t('avatar.picker.save')}
            </button>
          )}

          {currentUrl && !pendingFile && (
            <button
              onClick={handleDelete}
              disabled={uploading}
              style={{
                width: '100%', padding: 12, minHeight: 44,
                background: 'transparent', color: '#B84E2E',
                border: '1px solid #F5CFC4', borderRadius: 12,
                fontSize: 13, fontWeight: 600, cursor: uploading ? 'default' : 'pointer',
              }}
            >
              🗑 {t('avatar.picker.remove')}
            </button>
          )}

          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              width: '100%', padding: 10, minHeight: 40,
              background: 'transparent', color: '#5a5a56',
              border: 'none', borderRadius: 12,
              fontSize: 13, fontWeight: 500, cursor: uploading ? 'default' : 'pointer',
            }}
          >
            {t('common.cancel')}
          </button>
        </div>

        <div style={{
          marginTop: 14, fontSize: 11, color: '#7a7a74', textAlign: 'center', lineHeight: 1.4,
        }}>
          {t('avatar.picker.hint')}
        </div>
      </div>
    </div>
  )
}
