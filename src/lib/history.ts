// Historique des votes : fonctions pures sur des polls déjà chargés.
import { shiftDate } from './dates'

/** Jours d'historique : aujourd'hui et les 6 jours précédents. */
export const HISTORY_DAYS = 7

/** Premier jour (AAAA-MM-JJ, Paris) de la fenêtre d'historique. */
export const historyStart = (today: string, days = HISTORY_DAYS) => shiftDate(today, -(days - 1))

type ClosedPoll = { id: string; status: 'open' | 'closed'; winner: string | null }

/** Plats gagnants des votes clos dans la fenêtre (aujourd'hui compris), sans doublon. */
export function recentWinners(polls: ClosedPoll[], today: string, days = HISTORY_DAYS) {
  const since = historyStart(today, days)
  return [...new Set(polls.filter((p) => p.status === 'closed' && p.winner && p.id >= since && p.id <= today).map((p) => p.winner!))]
}
