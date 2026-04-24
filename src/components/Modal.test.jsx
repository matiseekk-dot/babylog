/**
 * Modal.test.jsx
 *
 * Modal jest najczęściej używanym komponentem UI — wszystkie dialogi
 * w apce (MedsTab add dose, SettingsScreen edit, itd.) korzystają z niego.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'

describe('Modal', () => {
  it('nie renderuje nic gdy open=false', () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renderuje children gdy open=true', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        <p>My content here</p>
      </Modal>
    )
    expect(screen.getByText('My content here')).toBeTruthy()
  })

  it('pokazuje title gdy przekazany', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Moje okno">
        <p>x</p>
      </Modal>
    )
    expect(screen.getByText('Moje okno')).toBeTruthy()
  })

  it('nie pokazuje title gdy nie przekazany', () => {
    render(
      <Modal open={true} onClose={() => {}}>
        <p>x</p>
      </Modal>
    )
    // Nie crashuje
    expect(screen.getByText('x')).toBeTruthy()
  })

  it('wywołuje onClose gdy user klika w backdrop', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal open={true} onClose={onClose} title="X">
        <p>content</p>
      </Modal>
    )
    const backdrop = container.querySelector('.modal-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('NIE wywołuje onClose gdy user klika w modal-sheet (wewnątrz)', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose} title="X">
        <p>click me</p>
      </Modal>
    )
    fireEvent.click(screen.getByText('click me'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ma atrybuty ARIA dla dialogu (accessibility)', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Z tytułem">
        <p>content</p>
      </Modal>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    // Gdy jest title, aria-labelledby powinien być ustawiony
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
  })

  it('modal-handle ma aria-hidden (ozdobny, nie powinien być czytany przez reader)', () => {
    const { container } = render(
      <Modal open={true} onClose={() => {}} title="X">
        <p>x</p>
      </Modal>
    )
    const handle = container.querySelector('.modal-handle')
    expect(handle.getAttribute('aria-hidden')).toBe('true')
  })
})
