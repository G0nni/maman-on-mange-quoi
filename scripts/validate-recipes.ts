/**
 * Valide le référentiel d'ingrédients et les recettes de src/data/recipes/*.json.
 * Lancé par `npm run validate:recipes` (stats) et par `npm test` (validate-recipes.test.ts).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { BASICS, GROUPS, INGREDIENTS, MEAT_FISH, type Ingredient, type IngredientGroup } from '../src/data/ingredients'
import { RecipeSchema, type Recipe } from '../src/data/recipe-schema'
import { norm, stockId } from '../src/lib/ingredients'

export const RECIPES_DIR = fileURLToPath(new URL('../src/data/recipes/', import.meta.url))

export type RecipeFile = { file: string; data: unknown }
export type Referential = { ingredients: Ingredient[]; groups: IngredientGroup[]; basics: string[] }

const EM_DASH = String.fromCharCode(0x2014) // tiret cadratin, interdit dans les textes (voir CLAUDE.md)

export function loadRecipeFiles(dir = RECIPES_DIR): RecipeFile[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => ({ file, data: JSON.parse(readFileSync(join(dir, file), 'utf8')) }))
}

/** Erreurs de cohérence du référentiel lui-même. */
function checkReferential({ ingredients, groups, basics }: Referential, errors: string[]) {
  const ids = new Set<string>()
  // Clé de recherche du stock (stockId d'un label ou d'un alias) -> qui la possède.
  const keys = new Map<string, string>()
  const claimKey = (key: string, owner: string) => {
    if (!key) return errors.push(`référentiel : "${owner}" a un label ou alias vide après normalisation`)
    const prev = keys.get(key)
    if (prev && prev !== owner) errors.push(`référentiel : la clé "${key}" est revendiquée par "${prev}" et "${owner}"`)
    keys.set(key, owner)
  }

  for (const g of groups) {
    if (ids.has(g.id)) errors.push(`référentiel : id "${g.id}" en double`)
    ids.add(g.id)
    claimKey(stockId(g.label), `groupe ${g.id}`)
    g.aliases?.forEach((a) => claimKey(stockId(a), `groupe ${g.id}`))
  }
  const groupIds = new Set(groups.map((g) => g.id))
  const groupSizes = new Map<string, number>()

  for (const i of ingredients) {
    if (ids.has(i.id)) errors.push(`référentiel : id "${i.id}" en double`)
    ids.add(i.id)
    if (i.id !== stockId(i.label))
      errors.push(`référentiel : id "${i.id}" différent de stockId("${i.label}") = "${stockId(i.label)}"`)
    claimKey(i.id, i.id)
    i.aliases?.forEach((a) => claimKey(stockId(a), i.id))
    for (const g of i.groups ?? []) {
      if (!groupIds.has(g)) errors.push(`référentiel : "${i.id}" appartient au groupe inconnu "${g}"`)
      groupSizes.set(g, (groupSizes.get(g) ?? 0) + 1)
    }
    if ([i.label, ...(i.aliases ?? [])].some((s) => s.includes(EM_DASH))) errors.push(`référentiel : tiret cadratin dans "${i.id}"`)
  }
  for (const g of groups) if (!groupSizes.get(g.id)) errors.push(`référentiel : le groupe "${g.id}" n'a aucun membre`)
  for (const b of basics) if (!ids.has(b)) errors.push(`référentiel : basique inconnu "${b}"`)
}

