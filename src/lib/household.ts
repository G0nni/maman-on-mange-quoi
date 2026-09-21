import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type { JoinCode, Member } from '../types'

// Sans 0/O, 1/I/L : le code se dicte à voix haute sans ambiguïté.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export type NewMember = Pick<Member, 'name' | 'emoji' | 'color'>

/**
 * Crée le foyer, son code d'invitation et le premier membre, en une seule écriture atomique.
 * Si le code existe déjà, la règle "create only" sur joinCodes fait échouer le batch : on retente.
 */
export async function createHousehold(uid: string, householdName: string, member: NewMember) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const householdRef = doc(collection(db, 'households'))
    const memberRef = doc(collection(householdRef, 'members'))

    const batch = writeBatch(db)
    batch.set(householdRef, {
      name: householdName,
      joinCode: code,
      memberUids: [uid],
      createdAt: serverTimestamp(),
    })
    batch.set(doc(db, 'joinCodes', code), { householdId: householdRef.id } satisfies JoinCode)
    batch.set(memberRef, { ...member, uid })

    try {
      await batch.commit()
      return householdRef.id
    } catch (err) {
      if (attempt === 4) throw err
    }
  }
  throw new Error('Impossible de générer un code de foyer')
}

/** Résout un code d'invitation en id de foyer, ou null si le code n'existe pas. */
export async function resolveJoinCode(code: string) {
  const snap = await getDoc(doc(db, 'joinCodes', code.trim().toUpperCase()))
  return snap.exists() ? (snap.data() as JoinCode).householdId : null
}

/**
 * Étape 1 du join : ajoute l'uid courant au foyer. Tant que ce n'est pas fait,
 * les rules interdisent de lire les membres, donc on ne peut pas afficher "qui es-tu ?".
 */
export async function joinHousehold(householdId: string, uid: string) {
  await updateDoc(doc(db, 'households', householdId), { memberUids: arrayUnion(uid) })
}

export async function listMembers(householdId: string) {
  const snap = await getDocs(collection(db, 'households', householdId, 'members'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Member)
}

/** Étape 2a : nouvelle personne dans le foyer. */
export async function addMember(householdId: string, uid: string, member: NewMember) {
  await addDoc(collection(db, 'households', householdId, 'members'), { ...member, uid })
}

/** Étape 2b : "c'est moi", on rattache la session actuelle à un membre existant. */
export async function claimMember(householdId: string, memberId: string, uid: string) {
  await updateDoc(doc(db, 'households', householdId, 'members', memberId), { uid })
}
