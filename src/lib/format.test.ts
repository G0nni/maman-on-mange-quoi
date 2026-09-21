import { describe, expect, it } from 'vitest'
import { formatQty, missingText } from './format'

describe('missingText', () => {
  it('liste les manquants avec une minuscule initiale', () => {
    expect(missingText(['Crème fraîche'])).toBe('Il manque : crème fraîche')
    expect(missingText(['Riz', 'Œufs'])).toBe('Il manque : riz, œufs')
  })
})

describe('formatQty', () => {
  it('formate quantités et unités à la française', () => {
    expect(formatQty(400, 'g')).toBe('400 g')
    expect(formatQty(2, 'cas')).toBe('2 c. à soupe')
    expect(formatQty(0.5, 'botte')).toBe('0,5 botte')
    expect(formatQty(1.5, 'kg')).toBe('1,5 kg')
    expect(formatQty(2, 'gousse')).toBe('2 gousses')
    expect(formatQty(1, 'gousse')).toBe('1 gousse')
    expect(formatQty(3)).toBe('3')
    expect(formatQty()).toBe('')
  })
})
