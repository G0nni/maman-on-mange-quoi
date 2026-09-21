// Dépouillement du vote : fonctions pures, hasard injectable.

/** memberId -> recipeId */
export type Ballots = Record<string, string>

/** Votants par plat, dans l'ordre des options. Un vote pour un plat hors options est ignoré. */
export function tally(options: string[], ballots: Ballots) {
  const byRecipe = new Map(options.map((id) => [id, [] as string[]]))
  for (const [memberId, recipeId] of Object.entries(ballots)) byRecipe.get(recipeId)?.push(memberId)
  return byRecipe
}

/**
 * Plat gagnant : le plus de voix ; en cas d'égalité (y compris personne n'a voté),
 * tirage au sort parmi les ex aequo.
 */
export function pickWinner(options: string[], ballots: Ballots, rng: () => number = Math.random) {
  if (!options.length) throw new Error('Aucune option à départager')
  const counts = tally(options, ballots)
  const max = Math.max(...[...counts.values()].map((v) => v.length))
  const top = options.filter((id) => counts.get(id)!.length === max)
  const winner = top[Math.min(top.length - 1, Math.floor(rng() * top.length))]
  return { winner, tie: top.length > 1, counts }
}
