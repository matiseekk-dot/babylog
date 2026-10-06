import { describe, it, expect } from 'vitest'
import { LISTS, listFor, listProgress } from './pregnancyLists'

describe('pregnancyLists', () => {
  it('id pozycji są unikalne w obrębie listy', () => {
    for (const list of Object.values(LISTS)) {
      const ids = list.groups.flatMap(g => g.items.map(it => it.id))
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('każdy język ma tytuły i teksty bez myślników', () => {
    for (const locale of ['pl', 'en', 'de', 'fr', 'es']) {
      for (const id of ['bag', 'layette']) {
        for (const g of listFor(id, locale)) {
          expect(g.title).toBeTruthy()
          for (const it of g.items) expect(it.text).not.toMatch(/[—–]/)
        }
      }
    }
  })

  it('pozycja null nie pojawia się w danym języku', () => {
    const ids = l => listFor('bag', l).flatMap(g => g.items.map(it => it.id))
    expect(ids('pl')).not.toContain('insurance')
    expect(ids('de')).toContain('insurance')
  })

  it('postęp liczy odhaczone i własne pozycje', () => {
    const total = listProgress('bag', 'pl', {}).total
    const state = {
      bag: { id: true, notes: true, insurance: true },   // insurance nie liczy się po polsku
      custom: { bag: [{ id: 'a', text: 'Głośnik', done: true }, { id: 'b', text: 'Poduszka', done: false }] },
    }
    expect(listProgress('bag', 'pl', state)).toEqual({ done: 3, total: total + 2 })
    expect(listProgress('layette', 'pl', state).done).toBe(0)
    expect(listProgress('nope', 'pl', state)).toEqual({ done: 0, total: 0 })
  })
})
