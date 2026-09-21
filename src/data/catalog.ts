// Recettes et référentiel, à charger UNIQUEMENT via import() dynamique (voir useCatalog) :
// ce module forme un chunk séparé, hors du bundle principal. Pas de zod ici : les données
// sont validées par npm test, on n'applique que les valeurs par défaut.
import type { Recipe, RecipeInput } from './recipe-schema'
import { withDefaults } from './recipe-defaults'
import { REFERENTIAL } from './ingredients'

const files = import.meta.glob<RecipeInput[]>('./recipes/*.json', { eager: true, import: 'default' })

export const RECIPES: Recipe[] = Object.values(files).flat().map(withDefaults)

export { REFERENTIAL }
