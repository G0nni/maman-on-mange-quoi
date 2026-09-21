import { describe, expect, it } from 'vitest'
import { RecipeSchema, type RecipeInput } from './recipe-schema'
import { withDefaults } from './recipe-defaults'

const raw = Object.values(import.meta.glob<RecipeInput[]>('./recipes/*.json', { eager: true, import: 'default' })).flat()

describe('withDefaults', () => {
  it('donne exactement le même résultat que RecipeSchema.parse sur toutes les recettes', () => {
    expect(raw.length).toBeGreaterThan(250)
    for (const r of raw) expect(withDefaults(r)).toEqual(RecipeSchema.parse(r))
  })

  it('applique les valeurs par défaut quand elles sont omises', () => {
    const r = withDefaults({
      id: 'x', name: 'Test', emoji: '🍽️', time: 10, difficulty: 1, protein: 'aucune',
      ingredients: [{ ref: 'riz' }, { ref: 'sel', optional: true }], steps: ['a', 'b'], balance: ['F'], saisons: ['toute-annee'],
    })
    expect(r).toMatchObject({ servings: 4, tags: [], cuisine: 'francaise' })
    expect(r.ingredients.map((i) => i.optional)).toEqual([false, true])
  })
})
