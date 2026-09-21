// Mots qui finissent par s/x au singulier : on ne leur retire pas la dernière lettre.
// Formes déjà normalisées (minuscules, sans accents : maïs -> mais).
const INVARIABLES = new Set([
  'ananas', 'anchois', 'brebis', 'cassis', 'coulis', 'couscous', 'frais', 'gras',
  'hachis', 'jus', 'mais', 'noix', 'panais', 'pois', 'radis', 'salsifis',
])

function singular(word: string) {
  if (word.length <= 2 || INVARIABLES.has(word)) return word
  return word.replace(/[sx]$/, '')
}

/**
 * Normalise un nom d'ingrédient pour comparer et indexer : minuscules, sans accents,
 * sans ponctuation, au singulier. "Pommes de terre" -> "pomme de terre".
 *
 * ATTENTION : sert à générer l'id des documents stock (voir stockId). Changer son
 * comportement change les ids, donc les doublons ne seraient plus détectés pour les
 * aliments déjà en base. Les tests de ingredients.test.ts verrouillent le comportement.
 */
export function norm(name: string) {
  return name
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(singular)
    .join(' ')
}

/** Id du document households/{hid}/stock/{id} : "Pommes de terre" -> "pomme-de-terre". */
export function stockId(name: string) {
  return norm(name).replace(/ /g, '-')
}

// Clés au format norm().
export const EMOJIS: Record<string, string> = {
  poulet: '🍗', riz: '🍚', courgette: '🥒', oeuf: '🥚', tomate: '🍅', pate: '🍝',
  oignon: '🧅', fromage: '🧀', lait: '🥛', carotte: '🥕', 'pomme de terre': '🥔',
  lentille: '🫘', creme: '🥛', thon: '🐟', ail: '🧄', boeuf: '🥩', saumon: '🐟',
  pain: '🥖', beurre: '🧈', jambon: '🥓', poivron: '🫑', champignon: '🍄', pomme: '🍎',
}

// Les plus longues d'abord : "pomme de terre" doit passer avant "pomme".
const EMOJI_KEYS = Object.keys(EMOJIS).sort((a, b) => b.length - a.length)

/** Devine un emoji à partir du nom. Correspondance sur des mots entiers ("caille" ne donne pas l'ail). */
export function guessEmoji(name: string) {
  const padded = ` ${norm(name)} `
  const key = EMOJI_KEYS.find((k) => padded.includes(` ${k} `))
  return key ? EMOJIS[key] : '🥫'
}
