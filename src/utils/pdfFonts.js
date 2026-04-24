/**
 * pdfFonts.js
 *
 * Obsługa polskich znaków w PDF przez statycznie wbudowany font Roboto TTF.
 *
 * v2.5.9: Font Roboto jest zakodowany jako base64 w `robotoFont.js` — ZERO
 * network calls, brak ryzyka CDN/CORS, działa offline.
 *
 * Font jest LAZY IMPORTOWANY (dynamic import) — trafia do tego samego chunka
 * co jsPDF/autoTable i jest pobierany dopiero gdy user klika "Generuj PDF".
 * Main bundle pozostaje ~330KB gzip mimo 360KB fontu.
 *
 * Fallback: gdy cokolwiek pójdzie nie tak (OOM, nieznane API jsPDF),
 * przełączamy na Helvetica + stripPolish(). Nigdy nie crashujemy generacji.
 */

/**
 * Zamienia polskie znaki na ich ASCII odpowiedniki.
 * Używane jako fallback gdy font Unicode nie działa.
 */
export function stripPolish(text) {
  if (text === null || text === undefined) return ''
  const map = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ż':'z','ź':'z',
    'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ż':'Z','Ź':'Z',
  }
  return String(text).replace(/[ąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/g, c => map[c] || c)
}

/**
 * Ładuje Roboto do jsPDF. Rejestruje font pod nazwą 'Roboto' z wariantami
 * 'normal' i 'bold' — gotowe do użycia w doc.setFont('Roboto', 'normal/bold').
 *
 * Dynamic import — font trafia do lazy chunka razem z jsPDF (nie obciąża main bundle).
 *
 * @returns {Promise<{fontName: string, usesPolish: boolean}>}
 */
export async function loadPolishFont(doc) {
  try {
    const { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } = await import('./robotoFont')
    doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_BASE64)
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
    doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_BASE64)
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
    return { fontName: 'Roboto', usesPolish: true }
  } catch (e) {
    console.warn('[pdfFonts] Roboto font registration failed, using Helvetica fallback:', e)
    return { fontName: 'helvetica', usesPolish: false }
  }
}
