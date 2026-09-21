/**
 * Valide le référentiel d'ingrédients et les recettes de src/data/recipes/*.json.
 * Lancé par `npm run validate:recipes` (stats) et par `npm test` (validate-recipes.test.ts).
 *
 * Erreurs : bloquantes (npm test échoue). Alertes : à arbitrer à la main, non bloquantes.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { MEAT_FISH, REFERENTIAL } from '../src/data/ingredients'
import { RAPIDE_MAX_MINUTES, RecipeSchema, type Recipe } from '../src/data/recipe-schema'
import { norm, stockId } from '../src/lib/ingredients'
import { createIndex, type Referential } from '../src/lib/referential'

export const RECIPES_DIR = fileURLToPath(new URL('../src/data/recipes/', import.meta.url))

/** Au-delà, deux recettes de même protéine sont signalées comme quasi-doublons. */
export const NEAR_DUPLICATE_THRESHOLD = 0.8

export type RecipeFile = { file: string; data: unknown }
type ValidRecipe = Recipe & { file: string }

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

export function validate(files: RecipeFile[], ref: Referential = REFERENTIAL) {
  const errors: string[] = []
  const warnings: string[] = []
  checkReferential(ref, errors)

  const ingredientById = new Map(ref.ingredients.map((i) => [i.id, i]))
  const groupIds = new Set(ref.groups.map((g) => g.id))
  const membersOf = (groupId: string) => ref.ingredients.filter((i) => i.groups?.includes(groupId))
  // Familles de protéine qu'une ref peut apporter (un groupe : l'union de ses membres).
  const familiesOf = (refId: string): string[] => {
    const ing = ingredientById.get(refId)
    if (ing) return ing.protein ? [ing.protein] : []
    return membersOf(refId).filter((i) => i.protein).map((i) => i.protein!)
  }
  const index = createIndex(ref)
  const blocks = (refId: string) => index.status(refId) === 'obligatoire'
  /** Ingrédients qui décident si le plat est faisable : obligatoires, hors basiques, épices et herbes. */
  const significant = (r: Recipe) => r.ingredients.filter((i) => !i.optional && blocks(i.ref)).map((i) => i.ref)

  const recipes: ValidRecipe[] = []
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
        if (significant(recipe).length < 2)
          warnings.push(`${where} : moins de 2 ingrédients décisifs, la recette serait presque toujours « faisable »`)
      }

      recipes.push({ ...recipe, file })
    })
  }

  const nearDuplicates = findNearDuplicates(recipes, significant)
  for (const d of nearDuplicates)
    warnings.push(`quasi-doublon (${Math.round(d.score * 100)} %) : ${d.a.name} [${d.a.file}] / ${d.b.name} [${d.b.file}]`)

  return { errors, warnings, recipes, nearDuplicates, stats: computeStats(recipes, ref) }
}

/** Paires de même protéine dont les ingrédients décisifs se recouvrent à plus du seuil (Jaccard). */
function findNearDuplicates(recipes: ValidRecipe[], significant: (r: Recipe) => string[]) {
  const sets = recipes.map((r) => new Set(significant(r)))
  const pairs: { a: ValidRecipe; b: ValidRecipe; score: number }[] = []
  for (let i = 0; i < recipes.length; i++)
    for (let j = i + 1; j < recipes.length; j++) {
      if (recipes[i].protein !== recipes[j].protein) continue
      const inter = [...sets[i]].filter((x) => sets[j].has(x)).length
      const union = new Set([...sets[i], ...sets[j]]).size
      const score = union ? inter / union : 0
      if (score > NEAR_DUPLICATE_THRESHOLD) pairs.push({ a: recipes[i], b: recipes[j], score })
    }
  return pairs.sort((x, y) => y.score - x.score)
}

function countBy<T>(items: T[], key: (item: T) => string | string[]) {
  const counts: Record<string, number> = {}
  for (const item of items) for (const k of [key(item)].flat()) counts[k] = (counts[k] ?? 0) + 1
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]))
}

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)

