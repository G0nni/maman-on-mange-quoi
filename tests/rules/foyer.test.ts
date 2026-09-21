import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import {
  arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { CODE, HID, anonymous, as, seedHousehold, setupEnv } from './helpers'

let env: RulesTestEnvironment
beforeAll(async () => { env = await setupEnv() })
afterAll(() => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await seedHousehold(env)
})

const household = (uid: string) => doc(as(env, uid), 'households', HID)

describe('households : lecture', () => {
  it('un membre lit son foyer, et le trouve par la requête array-contains', async () => {
    await assertSucceeds(getDoc(household('alice')))
    await assertSucceeds(getDocs(query(collection(as(env, 'alice'), 'households'), where('memberUids', 'array-contains', 'alice'))))
  })

  it('un non-membre ne lit pas le foyer, un anonyme non plus', async () => {
    await assertFails(getDoc(household('eve')))
    await assertFails(getDoc(doc(anonymous(env), 'households', HID)))
  })
})

describe('households : création (batch foyer + code + premier membre, comme createHousehold)', () => {
  const create = (uid: string, data: Record<string, unknown>, codeTarget?: string) => {
    const db = as(env, uid)
    const ref = doc(collection(db, 'households'))
    const batch = writeBatch(db)
    batch.set(ref, data)
    batch.set(doc(db, 'joinCodes', 'NEW234'), { householdId: codeTarget ?? ref.id })
    batch.set(doc(collection(ref, 'members')), { name: 'Eve', emoji: '🙂', color: '#000', uid })
    return batch.commit()
  }
  const valid = (uid: string) => ({ name: 'Chez Eve', joinCode: 'NEW234', memberUids: [uid], createdAt: serverTimestamp() })

  it('réussit pour soi-même', async () => {
    await assertSucceeds(create('eve', valid('eve')))
  })

  it('refuse un foyer dont memberUids contient quelqu’un d’autre', async () => {
    await assertFails(create('eve', { ...valid('eve'), memberUids: ['eve', 'alice'] }))
  })

  it('refuse un champ en trop', async () => {
    await assertFails(create('eve', { ...valid('eve'), admin: true }))
  })

  it('refuse un code d’invitation qui pointe vers le foyer de quelqu’un d’autre', async () => {
    await assertFails(create('eve', valid('eve'), HID))
  })
})

describe('households : modification', () => {
  it('un membre peut renommer le foyer (1 à 60 caractères)', async () => {
    await assertSucceeds(updateDoc(household('alice'), { name: 'Les Cros' }))
    await assertFails(updateDoc(household('alice'), { name: '' }))
    await assertFails(updateDoc(household('alice'), { name: 'x'.repeat(61) }))
    await assertFails(updateDoc(household('alice'), { name: 42 }))
  })

  it('un membre ne peut pas retirer un membre, changer le code ni createdAt', async () => {
    await assertFails(updateDoc(household('alice'), { memberUids: ['alice'] }))
    await assertFails(updateDoc(household('alice'), { joinCode: 'ZZZ234' }))
    await assertFails(updateDoc(household('alice'), { createdAt: serverTimestamp() }))
  })

  it('un non-membre peut s’ajouter lui-même (join), et rien d’autre', async () => {
    await assertSucceeds(updateDoc(household('eve'), { memberUids: arrayUnion('eve') }))
  })

  it('un non-membre ne peut pas ajouter quelqu’un d’autre, ni renommer en même temps', async () => {
    await assertFails(updateDoc(household('eve'), { memberUids: arrayUnion('mallory') }))
    await assertFails(updateDoc(household('eve'), { memberUids: arrayUnion('eve'), name: 'Piraté' }))
  })

  it('personne ne supprime un foyer', async () => {
    await assertFails(deleteDoc(household('alice')))
  })
})

describe('joinCodes', () => {
  it('lecture doc par doc pour tout utilisateur connecté, jamais en liste', async () => {
    await assertSucceeds(getDoc(doc(as(env, 'eve'), 'joinCodes', CODE)))
    await assertFails(getDoc(doc(anonymous(env), 'joinCodes', CODE)))
    await assertFails(getDocs(collection(as(env, 'alice'), 'joinCodes')))
  })

  it('impossible d’écraser ou de supprimer un code existant', async () => {
    await assertFails(setDoc(doc(as(env, 'alice'), 'joinCodes', CODE), { householdId: HID }))
    await assertFails(deleteDoc(doc(as(env, 'alice'), 'joinCodes', CODE)))
  })

  it('un membre ne peut pas créer un code isolé pour un foyer qui n’est pas le sien', async () => {
    await assertFails(setDoc(doc(as(env, 'eve'), 'joinCodes', 'EVE234'), { householdId: HID }))
  })
})

describe('members', () => {
  const member = (uid: string, id: string) => doc(as(env, uid), 'households', HID, 'members', id)

  it('les membres lisent la liste, pas les autres', async () => {
    await assertSucceeds(getDocs(collection(as(env, 'bob'), 'households', HID, 'members')))
    await assertFails(getDocs(collection(as(env, 'eve'), 'households', HID, 'members')))
  })

  it('après son join, on crée son propre profil, pas celui d’un autre', async () => {
    await assertSucceeds(updateDoc(household('eve'), { memberUids: arrayUnion('eve') }))
    await assertSucceeds(setDoc(member('eve', 'm-eve'), { name: 'Eve', emoji: '🙂', color: '#000', uid: 'eve' }))
    await assertFails(setDoc(member('eve', 'm-faux'), { name: 'Faux', emoji: '🙂', color: '#000', uid: 'alice' }))
  })

  it('un non-membre ne crée pas de profil', async () => {
    await assertFails(setDoc(member('eve', 'm-eve'), { name: 'Eve', emoji: '🙂', color: '#000', uid: 'eve' }))
  })

  it('« c’est moi » : un membre rattache sa session à un profil (récupération iOS, choix assumé)', async () => {
    await assertSucceeds(updateDoc(member('bob', 'm-alice'), { uid: 'bob' }))
  })

  it('on ne rattache pas un profil à la session de quelqu’un d’autre', async () => {
    await assertFails(updateDoc(member('bob', 'm-alice'), { uid: 'eve' }))
  })

  it('un non-membre ne modifie pas un profil, personne ne supprime', async () => {
    await assertFails(updateDoc(member('eve', 'm-alice'), { uid: 'eve' }))
    await assertFails(deleteDoc(member('alice', 'm-alice')))
  })
})
