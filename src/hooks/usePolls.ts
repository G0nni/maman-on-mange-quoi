import { useEffect, useState } from 'react'
import { collection, documentId, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Poll, Vote } from '../types'

/**
 * Polls du foyer depuis `since` (AAAA-MM-JJ, inclus), en temps réel : le vote du jour et
 * l'historique récent en une seule écoute. Les ids étant des dates, l'ordre des ids est
 * l'ordre chronologique. null pendant le chargement.
 */
export function useRecentPolls(householdId: string, since: string) {
  const [polls, setPolls] = useState<Poll[] | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'households', householdId, 'polls'), where(documentId(), '>=', since))
    const unsubscribe = onSnapshot(
      q,
      (snap) => setPolls(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Poll)),
      (err) => {
        console.error('useRecentPolls', err)
        setPolls([])
      },
    )
    return unsubscribe
  }, [householdId, since])

  return polls
}

/** Votes d'un poll en temps réel (pollId null : rien à écouter). */
export function useVotes(householdId: string, pollId: string | null) {
  const [votes, setVotes] = useState<Vote[]>([])

  useEffect(() => {
    if (!pollId) return
    const unsubscribe = onSnapshot(
      collection(db, 'households', householdId, 'polls', pollId, 'votes'),
      (snap) => setVotes(snap.docs.map((d) => ({ memberId: d.id, ...d.data() }) as Vote)),
      (err) => console.error('useVotes', err),
    )
    return () => {
      unsubscribe()
      setVotes([])
    }
  }, [householdId, pollId])

  return votes
}
