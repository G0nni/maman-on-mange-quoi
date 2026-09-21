import { describe, expect, it } from 'vitest'
import { historyStart, recentWinners } from './history'

const poll = (id: string, winner: string | null, status: 'open' | 'closed' = 'closed') => ({ id, status, winner })

describe('recentWinners', () => {
  const today = '2026-09-21'

  it('garde les gagnants des 7 derniers jours, aujourd’hui compris', () => {
    const polls = [poll('2026-09-14', 'trop-vieux'), poll('2026-09-15', 'lundi-dernier'), poll('2026-09-20', 'hier'), poll('2026-09-21', 'ce-soir')]
    expect(recentWinners(polls, today)).toEqual(['lundi-dernier', 'hier', 'ce-soir'])
  })

  it('ignore les votes encore ouverts et ceux sans gagnant, dédoublonne', () => {
    const polls = [poll('2026-09-19', 'pates'), poll('2026-09-20', 'pates'), poll('2026-09-21', null, 'open')]
    expect(recentWinners(polls, today)).toEqual(['pates'])
  })

  it('la fenêtre traverse les mois', () => {
    expect(historyStart('2026-10-03')).toBe('2026-09-27')
  })
})
