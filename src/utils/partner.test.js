import { describe, it, expect, vi } from 'vitest'

vi.mock('../firebase', () => ({ functions: {} }))

import { shouldShowPartnerInvite, normalizeInviteCode } from './partner'

const base = {
  uid: 'owner', isPartner: false, isPremium: true,
  isOnTrial: true, trialDaysLeft: 12, partnersCount: 0, dismissed: false,
}

describe('shouldShowPartnerInvite', () => {
  it('pokazuje właścicielowi w trialu po ~2 dniach', () => {
    expect(shouldShowPartnerInvite(base)).toBe(true)
  })

  it('nie pokazuje w pierwszych dniach trialu', () => {
    expect(shouldShowPartnerInvite({ ...base, trialDaysLeft: 13 })).toBe(false)
    expect(shouldShowPartnerInvite({ ...base, trialDaysLeft: 14 })).toBe(false)
  })

  it('po zakupie pokazuje od razu', () => {
    expect(shouldShowPartnerInvite({ ...base, isOnTrial: false, trialDaysLeft: 0 })).toBe(true)
  })

  it('nie pokazuje gościowi, partnerowi ani bez Premium', () => {
    expect(shouldShowPartnerInvite({ ...base, uid: null })).toBe(false)
    expect(shouldShowPartnerInvite({ ...base, isPartner: true })).toBe(false)
    expect(shouldShowPartnerInvite({ ...base, isPremium: false })).toBe(false)
  })

  it('nie pokazuje gdy są partnerzy, lista się ładuje albo karta zamknięta', () => {
    expect(shouldShowPartnerInvite({ ...base, partnersCount: 1 })).toBe(false)
    expect(shouldShowPartnerInvite({ ...base, partnersCount: null })).toBe(false)
    expect(shouldShowPartnerInvite({ ...base, dismissed: true })).toBe(false)
  })
})

describe('normalizeInviteCode', () => {
  it('wielkie litery, tylko A-Z/0-9, max 6 znaków', () => {
    expect(normalizeInviteCode('k7m 4-px9')).toBe('K7M4PX')
    expect(normalizeInviteCode('')).toBe('')
    expect(normalizeInviteCode(undefined)).toBe('')
  })
})
