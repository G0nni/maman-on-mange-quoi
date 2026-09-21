import type { RecipeIngredient } from '../data/recipe-schema'

type Unit = NonNullable<RecipeIngredient['unit']>

// [singulier, pluriel]. Les symboles (g, cl…) ne prennent pas de s.
const UNIT_LABELS: Record<Unit, [string, string]> = {
  g: ['g', 'g'],
  kg: ['kg', 'kg'],
  ml: ['ml', 'ml'],
  cl: ['cl', 'cl'],
  l: ['l', 'l'],
  cas: ['c. à soupe', 'c. à soupe'],
  cac: ['c. à café', 'c. à café'],
  pincee: ['pincée', 'pincées'],
  gousse: ['gousse', 'gousses'],
  tranche: ['tranche', 'tranches'],
  botte: ['botte', 'bottes'],
  boite: ['boîte', 'boîtes'],
  sachet: ['sachet', 'sachets'],
  pot: ['pot', 'pots'],
  brin: ['brin', 'brins'],
  feuille: ['feuille', 'feuilles'],
}

/** « 400 g », « 2 c. à soupe », « 0,5 botte », « 3 » (pièces), ou '' sans quantité. */
export function formatQty(qty?: number, unit?: Unit) {
  if (qty === undefined) return ''
  const n = qty.toLocaleString('fr-FR')
  if (!unit) return n
  const [one, many] = UNIT_LABELS[unit]
  return `${n} ${qty >= 2 ? many : one}`
}

/** « Il manque : crème fraîche » (première lettre des libellés en minuscule). */
export const missingText = (labels: string[]) =>
  `Il manque : ${labels.map((l) => l.charAt(0).toLowerCase() + l.slice(1)).join(', ')}`
