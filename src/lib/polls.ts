// Vote du soir côté app : les opérations de poll-ops.ts sur l'instance Firestore de l'app.
import { db } from './firebase'
import { addOption, castVote, closePoll } from './poll-ops'

export { MAX_OPTIONS, PollError } from './poll-ops'

/** « Mettre au vote » (transaction, nécessite le réseau). */
export const addToPoll = (householdId: string, date: string, recipeId: string, memberId: string) =>
  addOption(db, householdId, date, recipeId, memberId)

/** Vote pour soi, sans await côté UI : visible tout de suite, même hors ligne. */
export const voteFor = (householdId: string, date: string, memberId: string, recipeId: string) =>
  castVote(db, householdId, date, memberId, recipeId)

/** Clôture (transaction) : renvoie le gagnant, le même pour tout le monde. */
export const closeTodayPoll = (householdId: string, date: string, memberIds: string[]) =>
  closePoll(db, householdId, date, memberIds)
