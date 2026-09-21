import type { Timestamp } from 'firebase/firestore'

// households/{householdId}
export type Household = {
  id: string
  name: string
  joinCode: string
  // Tous les uid Firebase rattachés au foyer. C'est ce champ que les Security Rules
  // consultent pour savoir si la requête vient d'un membre.
  memberUids: string[]
  createdAt: Timestamp
}

// households/{householdId}/members/{memberId}
// Un membre = une personne. Son uid peut changer (nouveau téléphone, PWA iOS réinstallée...).
export type Member = {
  id: string
  name: string
  emoji: string
  color: string
  uid: string
}

// joinCodes/{code} : index code -> foyer, lisible doc par doc mais jamais listable.
export type JoinCode = {
  householdId: string
}

export type Zone = 'frigo' | 'placard' | 'congel'

// households/{householdId}/stock/{itemId}
// itemId = stockId(name) : deux variantes d'un même aliment tombent sur le même document.
export type StockItem = {
  id: string
  name: string
  zone: Zone
  emoji: string
  addedBy: string // memberId
  createdAt: Timestamp
}
