import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { StockItem } from '../types'

export type StockState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; items: StockItem[] }

/** Écoute en temps réel le stock du foyer, du plus récent au plus ancien. */
export function useStock(householdId: string): StockState {
  const [state, setState] = useState<StockState>({ status: 'loading' })

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'households', householdId, 'stock'),
      (snap) => {
        const items = snap.docs.map(
          // 'estimate' : un ajout local pas encore confirmé par le serveur a un createdAt
          // provisoire au lieu de null, il se trie donc tout de suite en tête de liste.
          (d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as StockItem,
        )
        // Tri côté client plutôt qu'orderBy : quelques dizaines de docs, et pas d'index à gérer.
        items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        setState({ status: 'ready', items })
      },
      (err) => {
        console.error('useStock', err)
        setState({ status: 'error' })
      },
    )
    return unsubscribe
  }, [householdId])

  return state
}
