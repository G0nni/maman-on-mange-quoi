import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Household, Member } from '../types'

export type HouseholdState =
  | { status: 'loading' }
  | { status: 'none' } // cet appareil n'appartient à aucun foyer
  | { status: 'unclaimed'; household: Household; members: Member[] } // dans le foyer, mais pas encore "qui es-tu ?"
  | { status: 'ready'; household: Household; members: Member[]; me: Member }

/** Écoute en temps réel le foyer de l'utilisateur et ses membres. */
export function useHousehold(uid: string | undefined): HouseholdState {
  const [household, setHousehold] = useState<Household | null | undefined>(undefined)
  const [members, setMembers] = useState<Member[] | undefined>(undefined)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'households'), where('memberUids', 'array-contains', uid), limit(1))
    return onSnapshot(q, (snap) => {
      const d = snap.docs[0]
      // Foyer tout juste créé sur cet appareil, pas encore confirmé par le serveur
      // (createdAt = serverTimestamp, donc null en local jusqu'à l'accusé). On attend :
      // sinon les listeners des sous-collections (membres, stock...) partent trop tôt,
      // isMember() les refuse côté serveur, et un onSnapshot refusé ne reprend jamais.
      if (d && d.get('createdAt') === null) return
      setHousehold(d ? ({ id: d.id, ...d.data() } as Household) : null)
    })
  }, [uid])

  const householdId = household?.id
  useEffect(() => {
    if (!householdId) return
    return onSnapshot(collection(db, 'households', householdId, 'members'), (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Member))
    })
  }, [householdId])

  if (!uid || household === undefined) return { status: 'loading' }
  if (household === null) return { status: 'none' }
  if (!members) return { status: 'loading' }

  const me = members.find((m) => m.uid === uid)
  return me
    ? { status: 'ready', household, members, me }
    : { status: 'unclaimed', household, members }
}
