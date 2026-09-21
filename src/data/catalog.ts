// Recettes et référentiel, à charger UNIQUEMENT via import() dynamique (voir useCatalog) :
// ce module et zod forment un chunk séparé, hors du bundle principal.
import { RecipeSchema, type Recipe } from './recipe-schema'
import { REFERENTIAL } from './ingredients'

const files = import.meta.glob<unknown[]>('./recipes/*.json', { eager: true, import: 'default' })

// Le schéma applique les valeurs par défaut (servings, optional, tags, cuisine) que les
// JSON omettent. Les données sont déjà validées par npm test, parse() ne devrait pas échouer.
export const RECIPES: Recipe[] = Object.values(files)
  .flat()
  .map((raw) => RecipeSchema.parse(raw))

export { REFERENTIAL }
