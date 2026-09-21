import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { HID, as, seed, seedHousehold, setupEnv } from './helpers'

let env: RulesTestEnvironment
beforeAll(async () => { env = await setupEnv() })
afterAll(() => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await seedHousehold(env)
})

// ---------- Stock ----------

const item = (uid: string, id: string) => doc(as(env, uid), 'households', HID, 'stock', id)
const valid = (o: Record<string, unknown> = {}) => ({
  name: 'Tomates', zone: 'frigo', emoji: '🍅', addedBy: 'm-alice', createdAt: serverTimestamp(), ...o,
})

describe('stock : création', () => {
  it('un membre ajoute un aliment valide', async () => {
    await assertSucceeds(setDoc(item('alice', 'tomate'), valid()))
  })

  it('refuse un id non normalisé (majuscules, espaces, accents)', async () => {
    await assertFails(setDoc(item('alice', 'Tomates'), valid()))
    await assertFails(setDoc(item('alice', 'pomme de terre'), valid()))
    await assertFails(setDoc(item('alice', 'crème'), valid()))
  })

  it('refuse une zone inconnue, un champ en trop, un champ manquant', async () => {
    await assertFails(setDoc(item('alice', 'tomate'), valid({ zone: 'cave' })))
    await assertFails(setDoc(item('alice', 'tomate'), valid({ qty: 3 })))
    const { emoji: _e, ...sansEmoji } = valid()
    void _e
    await assertFails(setDoc(item('alice', 'tomate'), sansEmoji))
  })

  it('refuse un nom vide ou trop long', async () => {
    await assertFails(setDoc(item('alice', 'tomate'), valid({ name: '' })))
    await assertFails(setDoc(item('alice', 'tomate'), valid({ name: 'x'.repeat(61) })))
  })

  it('addedBy doit être le membre connecté, createdAt l’heure du serveur', async () => {
    await assertFails(setDoc(item('alice', 'tomate'), valid({ addedBy: 'm-bob' })))
    await assertFails(setDoc(item('alice', 'tomate'), valid({ createdAt: new Date() })))
  })

  it('un non-membre n’ajoute rien et ne lit rien', async () => {
    await assertFails(setDoc(item('eve', 'tomate'), valid({ addedBy: 'm-eve' })))
    await assertFails(getDocs(collection(as(env, 'eve'), 'households', HID, 'stock')))
  })
})

describe('stock : doublons et modifications', () => {
  beforeEach(() => seed(env, (db) => setDoc(doc(db, 'households', HID, 'stock', 'carotte'), valid({ name: 'Carottes', emoji: '🥕', createdAt: new Date() }))))

  it('un setDoc sur un aliment déjà présent est refusé (garde-fou anti-doublon)', async () => {
    await assertFails(setDoc(item('bob', 'carotte'), valid({ name: 'carotte', addedBy: 'm-bob' })))
  })

  it('on peut changer de zone ou d’emoji, pas renommer ni changer addedBy/createdAt', async () => {
    await assertSucceeds(updateDoc(item('bob', 'carotte'), { zone: 'placard' }))
    await assertSucceeds(updateDoc(item('bob', 'carotte'), { emoji: '🥬' }))
    await assertFails(updateDoc(item('bob', 'carotte'), { zone: 'cave' }))
    await assertFails(updateDoc(item('bob', 'carotte'), { name: 'Carotte' }))
    await assertFails(updateDoc(item('bob', 'carotte'), { addedBy: 'm-bob' }))
  })

  it('un membre supprime, un non-membre non', async () => {
    await assertFails(deleteDoc(item('eve', 'carotte')))
    await assertSucceeds(deleteDoc(item('bob', 'carotte')))
  })
})

// ---------- Préférences (plats masqués) ----------

const prefs = (uid: string, id = 'recipes') => doc(as(env, uid), 'households', HID, 'prefs', id)

describe('prefs/recipes', () => {
  it('un membre masque et remet des plats (merge + arrayUnion/arrayRemove), et les lit', async () => {
    await assertSucceeds(setDoc(prefs('alice'), { hidden: arrayUnion('tartiflette') }, { merge: true }))
    await assertSucceeds(setDoc(prefs('bob'), { hidden: arrayRemove('tartiflette') }, { merge: true }))
    await assertSucceeds(getDoc(prefs('bob')))
  })

  it('hidden doit être une liste, sans autre champ', async () => {
    await assertFails(setDoc(prefs('alice'), { hidden: 'tartiflette' }))
    await assertFails(setDoc(prefs('alice'), { hidden: [], extra: 1 }))
  })

  it('500 plats masqués maximum', async () => {
    await assertSucceeds(setDoc(prefs('alice'), { hidden: Array.from({ length: 500 }, (_, i) => `r${i}`) }))
    await assertFails(setDoc(prefs('alice'), { hidden: Array.from({ length: 501 }, (_, i) => `r${i}`) }))
  })

  it('seul le document « recipes » est autorisé', async () => {
    await assertFails(setDoc(prefs('alice', 'autre'), { hidden: [] }))
  })

  it('un non-membre ne lit ni n’écrit, personne ne supprime', async () => {
    await assertFails(getDoc(prefs('eve')))
    await assertFails(setDoc(prefs('eve'), { hidden: ['x'] }))
    await assertSucceeds(setDoc(prefs('alice'), { hidden: [] }))
    await assertFails(deleteDoc(prefs('alice')))
  })
})
