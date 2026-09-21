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

/**
 * Précharge le catalogue quand le navigateur est inactif, pour que l'écran Idées et
 * l'autocomplétion s'affichent sans attente. Safari (iPhone) n'a pas requestIdleCallback :
 * repli sur un délai. Renvoie une fonction d'annulation (cleanup d'useEffect).
 */
export function preloadCatalogWhenIdle() {
  const run = () => void loadCatalog().catch(() => {}) // échec silencieux : useCatalog réessaiera
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(run, { timeout: 5000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(run, 1500)
  return () => clearTimeout(id)
}