export function validate(files: RecipeFile[], ref: Referential = { ingredients: INGREDIENTS, groups: GROUPS, basics: BASICS }) {
  const errors: string[] = []
  checkReferential(ref, errors)

  const ingredientById = new Map(ref.ingredients.map((i) => [i.id, i]))
  const groupIds = new Set(ref.groups.map((g) => g.id))
  // Familles de protéine qu'une ref peut apporter (un groupe : l'union de ses membres).
  const familiesOf = (refId: string): string[] => {
    const ing = ingredientById.get(refId)
    if (ing) return ing.protein ? [ing.protein] : []
    return ref.ingredients.filter((i) => i.groups?.includes(refId) && i.protein).map((i) => i.protein!)
  }

  const recipes: (Recipe & { file: string })[] = []
  const seenIds = new Map<string, string>()
  const seenNames = new Map<string, string>()

  for (const { file, data } of files) {
    if (!Array.isArray(data)) {
      errors.push(`${file} : le fichier doit contenir un tableau de recettes`)
      continue
    }
    data.forEach((raw, index) => {
      const r = raw as Partial<Recipe>
      const where = `${file} › ${r?.name ?? r?.id ?? `#${index}`}`
      const parsed = RecipeSchema.safeParse(raw)
      if (!parsed.success) {
        for (const issue of parsed.error.issues) errors.push(`${where} : ${issue.path.join('.') || 'recette'} ${issue.message}`)
        return
      }
      const recipe = parsed.data

      if (seenIds.has(recipe.id)) errors.push(`${where} : id "${recipe.id}" déjà utilisé dans ${seenIds.get(recipe.id)}`)
      seenIds.set(recipe.id, file)
      const nameKey = norm(recipe.name)
      if (seenNames.has(nameKey)) errors.push(`${where} : nom déjà utilisé dans ${seenNames.get(nameKey)}`)
      seenNames.set(nameKey, file)

      const unknown = recipe.ingredients.filter((i) => !ingredientById.has(i.ref) && !groupIds.has(i.ref))
      for (const i of unknown) errors.push(`${where} : ref inconnue "${i.ref}"`)

      if ([recipe.name, ...recipe.steps].some((s) => s.includes(EM_DASH))) errors.push(`${where} : tiret cadratin dans le nom ou une étape`)

      if (!unknown.length) {
        const required = recipe.ingredients.filter((i) => !i.optional)
        if (recipe.protein !== 'aucune' && !required.some((i) => familiesOf(i.ref).includes(recipe.protein)))
          errors.push(`${where} : protéine "${recipe.protein}" apportée par aucun ingrédient obligatoire`)
        // Un ingrédient optionnel compte aussi : "lardons (facultatif)" ne rend pas un plat végé.
        const meat = recipe.ingredients.filter((i) => familiesOf(i.ref).some((f) => MEAT_FISH.includes(f as never)))
        if (recipe.tags.includes('vege') && meat.length)
          errors.push(`${where} : tag vege mais contient ${meat.map((i) => i.ref).join(', ')}`)
        if (!recipe.tags.includes('vege') && !meat.length) errors.push(`${where} : sans viande ni poisson, il manque le tag vege`)
      }

      recipes.push({ ...recipe, file })
    })
  }

  return { errors, recipes, stats: computeStats(recipes, ref) }
}

function countBy<T>(items: T[], key: (item: T) => string | string[]) {
  const counts: Record<string, number> = {}
  for (const item of items) for (const k of [key(item)].flat()) counts[k] = (counts[k] ?? 0) + 1
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]))
}

function computeStats(recipes: Recipe[], ref: Referential) {
  const usedRefs = new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.ref)))
  // Un ingrédient est "utilisé" s'il est demandé directement ou via un de ses groupes.
  // Les basiques sont exclus : les recettes ne listent pas forcément sel et poivre.
  const unusedIngredients = ref.ingredients
    .filter((i) => !ref.basics.includes(i.id) && !usedRefs.has(i.id) && !(i.groups ?? []).some((g) => usedRefs.has(g)))
    .map((i) => i.id)
  return {
    recipes: recipes.length,
    ingredients: ref.ingredients.length,
    groups: ref.groups.length,
    byProtein: countBy(recipes, (r) => r.protein),
    byBalance: countBy(recipes, (r) => r.balance.join('')),
    byTag: countBy(recipes, (r) => r.tags),
    bySaison: countBy(recipes, (r) => r.saisons),
    byDifficulty: countBy(recipes, (r) => String(r.difficulty)),
    over45min: recipes.filter((r) => r.time > 45).map((r) => `${r.name} (${r.time} min)`),
    unusedIngredients,
    unusedGroups: ref.groups.filter((g) => !usedRefs.has(g.id)).map((g) => g.id),
  }
}

function main() {
  const { errors, stats } = validate(loadRecipeFiles())
  if (errors.length) {
    console.error(`✗ ${errors.length} erreur(s) :\n` + errors.map((e) => `  - ${e}`).join('\n'))
    process.exit(1)
  }
  const line = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(', ')
  console.log(`✓ ${stats.recipes} recettes valides, ${stats.ingredients} ingrédients, ${stats.groups} groupes`)
  console.log(`\nProtéine principale : ${line(stats.byProtein)}`)
  console.log(`Équilibre          : ${line(stats.byBalance)}`)
  console.log(`Tags               : ${line(stats.byTag)}`)
  console.log(`Saisons            : ${line(stats.bySaison)}`)
  console.log(`Difficulté         : ${line(stats.byDifficulty)}`)
  console.log(`Plus de 45 min     : ${stats.over45min.join(', ') || 'aucune'}`)
  console.log(`\nGroupes jamais utilisés (${stats.unusedGroups.length}) : ${stats.unusedGroups.join(', ')}`)
  console.log(`Ingrédients jamais utilisés (${stats.unusedIngredients.length}) :\n  ${stats.unusedIngredients.join(', ')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
