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
  try {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Spokojny')
  } catch {
    return false
  }
}

export const QUICK_ACTIONS = ['feed_left', 'feed_right', 'bottle', 'sleep', 'menu']
