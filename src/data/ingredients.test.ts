import { describe, expect, it } from 'vitest'
import { refStatus } from './ingredients'

describe('refStatus', () => {
  it('reconnaît les basiques, ingrédients comme groupes', () => {
    expect(refStatus('sel')).toBe('basique')
    expect(refStatus('oignon')).toBe('basique')
    expect(refStatus('huile')).toBe('basique') // groupe
  })

  it('rend épices et herbes non bloquantes, groupe herbes-fraiches compris', () => {
    expect(refStatus('curry')).toBe('non-bloquant')
    expect(refStatus('persil')).toBe('non-bloquant')
    expect(refStatus('herbes-fraiches')).toBe('non-bloquant')
  })

  it('le reste est obligatoire', () => {
    expect(refStatus('pomme-de-terre')).toBe('obligatoire')
    expect(refStatus('fromage-rape')).toBe('obligatoire')
    expect(refStatus('sauce-soja')).toBe('obligatoire')
  })
})
