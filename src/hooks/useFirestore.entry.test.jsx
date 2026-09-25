/**
 * Listener nowych wpisów (v2.16.1) — podstawa first_entry_added i FirstEntryCard.
 *
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
}))
vi.mock('../firebase', () => ({ db: {} }))

import { useFirestore, setEntryAddedListener } from './useFirestore'

describe('setEntryAddedListener', () => {
  let added
  beforeEach(() => {
    localStorage.clear()
    added = []
    setEntryAddedListener((type, info) => added.push({ type, ...info }))
  })

  it('zgłasza nowy wpis w liście wpisów (gość) razem z samym wpisem', () => {
    const { result } = renderHook(() => useFirestore(null, 'feed_p1', [{ id: 1 }]))
    act(() => result.current[1]([{ id: 2, time: '14:30' }, { id: 1 }]))
    expect(added).toEqual([{ type: 'feed', key: 'feed_p1', added: [{ id: 2, time: '14:30' }] }])
  })

  it('nie zgłasza edycji ani usunięcia', () => {
    const { result } = renderHook(() => useFirestore(null, 'temp_p1', [{ id: 1 }]))
    act(() => result.current[1]([{ id: 1, temp: 37 }]))
    act(() => result.current[1]([]))
    expect(added).toEqual([])
  })

  it('inne instancje z tym samym kluczem od razu widzą zapis (gość)', () => {
    const fab = renderHook(() => useFirestore(null, 'diaper_p1', []))
    const today = renderHook(() => useFirestore(null, 'diaper_p1', []))
    const otherChild = renderHook(() => useFirestore(null, 'diaper_p2', []))
    act(() => fab.result.current[1]([{ id: 1 }]))
    expect(today.result.current[0]).toEqual([{ id: 1 }])
    expect(otherChild.result.current[0]).toEqual([])
  })

  it('pomija definicje (*_custom_) i stan timera snu', () => {
    const custom = renderHook(() => useFirestore(null, 'meds_custom_p1', []))
    act(() => custom.result.current[1]([{ name: 'X' }]))
    const timer = renderHook(() => useFirestore(null, 'sleep_timer_p1', null))
    act(() => timer.result.current[1](Date.now()))
    const other = renderHook(() => useFirestore(null, 'profiles', []))
    act(() => other.result.current[1]([{ id: 'p1' }]))
    expect(added).toEqual([])
  })
})
