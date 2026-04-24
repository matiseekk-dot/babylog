/**
 * GuestMigrationDialog.test.jsx
 *
 * Test komponentu Bug 3 fix — dialog migracji gościa do konta.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GuestMigrationDialog from './GuestMigrationDialog'

describe('GuestMigrationDialog', () => {
  it('nie renderuje niczego gdy open=false', () => {
    const { container } = render(
      <GuestMigrationDialog open={false} onConfirm={() => {}} onSkip={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('pokazuje tytuł i opis gdy open=true', () => {
    render(
      <GuestMigrationDialog open={true} onConfirm={() => {}} onSkip={() => {}} />
    )
    // Tytuł i warning muszą być widoczne
    expect(screen.getByText(/wykryto dane z trybu gościa/i)).toBeTruthy()
  })

  it('ma atrybuty ARIA dla dialogu (accessibility)', () => {
    render(
      <GuestMigrationDialog open={true} onConfirm={() => {}} onSkip={() => {}} />
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('wywołuje onConfirm gdy user klika "Dodaj dane gościa"', () => {
    const onConfirm = vi.fn()
    render(
      <GuestMigrationDialog open={true} status="show" onConfirm={onConfirm} onSkip={() => {}} />
    )
    const confirmBtn = screen.getByText(/dodaj dane gościa/i)
    fireEvent.click(confirmBtn)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('wywołuje onSkip gdy user klika "Pomiń"', () => {
    const onSkip = vi.fn()
    render(
      <GuestMigrationDialog open={true} status="show" onConfirm={() => {}} onSkip={onSkip} />
    )
    const skipBtn = screen.getByText(/pomiń/i)
    fireEvent.click(skipBtn)
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('przyciski są disabled gdy status="migrating"', () => {
    const onConfirm = vi.fn()
    const onSkip = vi.fn()
    render(
      <GuestMigrationDialog open={true} status="migrating" onConfirm={onConfirm} onSkip={onSkip} />
    )
    const confirmBtn = screen.getByText(/przenoszę dane/i)
    expect(confirmBtn.disabled).toBe(true)
    // Skip też nie powinien być klikalny
    fireEvent.click(confirmBtn)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
