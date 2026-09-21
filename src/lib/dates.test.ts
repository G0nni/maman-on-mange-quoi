import { describe, expect, it } from 'vitest'
import { parisDate, shiftDate } from './dates'

describe('parisDate', () => {
  it('donne la date en heure de Paris, pas en UTC (heure d’été, UTC+2)', () => {
    expect(parisDate(new Date('2026-09-21T21:59:00Z'))).toBe('2026-09-21') // 23 h 59 à Paris
    expect(parisDate(new Date('2026-09-21T22:30:00Z'))).toBe('2026-09-22') // 00 h 30 à Paris
  })

  it('en heure d’hiver (UTC+1)', () => {
    expect(parisDate(new Date('2026-12-31T22:59:00Z'))).toBe('2026-12-31')
    expect(parisDate(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })
})

describe('shiftDate', () => {
  it('décale en jours calendaires, y compris à travers un changement d’heure et un mois', () => {
    expect(shiftDate('2026-10-28', -7)).toBe('2026-10-21') // passage à l'heure d'hiver le 25/10
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01')
  })
})
