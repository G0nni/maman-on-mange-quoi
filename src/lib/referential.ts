// Logique pure autour du référentiel : pas de Firebase, pas de React, pas de données
// importées (le référentiel est passé en paramètre), pour rester testable et hors du bundle.
import type { Category, Ingredient, IngredientGroup } from '../data/ingredients'
import { norm, stockId } from './ingredients'

export type Referential = {
  ingredients: Ingredient[]
  groups: IngredientGroup[]
  basics: string[]
  nonBlockingCategories: readonly Category[]
}

/** Statut d'une ref de recette pour « il manque » (voir CLAUDE.md). */
export type RefStatus = 'basique' | 'non-bloquant' | 'obligatoire'

export type ReferentialIndex = ReturnType<typeof createIndex>

export function createIndex(ref: Referential) {
  const ingredientById = new Map(ref.ingredients.map((i) => [i.id, i]))
  const groupById = new Map(ref.groups.map((g) => [g.id, g]))
  const membersOf = new Map<string, Ingredient[]>()
  for (const i of ref.ingredients) for (const g of i.groups ?? []) membersOf.set(g, [...(membersOf.get(g) ?? []), i])
  const basics = new Set(ref.basics)
  const isNonBlocking = (i: Ingredient) => ref.nonBlockingCategories.includes(i.category)

  // Clé de stock (stockId d'un label ou d'un alias) -> id d'ingrédient ou de groupe.
  const byStockKey = new Map<string, string>()
  for (const g of ref.groups) {
    for (const key of [g.id, stockId(g.label), ...(g.aliases ?? []).map(stockId)]) byStockKey.set(key, g.id)
  }
  for (const i of ref.ingredients) {
    for (const key of [i.id, ...(i.aliases ?? []).map(stockId)]) byStockKey.set(key, i.id)
  }

  function status(refId: string): RefStatus {
    if (basics.has(refId)) return 'basique'
    const ingredient = ingredientById.get(refId)
    if (ingredient) return isNonBlocking(ingredient) ? 'non-bloquant' : 'obligatoire'
    const members = membersOf.get(refId) ?? []
    return members.length && members.every(isNonBlocking) ? 'non-bloquant' : 'obligatoire'
  }

  /** Ids du stock (stockId des noms) -> ids du référentiel. Les saisies libres inconnues sont ignorées. */
  function resolveStock(stockIds: Iterable<string>) {
    const have = new Set<string>()
    for (const id of stockIds) {
      const refId = byStockKey.get(id)
      if (refId) have.add(refId)
    }
    return have
  }

  /**
   * Une ref est satisfaite par elle-même, par un membre si c'est un groupe, ou par l'un de
   * ses groupes présent dans le stock (optimiste : « Poulet » vaut pour « blancs de poulet »).
   * Un autre membre du même groupe ne suffit pas (de l'emmental ne vaut pas du comté).
   */
  function isSatisfied(refId: string, have: Set<string>) {
    if (have.has(refId)) return true
    if (groupById.has(refId)) return (membersOf.get(refId) ?? []).some((m) => have.has(m.id))
    return (ingredientById.get(refId)?.groups ?? []).some((g) => have.has(g))
  }

  function label(refId: string) {
    return ingredientById.get(refId)?.label ?? groupById.get(refId)?.label ?? refId
  }

  return { status, resolveStock, isSatisfied, label, ingredientById, groupById, membersOf }
}

export type PickerEntry = { id: string; label: string; emoji: string; matched?: string }

/**
 * Suggestions pour l'ajout au stock, dès 2 caractères. Cherche dans les labels et alias
 * des ingrédients et des groupes « rangeables » (pas « Semoule, boulgour ou quinoa »).
 * Classement : début du label > début d'un alias > début d'un mot du label.
 */
export function searchReferential(query: string, ref: Referential, limit = 6): PickerEntry[] {
  const q = norm(query)
  if (q.length < 2) return []
  const candidates = [
    ...ref.ingredients,
    ...ref.groups.filter((g) => !g.label.includes(' ou ') && !g.label.includes('(')),
  ]
  const scored: { entry: PickerEntry; score: number }[] = []
  for (const c of candidates) {
    const label = norm(c.label)
    let score = label.startsWith(q) ? 3 : 0
    let matched: string | undefined
    if (!score) {
      const alias = (c.aliases ?? []).find((a) => norm(a).startsWith(q))
      if (alias) [score, matched] = [2, alias]
    }
    if (!score && label.split(' ').some((w) => w.startsWith(q))) score = 1
    if (score) scored.push({ entry: { id: c.id, label: c.label, emoji: c.emoji, matched }, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || a.entry.label.length - b.entry.label.length)
    .slice(0, limit)
    .map((s) => s.entry)
}
