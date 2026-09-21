// Dates « du foyer » : toujours en heure de Paris, jamais en UTC. Un vote lancé à 00 h 30
// le 22 septembre appartient au 22, même s'il est encore le 21 en UTC.

const PARIS = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })

/** « 2026-09-21 » : la date en heure de Paris (l'id du poll du jour). */
export function parisDate(date = new Date()) {
  return PARIS.format(date) // en-CA formate déjà en AAAA-MM-JJ
}

/** Décale une date AAAA-MM-JJ d'un nombre de jours (calcul calendaire, insensible à l'heure d'été). */
export function shiftDate(ymd: string, days: number) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
