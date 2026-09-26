import { Capacitor, registerPlugin } from '@capacitor/core'

/**
 * Własny plugin natywny "Spokojny" (od wersji natywnej v55 / 2.16.5):
 *   requestReview()      — okienko oceny Google Play (In-App Review)
 *   getPendingAction()   — szybka akcja z widżetu / skrótu ikony
 *   addListener('quickAction') — akcja, gdy apka już działa
 *   updateWidget({ title, label_* }) — teksty widżetu w języku apki
 *
 * Web jest wspólny dla wszystkich wersji natywnych, więc zawsze sprawdzamy
 * dostępność — v54 i starsze nie mają tego pluginu.
 */
export const Spokojny = registerPlugin('Spokojny')

export function hasNativeExtras() {
  // Tylko dev server: podgląd natywnych kart w przeglądarce (window.__forceNativeExtras = true).
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.__forceNativeExtras) return true
  try {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Spokojny')
  } catch {
    return false
  }
}

export const QUICK_ACTIONS = ['feed_left', 'feed_right', 'bottle', 'sleep', 'menu']

/**
 * v56: { count, pinSupported } — ile widżetów stoi na ekranie głównym i czy
 * da się je dodać z aplikacji. null na v55 (brak metody) i poza natywną apką.
 */
export async function getWidgetStatus() {
  if (!hasNativeExtras()) return null
  try { return await Spokojny.getWidgetStatus() } catch { return null }
}

/** v56: systemowe okienko "Dodaj widżet". false → pokaż instrukcję ręczną. */
export async function requestPinWidget() {
  if (!hasNativeExtras()) return false
  try { return !!(await Spokojny.pinWidget())?.requested } catch { return false }
}
