import { describe, expect, it } from 'vitest'
import { pickWinner, tally } from './tally'

const options = ['pates', 'poulet', 'soupe']

describe('tally', () => {
  it('regroupe les votants par plat, ignore un vote hors options', () => {
    const t = tally(options, { alice: 'pates', bob: 'pates', leo: 'soupe', eve: 'inconnu' })
    expect(Object.fromEntries(t)).toEqual({ pates: ['alice', 'bob'], poulet: [], soupe: ['leo'] })
  })
})

describe('pickWinner', () => {
  it('la majorité gagne, sans tirage', () => {
    expect(pickWinner(options, { alice: 'pates', bob: 'pates', leo: 'soupe' }, () => 0.99)).toMatchObject({ winner: 'pates', tie: false })
  })

  it('égalité : tirage au sort parmi les ex aequo seulement', () => {
    const ballots = { alice: 'pates', bob: 'soupe' }
    expect(pickWinner(options, ballots, () => 0).winner).toBe('pates')
    expect(pickWinner(options, ballots, () => 0.99).winner).toBe('soupe')
    expect(pickWinner(options, ballots, () => 0).tie).toBe(true)
  })

  it('personne n’a voté : tirage parmi toutes les options', () => {
    expect(pickWinner(options, {}, () => 0.5)).toMatchObject({ winner: 'poulet', tie: true })
  })

  it('refuse un vote sans option', () => {
    expect(() => pickWinner([], {})).toThrow()
  })
})
