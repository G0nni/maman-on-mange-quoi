import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { hiddenRecipesRef } from '../lib/prefs'

/** Ids des plats masqués pour le foyer (« On n'aime pas »), en temps réel. null pendant le chargement. */
export function useHiddenRecipes(householdId: string) {
  const [hidden, setHidden] = useState<string[] | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      hiddenRecipesRef(householdId),
      (snap) => setHidden((snap.data()?.hidden as string[] | undefined) ?? []),
      (err) => {
        console.error('useHiddenRecipes', err)
        setHidden([]) // on propose quand même, sans filtre
      },
    )
    return unsubscribe
  }, [householdId])

  return hidden
}
