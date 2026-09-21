import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { guessEmoji, stockId } from './ingredients'
import type { Zone } from '../types'

export const ZONES: { id: Zone; label: string; icon: string }[] = [
  { id: 'frigo', label: 'Frigo', icon: '🧊' },
  { id: 'placard', label: 'Placard', icon: '🗄️' },
  { id: 'congel', label: 'Congélo', icon: '❄️' },
]

/**
 * Ajoute un aliment. L'id du doc est le nom normalisé, donc un doublon vise un doc existant.
 *
 * Pas de lecture préalable : l'écriture apparaît tout de suite via le cache local (y compris
 * hors ligne) et part au serveur dès que possible. La promesse ne se résout qu'à l'accusé
 * du serveur : l'appelant ne doit pas l'attendre pour mettre l'UI à jour.
 *
 * Garde-fou : un setDoc sur un doc existant est une mise à jour, que les rules refusent
 * (name/addedBy/createdAt figés). Le SDK remet alors le cache à la version serveur.
 */
export function addStockItem(householdId: string, name: string, zone: Zone, memberId: string) {
  const id = stockId(name)
  return setDoc(doc(db, 'households', householdId, 'stock', id), {
    name,
    zone,
    emoji: guessEmoji(name),
    addedBy: memberId,
    createdAt: serverTimestamp(),
  })
}

/**
 * Refus des rules sur un ajout : dans l'usage normal de l'écran, c'est un doublon.
 * On lit le code plutôt que `instanceof FirestoreError` : l'erreur réellement rejetée
 * n'est pas une instance de la classe exportée (vérifié avec firebase 12).
 */
export function isDuplicateError(err: unknown) {
  return (err as { code?: string } | null)?.code === 'permission-denied'
}

export async function removeStockItem(householdId: string, itemId: string) {
  await deleteDoc(doc(db, 'households', householdId, 'stock', itemId))
}
