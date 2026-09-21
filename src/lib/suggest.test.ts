import { describe, expect, it } from 'vitest'
import type { Recipe } from '../data/recipe-schema'
import { RECIPES, REFERENTIAL } from '../data/catalog'
import { createIndex, type Referential } from './referential'
import {
  WEEKDAY_MAX_MINUTES,
  currentSaison,
  ingredientState,
  isWeekday,
  missingRefs,
  suggest,
  weightOf,
  type SuggestOptions,
} from './suggest'

// ---------- Référentiel et recettes de test, indépendants des vraies données ----------

const ref: Referential = {
  ingredients: [
    { id: 'blanc-de-poulet', label: 'Blancs de poulet', emoji: '🍗', category: 'proteine', protein: 'volaille', groups: ['poulet'] },
    { id: 'cuisse-de-poulet', label: 'Cuisses de poulet', emoji: '🍗', category: 'proteine', protein: 'volaille', groups: ['poulet'] },
    { id: 'steak', label: 'Steaks', emoji: '🥩', category: 'proteine', protein: 'boeuf' },
    { id: 'oeuf', label: 'Œufs', emoji: '🥚', category: 'proteine', protein: 'oeuf' },
    { id: 'emmental', label: 'Emmental', emoji: '🧀', category: 'laitier', groups: ['fromage-rape'] },
    { id: 'comte', label: 'Comté', emoji: '🧀', category: 'laitier', groups: ['fromage-rape'] },
    { id: 'creme-fraiche', label: 'Crème fraîche', emoji: '🥛', category: 'laitier', groups: ['creme'] },
    { id: 'pomme-de-terre', label: 'Pommes de terre', emoji: '🥔', category: 'feculent', aliases: ['patate'] },
    { id: 'riz', label: 'Riz', emoji: '🍚', category: 'feculent' },
    { id: 'courgette', label: 'Courgettes', emoji: '🥒', category: 'legume' },
    { id: 'sel', label: 'Sel', emoji: '🧂', category: 'condiment' },
    { id: 'huile-d-olive', label: "Huile d'olive", emoji: '🫒', category: 'epicerie', groups: ['huile'] },
    { id: 'curry', label: 'Curry', emoji: '🍛', category: 'epice' },
    { id: 'persil', label: 'Persil', emoji: '🌿', category: 'herbe', groups: ['herbes-fraiches'] },
  ],
  groups: [
    { id: 'poulet', label: 'Poulet', emoji: '🍗' },
    { id: 'fromage-rape', label: 'Fromage râpé', emoji: '🧀', aliases: ['fromage'] },
    { id: 'creme', label: 'Crème', emoji: '🥛' },
    { id: 'huile', label: 'Huile', emoji: '🫒' },
    { id: 'herbes-fraiches', label: 'Herbes fraîches', emoji: '🌿' },
  ],
  basics: ['sel', 'huile'],
  nonBlockingCategories: ['epice', 'herbe'],
}
const index = createIndex(ref)

type Ing = string | { ref: string; optional: true }
function recipe(id: string, protein: Recipe['protein'], ings: Ing[], extra: Partial<Recipe> = {}): Recipe {
  return {
    id, name: id, emoji: '🍽️', time: 30, difficulty: 1, servings: 4, protein,
    ingredients: ings.map((i) => (typeof i === 'string' ? { ref: i, optional: false } : i)),
    steps: ['Préparer.', 'Servir.'], balance: ['P', 'L', 'F'], saisons: ['toute-annee'], tags: [], cuisine: 'francaise',
    ...extra,
  }
}
const missing = (r: Recipe, stock: string[]) => missingRefs(r, index.resolveStock(stock), index)

