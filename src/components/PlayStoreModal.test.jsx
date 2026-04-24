/**
 * PlayStoreModal.test.jsx
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PlayStoreModal from './PlayStoreModal'

describe('PlayStoreModal', () => {
  it('nie renderuje niczego gdy open=false', () => {
    const { container } = render(
      <PlayStoreModal open={false} onClose={() => {}} onOpenPlayStore={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('pokazuje CTA do Google Play gdy open', () => {
    render(
      <PlayStoreModal open={true} onClose={() => {}} onOpenPlayStore={() => {}} />
    )
    expect(screen.getByText(/otwórz google play/i)).toBeTruthy()
  })

  it('ma role=dialog dla accessibility', () => {
    render(
      <PlayStoreModal open={true} onClose={() => {}} onOpenPlayStore={() => {}} />
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('wywołuje onOpenPlayStore przy kliknięciu CTA', () => {
    const onOpen = vi.fn()
    render(
      <PlayStoreModal open={true} onClose={() => {}} onOpenPlayStore={onOpen} />
    )
    fireEvent.click(screen.getByText(/otwórz google play/i))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('wywołuje onClose przy kliknięciu Anuluj', () => {
    const onClose = vi.fn()
    render(
      <PlayStoreModal open={true} onClose={onClose} onOpenPlayStore={() => {}} />
    )
    fireEvent.click(screen.getByText(/anuluj/i))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
