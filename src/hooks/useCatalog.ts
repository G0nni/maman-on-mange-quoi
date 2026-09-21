import { useEffect, useState } from 'react'

export type Catalog = typeof import('../data/catalog')

let pending: Promise<Catalog> | null = null

/** Charge recettes + référentiel une seule fois, dans un chunk séparé du bundle principal. */
export function loadCatalog() {
  pending ??= import('../data/catalog').catch((err) => {
    pending = null // nouvel essai au prochain appel (ex. réseau revenu)
    throw err
  })
  return pending
}

/** null tant que le catalogue n'est pas chargé. `enabled` permet de différer le chargement. */
export function useCatalog(enabled = true) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    loadCatalog().then(
      (c) => alive && setCatalog(c),
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [enabled])

  return { catalog, error }
}
