// Valeurs par défaut des recettes, sans zod : utilisées par le schéma (validateur, tests)
// ET par le catalogue côté client, qui ne doit pas embarquer zod.
import type { Recipe, RecipeInput } from './recipe-schema'

export const RECIPE_DEFAULTS = {
  servings: 4,
  cuisine: 'francaise',
  optional: false,
} as const

/**
 * Complète une recette brute (JSON, champs par défaut omis) comme le ferait
 * RecipeSchema.parse(), sans validation : les données sont validées par npm test.
 * Équivalence vérifiée par recipe-defaults.test.ts sur toutes les recettes.
 */
export function withDefaults(raw: RecipeInput): Recipe {
  return {
    ...raw,
    servings: raw.servings ?? RECIPE_DEFAULTS.servings,
    tags: raw.tags ?? [],
    cuisine: raw.cuisine ?? RECIPE_DEFAULTS.cuisine,
    ingredients: raw.ingredients.map((i) => ({ ...i, optional: i.optional ?? RECIPE_DEFAULTS.optional })),
  }
}
