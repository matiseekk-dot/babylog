// Udostępnianie obrazka karty (ogłoszenie ciąży, karta narodzin): natywnie
// (v58+, Spokojny.shareImage), w przeglądarce przez Web Share z plikiem.
// Zwraca 'native' | 'web' | 'aborted' | null (null = pokaż podpowiedź "zrób zrzut ekranu").
import { shareImageNative } from '../native/spokojny'

export async function shareCardImage(dataUrl, { text, title, fileName = 'spokojny-rodzic.jpg' }) {
  if (await shareImageNative({ dataUrl, text, title, fileName })) return 'native'
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], fileName, { type: 'image/jpeg' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text })
      return 'web'
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'aborted'  // użytkownik zamknął okno udostępniania
  }
  return null
}
