/**
 * avatarStorage.js — upload/download photo avatarów dziecka.
 *
 * Model:
 *   - Zalogowany user: Firebase Storage users/{uid}/avatars/{profileId}
 *     - Zwraca publiczny URL (sync między urządzeniami)
 *     - Overwrite jednego pliku per profile (nie plodzi historii)
 *   - Guest (uid=null): base64 w localStorage
 *     - Fallback, bez cross-device sync
 *     - Limit 500 KB przed zapisem (żeby nie wypełnić 5 MB localStorage)
 *
 * Zabezpieczenia:
 *   - Client-side resize do max 512×512 przed uploadem (canvas)
 *   - Client-side JPEG compression (jakość 0.85) — 5 MB → ~50-200 KB
 *   - Storage rules egzekwują 2 MB limit + image/* contentType
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'
import { captureError, addBreadcrumb } from '../sentry'

const MAX_DIMENSION = 512
const JPEG_QUALITY = 0.85
const LOCAL_STORAGE_MAX_BYTES = 500 * 1024  // 500 KB — bezpieczne dla localStorage

/**
 * Resize + compress image w canvas.
 * Input: File / Blob (z <input type="file">)
 * Output: Blob (JPEG, max 512×512, jakość 85%)
 */
async function processImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      // Skalowanie proporcjonalne do MAX_DIMENSION
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = Math.round(height * (MAX_DIMENSION / width))
          width = MAX_DIMENSION
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = Math.round(width * (MAX_DIMENSION / height))
          height = MAX_DIMENSION
        }
      }
      // Wycięcie do kwadratu (center crop) — awatary są zawsze 1:1
      const size = Math.min(width, height)
      const sx = Math.round((width - size) / 2)
      const sy = Math.round((height - size) / 2)

      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob returned null'))
          resolve(blob)
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

/**
 * Upload avatar do Firebase Storage.
 * Zwraca publiczny URL do zapisania w profile.
 *
 * @param {string} uid - Firebase Auth UID
 * @param {string} profileId - id profilu dziecka
 * @param {File} file - plik z <input type="file">
 * @returns {Promise<string>} download URL
 */
export async function uploadAvatarFirebase(uid, profileId, file) {
  addBreadcrumb('avatar', 'upload-start', { profileId, sizeIn: file.size })
  const blob = await processImage(file)
  const path = `users/${uid}/avatars/${profileId}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  const url = await getDownloadURL(storageRef)
  addBreadcrumb('avatar', 'upload-success', { profileId, sizeOut: blob.size })
  return url
}

/**
 * Fallback: zapisz avatar w localStorage jako base64 (dla guesta).
 * Zwraca data URL do zapisania w profile.
 */
export async function uploadAvatarLocal(profileId, file) {
  addBreadcrumb('avatar', 'local-upload-start', { profileId, sizeIn: file.size })
  const blob = await processImage(file)
  if (blob.size > LOCAL_STORAGE_MAX_BYTES) {
    throw new Error(`Photo too large (${Math.round(blob.size / 1024)}KB). Max 500KB after compression.`)
  }
  const dataUrl = await blobToDataUrl(blob)
  try {
    localStorage.setItem(`babylog_guest_avatar_${profileId}`, dataUrl)
  } catch (e) {
    // QuotaExceeded — localStorage pełny
    throw new Error('LocalStorage quota exceeded — remove other photos first')
  }
  addBreadcrumb('avatar', 'local-upload-success', { profileId, sizeOut: dataUrl.length })
  return dataUrl
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Facade — upload przez odpowiedni backend w zależności od uid.
 * @returns {Promise<string>} URL (Firebase Storage download URL LUB data: URL)
 */
export async function uploadAvatar(uid, profileId, file) {
  try {
    if (uid) {
      return await uploadAvatarFirebase(uid, profileId, file)
    }
    return await uploadAvatarLocal(profileId, file)
  } catch (err) {
    captureError(err, { context: 'avatar-upload', uid: uid || 'guest', profileId })
    throw err
  }
}

/**
 * Usunięcie avatara (opcja "Usuń zdjęcie", user wraca do emoji).
 */
export async function deleteAvatar(uid, profileId) {
  try {
    if (uid) {
      const path = `users/${uid}/avatars/${profileId}`
      await deleteObject(ref(storage, path))
    } else {
      localStorage.removeItem(`babylog_guest_avatar_${profileId}`)
    }
  } catch (err) {
    // Not-found jest OK (może user nigdy nie wgrał zdjęcia). Rzucamy tylko realne błędy.
    if (err?.code === 'storage/object-not-found') return
    captureError(err, { context: 'avatar-delete', uid: uid || 'guest', profileId })
    throw err
  }
}
