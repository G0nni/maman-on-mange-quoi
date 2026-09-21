// Suggestions de repas : fonction pure (ni Firebase ni React), hasard injectable pour les tests.
import type { Recipe, RecipeIngredient } from '../data/recipe-schema'
import { createIndex, type Referential, type ReferentialIndex } from './referential'

export type Saison = 'printemps' | 'ete' | 'automne' | 'hiver'

/** Du lundi au vendredi, sauf « On a le temps ce soir ». */
export const WEEKDAY_MAX_MINUTES = 45
/** Au-delà d'un ingrédient manquant, la recette n'est pas proposée. */
export const MAX_MISSING = 1

export type SuggestOptions = {
  /** 0 = dimanche … 6 = samedi (Date.getDay()). */
  weekday: number
  saison: Saison
  /** Masquées pour le foyer (« On n'aime pas »). */
  hidden?: Iterable<string>
  /** Déjà proposées pendant la session. */
  seen?: Iterable<string>
  /** Gagnants des votes des 7 derniers jours (recentWinners()) : on ne remange pas le même plat. */
  recentWinners?: Iterable<string>
  /** « On a le temps ce soir » : lève la limite de temps en semaine. */
  modeLong?: boolean
  count?: number
  /** Nombre dans [0, 1[, Math.random par défaut. */
  rng?: () => number
}

export type Suggestion = {
  recipe: Recipe
  /** Refs obligatoires absentes du stock (0 = faisable, 1 = presque). */
  missing: string[]
}

export const isWeekday = (weekday: number) => weekday >= 1 && weekday <= 5

export function currentSaison(date: Date): Saison {
  const m = date.getMonth() // 0 = janvier
  if (m >= 2 && m <= 4) return 'printemps'
  if (m >= 5 && m <= 7) return 'ete'
  if (m >= 8 && m <= 10) return 'automne'
  return 'hiver'
}

/** Refs qui manquent : obligatoires, non facultatives dans la recette, absentes du stock. */
export function missingRefs(recipe: Recipe, have: Set<string>, index: ReferentialIndex) {
  return recipe.ingredients
    .filter((i) => !i.optional && index.status(i.ref) === 'obligatoire' && !index.isSatisfied(i.ref, have))
    .map((i) => i.ref)
}

export type IngredientState = 'en-stock' | 'basique' | 'facultatif' | 'manquant'

/** Statut affiché dans la fiche recette. */
export function ingredientState(ing: RecipeIngredient, have: Set<string>, index: ReferentialIndex): IngredientState {
  if (index.isSatisfied(ing.ref, have)) return 'en-stock'
  const status = index.status(ing.ref)
  if (status === 'basique') return 'basique'
  if (ing.optional || status === 'non-bloquant') return 'facultatif'
  return 'manquant'
}

/**
 * Poids pour le tirage : 1 de base, jusqu'à +1 pour l'équilibre P/L/F (3 composantes),
 * +1 pour un plat de la saison courante, +0,5 pour un plat de toute l'année.
 */
export function weightOf(recipe: Recipe, saison: Saison) {
  const balance = (recipe.balance.length - 1) / 2
  const season = recipe.saisons.includes(saison) ? 1 : recipe.saisons.includes('toute-annee') ? 0.5 : 0
  return 1 + balance + season
}

function weightedPick<T>(items: T[], weight: (item: T) => number, rng: () => number) {
  const weights = items.map(weight)
  let r = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r < 0) return items[i]
  }
  return items[items.length - 1]
}

/**
 * Propose jusqu'à `count` plats (3 par défaut), de protéines toutes différentes
 * (« aucune » compte comme une protéine). Faisables d'abord, puis « presque »
 * (1 ingrédient manquant) pour compléter. Tirage pondéré par weightOf().
 */
export function suggest(stockIds: Iterable<string>, recipes: Recipe[], ref: Referential, options: SuggestOptions): Suggestion[] {
  const { weekday, saison, modeLong = false, count = 3, rng = Math.random } = options
  const index = createIndex(ref)
  const have = index.resolveStock(stockIds)
  const excluded = new Set([...(options.hidden ?? []), ...(options.seen ?? []), ...(options.recentWinners ?? [])])
  const timeLimit = isWeekday(weekday) && !modeLong ? WEEKDAY_MAX_MINUTES : Infinity

  const faisables: Suggestion[] = []
  const presque: Suggestion[] = []
  for (const recipe of recipes) {
    if (excluded.has(recipe.id) || recipe.time > timeLimit) continue
    const missing = missingRefs(recipe, have, index)
    if (missing.length === 0) faisables.push({ recipe, missing })
    else if (missing.length <= MAX_MISSING) presque.push({ recipe, missing })
  }

  const picked: Suggestion[] = []
  const proteins = new Set<string>()
  for (const pool of [faisables, presque]) {
    let candidates = pool.filter((s) => !proteins.has(s.recipe.protein))
    while (picked.length < count && candidates.length) {
      const choice = weightedPick(candidates, (s) => weightOf(s.recipe, saison), rng)
      picked.push(choice)
      proteins.add(choice.recipe.protein)
      candidates = candidates.filter((s) => !proteins.has(s.recipe.protein))
    }
  }
  return picked
}
