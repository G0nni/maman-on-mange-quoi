import { describe, expect, it } from 'vitest'
import { loadRecipeFiles, validate } from './validate-recipes'

// Recette minimale valide, modifiée dans chaque test pour vérifier une erreur précise.
const base = {
  id: 'test-omelette',
  name: 'Omelette test',
  emoji: '🍳',
  time: 10,
  difficulty: 1,
  protein: 'oeuf',
  ingredients: [{ ref: 'oeuf', qty: 6 }, { ref: 'fromage-rape', qty: 50, unit: 'g' }],
  steps: ['Battre les œufs.', 'Cuire à la poêle.'],
  balance: ['P'],
  saisons: ['toute-annee'],
  tags: ['vege', 'rapide'],
}
const run = (...recipes: object[]) => validate([{ file: 'test.json', data: recipes }]).errors

describe('src/data/recipes', () => {
  it('le référentiel et toutes les recettes sont valides', () => {
    expect(validate(loadRecipeFiles()).errors).toEqual([])
  })
})

describe('validate', () => {
  it('accepte une recette valide', () => {
    expect(run(base)).toEqual([])
  })

  it('signale une ref inconnue avec le nom de la recette', () => {
    const errors = run({ ...base, ingredients: [...base.ingredients, { ref: 'licorne' }] })
    expect(errors).toContain('test.json › Omelette test : ref inconnue "licorne"')
  })

  it('refuse les doublons d’id et de nom', () => {
    expect(run(base, { ...base, name: 'Autre nom' }).join()).toMatch(/id "test-omelette" déjà utilisé/)
    expect(run(base, { ...base, id: 'autre-id', name: 'OMELETTES test' }).join()).toMatch(/nom déjà utilisé/)
  })

  it('vérifie la cohérence du tag vege, y compris via un groupe', () => {
    const errors = run({ ...base, ingredients: [...base.ingredients, { ref: 'porc-cuisine', optional: true }] })
    expect(errors.join()).toMatch(/tag vege mais contient porc-cuisine/)
  })

  it('vérifie que la protéine principale est apportée', () => {
    expect(run({ ...base, protein: 'poisson' }).join()).toMatch(/protéine "poisson" apportée par aucun/)
  })

  it('refuse le tiret cadratin dans les étapes', () => {
    expect(run({ ...base, steps: [`Battre les œufs ${String.fromCharCode(0x2014)} bien.`, 'Cuire.'] }).join()).toMatch(/tiret cadratin/)
  })

  it('vérifie le tag rapide', () => {
    expect(run({ ...base, time: 40 }).join()).toMatch(/tag rapide incohérent/)
  })
})
