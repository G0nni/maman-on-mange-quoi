import { deleteDoc, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { guessEmoji, stockId } from './ingredients'
import type { Zone } from '../types'

export const ZONES: { id: Zone; label: string; icon: string }[] = [
  { id: 'frigo', label: 'Frigo', icon: '🧊' },
  { id: 'placard', label: 'Placard', icon: '🗄️' },
  { id: 'congel', label: 'Congélo', icon: '❄️' },
]

export class AlreadyInStockError extends Error {}

/**
 * Ajoute un aliment. L'id du doc est le nom normalisé : la transaction lit ce doc
 * et refuse d'écraser s'il existe (cas où la liste en mémoire n'était pas encore à jour).
 * Les transactions exigent le réseau : hors ligne, la promesse est rejetée.
 */
export async function addStockItem(householdId: string, name: string, zone: Zone, memberId: string) {
  const id = stockId(name)
  if (!id) throw new Error('Nom invalide')
  const ref = doc(db, 'households', householdId, 'stock', id)

  await runTransaction(db, async (tx) => {
    if ((await tx.get(ref)).exists()) throw new AlreadyInStockError()
    tx.set(ref, { name, zone, emoji: guessEmoji(name), addedBy: memberId, createdAt: serverTimestamp() })
  })
}

export async function removeStockItem(householdId: string, itemId: string) {
  await deleteDoc(doc(db, 'households', householdId, 'stock', itemId))
}
