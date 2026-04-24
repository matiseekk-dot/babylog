/**
 * PremiumOnboardingModal.test.jsx
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PremiumOnboardingModal from './PremiumOnboardingModal'

describe('PremiumOnboardingModal', () => {
  it('nie renderuje gdy open=false', () => {
    const { container } = render(
      <PremiumOnboardingModal open={false} onClose={() => {}} onNavigateToReport={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('pokazuje tytuł "Witaj w Premium" gdy open', () => {
    render(
      <PremiumOnboardingModal open={true} onClose={() => {}} onNavigateToReport={() => {}} />
    )
    expect(screen.getByText(/witaj w premium/i)).toBeTruthy()
  })

  it('wyświetla 4 Premium features', () => {
    render(
      <PremiumOnboardingModal open={true} onClose={() => {}} onNavigateToReport={() => {}} />
    )
    expect(screen.getByText(/raport pdf dla pediatry/i)).toBeTruthy()
    expect(screen.getByText(/wiele dzieci/i)).toBeTruthy()
    expect(screen.getByText(/statystyki i wykresy/i)).toBeTruthy()
    expect(screen.getByText(/personalizacja/i)).toBeTruthy()
  })

  it('CTA primary wywołuje onNavigateToReport', () => {
    const onNav = vi.fn()
    render(
      <PremiumOnboardingModal open={true} onClose={() => {}} onNavigateToReport={onNav} />
    )
    fireEvent.click(screen.getByText(/zobacz mój raport pdf/i))
    expect(onNav).toHaveBeenCalledTimes(1)
  })

  it('CTA secondary wywołuje onClose', () => {
    const onClose = vi.fn()
    render(
      <PremiumOnboardingModal open={true} onClose={onClose} onNavigateToReport={() => {}} />
    )
    fireEvent.click(screen.getByText(/rozejrzę się/i))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ma role=dialog dla a11y', () => {
    render(
      <PremiumOnboardingModal open={true} onClose={() => {}} onNavigateToReport={() => {}} />
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})