function computeStats(recipes: Recipe[], ref: Referential) {
  const n = recipes.length
  const usedRefs = new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.ref)))
  // Un ingrédient est "utilisé" s'il est demandé directement ou via un de ses groupes.
  // Les basiques sont exclus : les recettes ne listent pas forcément sel et poivre.
  const unusedIngredients = ref.ingredients
    .filter((i) => !ref.basics.includes(i.id) && !usedRefs.has(i.id) && !(i.groups ?? []).some((g) => usedRefs.has(g)))
    .map((i) => i.id)
  // Règle de matching : un groupe par défaut. On liste les ingrédients précis qui ont un groupe.
  const precise = countBy(
    recipes.flatMap((r) => r.ingredients.filter((i) => ref.ingredients.find((x) => x.id === i.ref)?.groups?.length)),
    (i) => i.ref,
  )
  const count = (pred: (r: Recipe) => boolean) => recipes.filter(pred).length
  return {
    recipes: n,
    ingredients: ref.ingredients.length,
    groups: ref.groups.length,
    rapide: pct(count((r) => r.tags.includes('rapide')), n),
    enfants: pct(count((r) => r.tags.includes('enfants')), n),
    monde: pct(count((r) => r.cuisine !== 'francaise'), n),
    byProtein: countBy(recipes, (r) => r.protein),
    byCuisine: countBy(recipes, (r) => r.cuisine),
    byBalance: countBy(recipes, (r) => r.balance.join('')),
    byTag: countBy(recipes, (r) => r.tags),
    bySaison: countBy(recipes, (r) => r.saisons),
    byDifficulty: countBy(recipes, (r) => String(r.difficulty)),
    byTime: countBy(recipes, (r) =>
      r.time <= RAPIDE_MAX_MINUTES ? `<= ${RAPIDE_MAX_MINUTES} min` : r.time <= 45 ? '26-45 min' : '> 45 min',
    ),
    preciseRefsWithGroup: precise,
    unusedIngredients,
    unusedGroups: ref.groups.filter((g) => !usedRefs.has(g.id)).map((g) => g.id),
  }
}

function main() {
  const { errors, warnings, stats } = validate(loadRecipeFiles())
  if (errors.length) {
    console.error(`✗ ${errors.length} erreur(s) :\n` + errors.map((e) => `  - ${e}`).join('\n'))
    process.exit(1)
  }
  const line = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(', ')
  console.log(`✓ ${stats.recipes} recettes valides, ${stats.ingredients} ingrédients, ${stats.groups} groupes`)
  console.log(`\nRapides : ${stats.rapide} %   Enfants : ${stats.enfants} %   Monde : ${stats.monde} %`)
  console.log(`Protéine principale : ${line(stats.byProtein)}`)
  console.log(`Cuisine            : ${line(stats.byCuisine)}`)
  console.log(`Équilibre          : ${line(stats.byBalance)}`)
  console.log(`Tags               : ${line(stats.byTag)}`)
  console.log(`Saisons            : ${line(stats.bySaison)}`)
  console.log(`Temps              : ${line(stats.byTime)}`)
  console.log(`Difficulté         : ${line(stats.byDifficulty)}`)
  console.log(`\nIngrédients précis alors qu'ils ont un groupe : ${line(stats.preciseRefsWithGroup) || 'aucun'}`)
  console.log(`Groupes jamais utilisés (${stats.unusedGroups.length}) : ${stats.unusedGroups.join(', ') || 'aucun'}`)
  console.log(`Ingrédients jamais utilisés (${stats.unusedIngredients.length}) :\n  ${stats.unusedIngredients.join(', ')}`)
  if (warnings.length) console.log(`\n⚠ ${warnings.length} alerte(s) :\n` + warnings.map((w) => `  - ${w}`).join('\n'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