/** Hasard déterministe (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const MARDI = 2
const SAMEDI = 6
const DIMANCHE = 0
const opts = (o: Partial<SuggestOptions> = {}): SuggestOptions => ({ weekday: SAMEDI, saison: 'hiver', rng: seeded(1), ...o })
const ids = (s: { recipe: Recipe }[]) => s.map((x) => x.recipe.id)

// ---------- Ce qui manque ----------

describe('missingRefs', () => {
  it('un groupe dans le stock satisfait un membre demandé (optimiste)', () => {
    expect(missing(recipe('r', 'volaille', ['blanc-de-poulet', 'riz']), ['poulet', 'riz'])).toEqual([])
  })

  it('un membre dans le stock satisfait le groupe demandé', () => {
    expect(missing(recipe('r', 'aucune', ['fromage-rape', 'riz']), ['emmental', 'riz'])).toEqual([])
  })

  it('un autre membre du même groupe ne remplace pas un ingrédient précis', () => {
    expect(missing(recipe('r', 'aucune', ['comte', 'riz']), ['emmental', 'riz'])).toEqual(['comte'])
  })

  it('résout les alias et ignore les saisies libres inconnues', () => {
    expect(missing(recipe('r', 'aucune', ['pomme-de-terre', 'riz']), ['patate', 'riz', 'truc-inconnu'])).toEqual([])
    expect(missing(recipe('r', 'aucune', ['fromage-rape', 'riz']), ['fromage', 'riz'])).toEqual([])
  })

  it('ignore les basiques (ingrédient ou groupe)', () => {
    expect(missing(recipe('r', 'aucune', ['riz', 'sel', 'huile']), ['riz'])).toEqual([])
  })

  it('ignore les épices et herbes (ingrédient ou groupe)', () => {
    expect(missing(recipe('r', 'aucune', ['riz', 'curry', 'herbes-fraiches']), ['riz'])).toEqual([])
  })

  it('ignore les ingrédients facultatifs de la recette', () => {
    expect(missing(recipe('r', 'aucune', ['riz', { ref: 'courgette', optional: true }]), ['riz'])).toEqual([])
  })

  it('liste les obligatoires absents', () => {
    expect(missing(recipe('r', 'boeuf', ['steak', 'riz', 'courgette']), ['riz'])).toEqual(['steak', 'courgette'])
  })
})

describe('ingredientState', () => {
  const have = index.resolveStock(['riz', 'poulet'])
  it('distingue en stock, basique, facultatif et manquant', () => {
    expect(ingredientState({ ref: 'blanc-de-poulet', optional: false }, have, index)).toBe('en-stock')
    expect(ingredientState({ ref: 'sel', optional: false }, have, index)).toBe('basique')
    expect(ingredientState({ ref: 'curry', optional: false }, have, index)).toBe('facultatif')
    expect(ingredientState({ ref: 'courgette', optional: true }, have, index)).toBe('facultatif')
    expect(ingredientState({ ref: 'steak', optional: false }, have, index)).toBe('manquant')
  })
})

// ---------- suggest() ----------

describe('suggest', () => {
  const poulet = recipe('poulet-riz', 'volaille', ['poulet', 'riz'])
  const steakRiz = recipe('steak-riz', 'boeuf', ['steak', 'riz'])
  const omelette = recipe('omelette', 'oeuf', ['oeuf', 'fromage-rape'])
  const gratin = recipe('gratin', 'aucune', ['pomme-de-terre', 'creme', 'fromage-rape'])

  it('classe les faisables avant les « presque » et exclut au-delà d’un manquant', () => {
    // Stock : poulet, riz, œufs. omelette : manque le fromage ; gratin : manque 3 choses.
    const res = suggest(['poulet', 'riz', 'oeuf'], [gratin, omelette, poulet], ref, opts())
    expect(res.map((s) => [s.recipe.id, s.missing])).toEqual([['poulet-riz', []], ['omelette', ['fromage-rape']]])
  })

  it(`en semaine, exclut les plats de plus de ${WEEKDAY_MAX_MINUTES} min, sauf mode « on a le temps »`, () => {
    const long = recipe('long', 'boeuf', ['steak', 'riz'], { time: 90 })
    const court = recipe('court', 'volaille', ['poulet', 'riz'], { time: WEEKDAY_MAX_MINUTES })
    const stock = ['steak', 'poulet', 'riz']
    expect(ids(suggest(stock, [long, court], ref, opts({ weekday: MARDI })))).toEqual(['court'])
    expect(ids(suggest(stock, [long, court], ref, opts({ weekday: MARDI, modeLong: true }))).sort()).toEqual(['court', 'long'])
  })

  it('le week-end, pas de limite de temps', () => {
    const long = recipe('long', 'boeuf', ['steak', 'riz'], { time: 180 })
    expect(ids(suggest(['steak', 'riz'], [long], ref, opts({ weekday: SAMEDI })))).toEqual(['long'])
    expect(ids(suggest(['steak', 'riz'], [long], ref, opts({ weekday: DIMANCHE })))).toEqual(['long'])
  })

  it('exclut les plats masqués et ceux déjà vus dans la session', () => {
    const stock = ['poulet', 'riz', 'steak']
    expect(ids(suggest(stock, [poulet, steakRiz], ref, opts({ hidden: ['poulet-riz'] })))).toEqual(['steak-riz'])
    expect(ids(suggest(stock, [poulet, steakRiz], ref, opts({ seen: ['steak-riz'] })))).toEqual(['poulet-riz'])
  })

  it('propose 3 plats de protéines toutes différentes', () => {
    const volailles = Array.from({ length: 6 }, (_, i) => recipe(`poulet-${i}`, 'volaille', ['poulet', 'riz']))
    const stock = ['poulet', 'riz', 'steak', 'oeuf', 'emmental']
    for (let seed = 1; seed <= 20; seed++) {
      const res = suggest(stock, [...volailles, steakRiz, omelette], ref, opts({ rng: seeded(seed) }))
      expect(res).toHaveLength(3)
      expect(new Set(res.map((s) => s.recipe.protein)).size).toBe(3)
    }
  })

  it('complète avec des « presque » quand il n’y a pas assez de faisables, sans doublon de protéine', () => {
    const pouletPresque = recipe('poulet-courgettes', 'volaille', ['poulet', 'courgette'])
    // Faisable : poulet-riz. Presque : steak-riz (steak), omelette (fromage), poulet-courgettes (même protéine).
    const res = suggest(['poulet', 'riz', 'oeuf'], [poulet, steakRiz, omelette, pouletPresque], ref, opts())
    expect(res[0]).toEqual({ recipe: poulet, missing: [] })
    expect(res.slice(1).map((s) => s.recipe.id).sort()).toEqual(['omelette', 'steak-riz'])
    expect(res.slice(1).every((s) => s.missing.length === 1)).toBe(true)
  })

  it('renvoie moins de 3 plats s’il n’y a pas assez de candidats', () => {
    expect(suggest(['poulet', 'riz'], [poulet, gratin], ref, opts())).toHaveLength(1)
  })

  it('stock vide : aucune suggestion', () => {
    expect(suggest([], [poulet, steakRiz, omelette, gratin], ref, opts())).toEqual([])
  })

  it('est déterministe à hasard égal', () => {
    const volailles = Array.from({ length: 6 }, (_, i) => recipe(`poulet-${i}`, 'volaille', ['poulet', 'riz']))
    const run = (seed: number) => ids(suggest(['poulet', 'riz'], volailles, ref, opts({ rng: seeded(seed) })))
    expect(run(42)).toEqual(run(42))
    // rng = 0 prend toujours le premier candidat.
    expect(ids(suggest(['poulet', 'riz'], volailles, ref, opts({ rng: () => 0 })))).toEqual(['poulet-0'])
  })

  it('le tirage favorise la saison et l’équilibre', () => {
    const hiver = recipe('hiver', 'volaille', ['poulet', 'riz'], { saisons: ['hiver'] })
    const ete = recipe('ete', 'volaille', ['poulet', 'riz'], { saisons: ['ete'], balance: ['P'] })
    let countHiver = 0
    const rng = seeded(7)
    for (let i = 0; i < 1000; i++) if (suggest(['poulet', 'riz'], [hiver, ete], ref, opts({ rng }))[0].recipe.id === 'hiver') countHiver++
    // Poids 3 contre 1 : environ 750 sur 1000.
    expect(countHiver).toBeGreaterThan(700)
    expect(countHiver).toBeLessThan(800)
  })
})

describe('weightOf, currentSaison, isWeekday', () => {
  it('pondère équilibre et saison', () => {
    expect(weightOf(recipe('a', 'aucune', ['riz'], { balance: ['P', 'L', 'F'], saisons: ['hiver'] }), 'hiver')).toBe(3)
    expect(weightOf(recipe('b', 'aucune', ['riz'], { balance: ['P'], saisons: ['toute-annee'] }), 'hiver')).toBe(1.5)
    expect(weightOf(recipe('c', 'aucune', ['riz'], { balance: ['P', 'F'], saisons: ['ete'] }), 'hiver')).toBe(1.5)
  })

  it('déduit la saison du mois', () => {
    expect(currentSaison(new Date(2026, 2, 21))).toBe('printemps')
    expect(currentSaison(new Date(2026, 6, 14))).toBe('ete')
    expect(currentSaison(new Date(2026, 8, 21))).toBe('automne')
    expect(currentSaison(new Date(2026, 11, 25))).toBe('hiver')
    expect(currentSaison(new Date(2026, 1, 1))).toBe('hiver')
  })

  it('reconnaît les jours de semaine', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(isWeekday)).toEqual([false, true, true, true, true, true, false])
  })
})

// ---------- Avec le vrai catalogue ----------

describe('suggest sur le vrai catalogue', () => {
  it('charge toutes les recettes, valeurs par défaut appliquées', () => {
    expect(RECIPES.length).toBeGreaterThan(250)
    expect(RECIPES.every((r) => r.servings === 4 && Array.isArray(r.tags) && r.cuisine)).toBe(true)
  })

  it('stock vide : aucune suggestion (aucun plat ne se fait avec les seuls basiques)', () => {
    expect(suggest([], RECIPES, REFERENTIAL, opts({ modeLong: true }))).toEqual([])
  })

  it('stock typique : 3 plats de protéines différentes, compatibles avec un mardi', () => {
    const stock = ['poulet', 'riz', 'pate', 'oeuf', 'emmental', 'creme-fraiche', 'tomate', 'courgette', 'lait', 'pomme-de-terre']
    const res = suggest(stock, RECIPES, REFERENTIAL, opts({ weekday: MARDI, rng: seeded(3) }))
    expect(res).toHaveLength(3)
    expect(new Set(res.map((s) => s.recipe.protein)).size).toBe(3)
    expect(res.every((s) => s.recipe.time <= WEEKDAY_MAX_MINUTES && s.missing.length <= 1)).toBe(true)
  })
})
