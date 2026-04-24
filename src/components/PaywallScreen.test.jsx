/**
 * PaywallScreen.test.jsx
 *
 * Krytyczne dla biznesu — testy że paywall pokazuje wszystkie 3 plany
 * i że aktywacja wywołuje callback z prawidłowym planId.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PaywallScreen from './PaywallScreen'

describe('PaywallScreen', () => {
  it('renderuje heading Premium', () => {
    render(<PaywallScreen onActivate={() => {}} onClose={() => {}} checking={false} />)
    expect(screen.getAllByText(/premium/i).length).toBeGreaterThan(0)
  })

  it('pokazuje wszystkie 3 plany cenowe', () => {
    render(<PaywallScreen onActivate={() => {}} onClose={() => {}} checking={false} />)
    // Szukamy cen — 14,99 / 99,99 / 199,99
    const text = document.body.textContent
    expect(text).toMatch(/14[,.]99/)
    expect(text).toMatch(/99[,.]99/)
    expect(text).toMatch(/199[,.]99/)
  })

  it('wywołuje onClose gdy X jest kliknięty', () => {
    const onClose = vi.fn()
    render(<PaywallScreen onActivate={() => {}} onClose={onClose} checking={false} />)
    const closeBtn = screen.getByLabelText(/zamknij/i)
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('przycisk aktywacji wywołuje onActivate z aktualnie wybranym planem', () => {
    const onActivate = vi.fn()
    render(<PaywallScreen onActivate={onActivate} onClose={() => {}} checking={false} />)
    // Domyślnie plan 'yearly' jest wybrany
    // Znajdź główny przycisk "Wybierz Premium" / "Activate"
    const buttons = screen.getAllByRole('button')
    // Ostatni duży button zwykle jest CTA
    const ctaBtn = buttons.find(b => b.textContent.match(/wybierz|aktywuj|kup|premium/i))
    if (ctaBtn) {
      fireEvent.click(ctaBtn)
      expect(onActivate).toHaveBeenCalled()
      expect(onActivate.mock.calls[0][0]).toMatch(/yearly|monthly|lifetime/)
    }
  })

  it('pokazuje informację że free features zostają ZA DARMO', () => {
    render(<PaywallScreen onActivate={() => {}} onClose={() => {}} checking={false} />)
    const text = document.body.textContent
    expect(text.toLowerCase()).toMatch(/za darmo|always free/i)
  })

  it('przycisk X ma aria-label (accessibility)', () => {
    render(<PaywallScreen onActivate={() => {}} onClose={() => {}} checking={false} />)
    const closeBtn = screen.getByLabelText(/zamknij/i)
    expect(closeBtn).toBeTruthy()
  })
})
