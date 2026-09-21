import { z } from 'zod'
import { PROTEIN_FAMILIES } from './ingredients'

/**
 * Schéma d'une recette (src/data/recipes/*.json). Le type Recipe en est déduit.
 * Ce fichier ne vérifie que la structure : l'existence des refs dans le référentiel et la
 * cohérence protéine / végé sont vérifiées par scripts/validate-recipes.ts.
 *
 * Côté app, importer le type avec `import type` : zod reste alors hors du bundle.
 */

const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug attendu : minuscules, chiffres, tirets')

/** Sans unité, qty est un nombre de pièces (« 3 œufs »). */
export const UNITS = [
  'g', 'kg', 'ml', 'cl', 'l',
  'cas', // cuillère à soupe
  'cac', // cuillère à café
  'pincee', 'gousse', 'tranche', 'botte', 'boite', 'sachet', 'pot', 'brin', 'feuille',
] as const

export const BALANCE = ['P', 'L', 'F'] as const // protéines, légumes, féculents
export const SAISONS = ['printemps', 'ete', 'automne', 'hiver', 'toute-annee'] as const
export const TAGS = ['vege', 'rapide', 'enfants', 'four'] as const
// Plats du monde « du quotidien » : ce qu'on trouve en supermarché, pas plus exotique.
export const CUISINES = ['francaise', 'italienne', 'asiatique', 'mexicaine', 'maghrebine', 'autre'] as const
export const RAPIDE_MAX_MINUTES = 25

const RecipeIngredientSchema = z
  .strictObject({
    ref: Slug, // id d'ingrédient ou de groupe du référentiel
    qty: z.number().positive().optional(),
    unit: z.enum(UNITS).optional(),
    optional: z.boolean().default(false),
  })
  .refine((i) => !(i.unit && i.qty === undefined), { message: 'unit sans qty' })

const unique = <T>(arr: readonly T[]) => new Set(arr).size === arr.length

export const RecipeSchema = z
  .strictObject({
    id: Slug,
    name: z.string().min(3).max(80),
    emoji: z.string().min(1).max(8),
    time: z.number().int().min(5).max(300), // minutes, préparation + cuisson
    difficulty: z.number().int().min(1).max(3),
    servings: z.number().int().min(1).max(12).default(4),
    // Protéine principale : sert à ne pas proposer deux plats de la même famille.
    protein: z.enum([...PROTEIN_FAMILIES, 'aucune']),
    ingredients: z.array(RecipeIngredientSchema).min(2),
    steps: z.array(z.string().min(5).max(220)).min(2).max(10),
    balance: z.array(z.enum(BALANCE)).min(1),
    saisons: z.array(z.enum(SAISONS)).min(1),
    tags: z.array(z.enum(TAGS)).default([]),
    cuisine: z.enum(CUISINES).default('francaise'),
  })
  .superRefine((r, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message })
    if (!unique(r.balance)) issue('balance en double')
    if (!unique(r.saisons)) issue('saison en double')
    if (!unique(r.tags)) issue('tag en double')
    if (!unique(r.ingredients.map((i) => i.ref))) issue('ingrédient en double')
    if (r.saisons.includes('toute-annee') && r.saisons.length > 1) issue('toute-annee exclut les autres saisons')
    if (r.tags.includes('rapide') !== r.time <= RAPIDE_MAX_MINUTES)
      issue(`tag rapide incohérent : rapide si et seulement si time <= ${RAPIDE_MAX_MINUTES}`)
    if (r.protein !== 'aucune' && !r.balance.includes('P')) issue('protéine principale sans P dans balance')
  })

export type Recipe = z.infer<typeof RecipeSchema>
export type RecipeIngredient = Recipe['ingredients'][number]
