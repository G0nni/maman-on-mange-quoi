// Opérations Firestore du vote, sur une instance `db` passée en paramètre : l'app passe la
// sienne (lib/polls.ts), les tests de règles celle de l'émulateur. Pas d'import de lib/firebase.
import { doc, runTransaction, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import { pickWinner } from './tally'

export const MAX_OPTIONS = 4

export class PollError extends Error {
  readonly code: 'closed' | 'full' | 'missing'
  constructor(code: PollError['code']) {
    super(code)
    this.code = code
  }
}

export const pollRef = (db: Firestore, householdId: string, date: string) => doc(db, 'households', householdId, 'polls', date)
export const voteRef = (db: Firestore, householdId: string, date: string, memberId: string) =>
  doc(db, 'households', householdId, 'polls', date, 'votes', memberId)

type PollData = { status: 'open' | 'closed'; options: string[]; winner: string | null }

/**
 * Si un autre téléphone a modifié le poll entre notre lecture et notre écriture, les règles
 * jugent l'écriture sur l'état à jour : on reçoit permission-denied (pas un conflit que le SDK
 * rejouerait). On rejoue donc une fois : la transaction relit l'état réel (poll clos, option
 * déjà ajoutée) et conclut. Un vrai refus (non-membre) échoue deux fois et remonte.
 */
async function retryOnceIfDenied<T>(run: () => Promise<T>) {
  try {
    return await run()
  } catch (err) {
    if ((err as { code?: string }).code !== 'permission-denied') throw err
    return run()
  }
}

/**
 * « Mettre au vote » : crée le poll du jour s'il n'existe pas, sinon ajoute l'option.
 * Transaction : deux téléphones qui mettent au vote en même temps ne s'écrasent pas.
 */
export function addOption(db: Firestore, householdId: string, date: string, recipeId: string, memberId: string) {
  const ref = pollRef(db, householdId, date)
  return retryOnceIfDenied(() => runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) {
      tx.set(ref, { status: 'open', options: [recipeId], createdBy: memberId, winner: null, closedAt: null })
      return 'created' as const
    }
    const poll = snap.data() as PollData
    if (poll.status !== 'open') throw new PollError('closed')
    if (poll.options.includes(recipeId)) return 'already' as const
    if (poll.options.length >= MAX_OPTIONS) throw new PollError('full')
    tx.update(ref, { options: [...poll.options, recipeId] })
    return 'added' as const
  }))
}

/** Vote (ou changement de vote) pour soi. Pas d'await côté UI : le cache local suffit. */
export function castVote(db: Firestore, householdId: string, date: string, memberId: string, recipeId: string) {
  return setDoc(voteRef(db, householdId, date, memberId), { recipeId, updatedAt: serverTimestamp() })
}

/**
 * Clôture : relit le poll et les votes des membres dans une transaction, vérifie qu'il est
 * ouvert, compte, tire au sort en cas d'égalité, écrit closed + winner. Si deux membres
 * clôturent en même temps, l'écriture de la seconde est refusée par les règles (poll plus
 * ouvert), elle est rejouée, voit le poll clos et renvoie le gagnant déjà écrit : un seul gagnant.
 */
export function closePoll(db: Firestore, householdId: string, date: string, memberIds: string[], rng: () => number = Math.random) {
  const ref = pollRef(db, householdId, date)
  return retryOnceIfDenied(() => runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new PollError('missing')
    const poll = snap.data() as PollData
    if (poll.status !== 'open') return poll.winner!
    const ballots: Record<string, string> = {}
    for (const memberId of memberIds) {
      const vote = await tx.get(voteRef(db, householdId, date, memberId))
      if (vote.exists()) ballots[memberId] = (vote.data() as { recipeId: string }).recipeId
    }
    const { winner } = pickWinner(poll.options, ballots, rng)
    tx.update(ref, { status: 'closed', winner, closedAt: serverTimestamp() })
    return winner
  }))
}
