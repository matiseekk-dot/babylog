/**
 * pdfFonts.js
 *
 * Dynamiczne ładowanie fontu Roboto z obsługą polskich znaków
 * (i wszystkich języków latin-ext).
 *
 * jsPDF domyślnie używa Helvetica w kodowaniu WinAnsi — NIE obsługuje
 * polskich ogonków (ł, ą, ę, ć, ś, ż, ź, ń, ó). Zamiast nich pokazuje
 * brzydkie artefakty jak "Karmień" → "KarmieD Bcznie".
 *
 * Rozwiązanie: pobieramy Roboto TTF z unpkg (public CDN) przy pierwszej
 * generacji PDF, konwertujemy do base64 i rejestrujemy w jsPDF przez addFont.
 *
 * - Pierwsza generacja PDF: +1-2s na download ~140KB (cache przez fetch)
 * - Kolejne: instant, font jest w pamięci
 * - Fallback: jeśli CDN nie działa, fallback na Helvetica + replacement
 *   polskich znaków na ASCII
 */

const ROBOTO_REGULAR_URL = 'https://unpkg.com/@fontsource/roboto@5.0.8/files/roboto-latin-ext-400-normal.woff'
const ROBOTO_BOLD_URL = 'https://unpkg.com/@fontsource/roboto@5.0.8/files/roboto-latin-ext-700-normal.woff'

// TTF (jsPDF wymaga TTF, nie WOFF) — źródło Noto Sans z jsdelivr
const NOTO_REGULAR_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf'
const NOTO_BOLD_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf'

// Cache — jeśli już raz załadowaliśmy, używamy tej samej kopii
let fontCache = null

/**
 * Zamienia polskie znaki na ich ASCII odpowiedniki.
 * Używane jako fallback gdy font Unicode nie może być załadowany.
 */
export function stripPolish(text) {
  if (!text) return text
  const map = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ż':'z','ź':'z',
    'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ż':'Z','Ź':'Z',
  }
  return String(text).replace(/[ąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/g, c => map[c] || c)
}

/**
 * Konwertuje ArrayBuffer na base64 string (potrzebne dla jsPDF.addFont).
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Ładuje Noto Sans font do jsPDF i zwraca nazwę fontu do użycia
 * przez doc.setFont().
 *
 * @returns {Promise<{fontName: string, usesPolish: boolean}>}
 *   fontName: nazwa fontu do doc.setFont() — np. 'NotoSans' albo 'helvetica'
 *   usesPolish: true gdy polskie znaki będą renderowane poprawnie,
 *               false gdy trzeba użyć stripPolish() na tekstach
 */
export async function loadPolishFont(doc) {
  if (fontCache) {
    // Już załadowane w tej sesji — dodaj do nowego doc
    try {
      doc.addFileToVFS('NotoSans-Regular.ttf', fontCache.regular)
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
      doc.addFileToVFS('NotoSans-Bold.ttf', fontCache.bold)
      doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold')
      return { fontName: 'NotoSans', usesPolish: true }
    } catch {
      return { fontName: 'helvetica', usesPolish: false }
    }
  }

  try {
    // Ładujemy równolegle 2 TTF files
    const [regResp, boldResp] = await Promise.all([
      fetch(NOTO_REGULAR_URL).catch(() => null),
      fetch(NOTO_BOLD_URL).catch(() => null),
    ])

    if (!regResp?.ok || !boldResp?.ok) {
      throw new Error('CDN fetch failed')
    }

    const [regBuffer, boldBuffer] = await Promise.all([
      regResp.arrayBuffer(),
      boldResp.arrayBuffer(),
    ])

    const regBase64 = arrayBufferToBase64(regBuffer)
    const boldBase64 = arrayBufferToBase64(boldBuffer)

    fontCache = { regular: regBase64, bold: boldBase64 }

    doc.addFileToVFS('NotoSans-Regular.ttf', regBase64)
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
    doc.addFileToVFS('NotoSans-Bold.ttf', boldBase64)
    doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold')

    return { fontName: 'NotoSans', usesPolish: true }
  } catch (e) {
    console.warn('[pdfFonts] Failed to load Polish font, falling back to ASCII:', e)
    return { fontName: 'helvetica', usesPolish: false }
  }
}
