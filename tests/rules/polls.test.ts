import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { HID, as, seed, seedHousehold, setupEnv } from './helpers'
import { PollError, addOption, castVote, closePoll } from '../../src/lib/poll-ops'

const DATE = '2026-09-21'
let env: RulesTestEnvironment
beforeAll(async () => { env = await setupEnv() })
afterAll(() => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await seedHousehold(env)
})

const poll = (uid: string, id = DATE) => doc(as(env, uid), 'households', HID, 'polls', id)
const vote = (uid: string, memberId: string) => doc(as(env, uid), 'households', HID, 'polls', DATE, 'votes', memberId)
const newPoll = (o: Record<string, unknown> = {}) => ({
  status: 'open', options: ['pates'], createdBy: 'm-alice', winner: null, closedAt: null, ...o,
})
/** Poll existant, écrit sans règles. */
const seedPoll = (o: Record<string, unknown> = {}) =>
  seed(env, (db) => setDoc(doc(db, 'households', HID, 'polls', DATE), newPoll({ options: ['pates', 'poulet'], ...o })))

// ---------- Création ----------

describe('polls : création', () => {
  it('un membre crée le vote du jour avec une première option', async () => {
    await assertSucceeds(setDoc(poll('alice'), newPoll()))
  })

  it('l’id doit être une date AAAA-MM-JJ', async () => {
    await assertFails(setDoc(poll('alice', 'ce-soir'), newPoll()))
    await assertFails(setDoc(poll('alice', '21-09-2026'), newPoll()))
  })

  it('un vote se crée ouvert, sans gagnant ni date de clôture', async () => {
    await assertFails(setDoc(poll('alice'), newPoll({ status: 'closed' })))
    await assertFails(setDoc(poll('alice'), newPoll({ winner: 'pates' })))
    await assertFails(setDoc(poll('alice'), newPoll({ closedAt: serverTimestamp() })))
  })

  it('1 à 4 options à la création', async () => {
    await assertFails(setDoc(poll('alice'), newPoll({ options: [] })))
    await assertFails(setDoc(poll('alice'), newPoll({ options: ['a', 'b', 'c', 'd', 'e'] })))
    await assertSucceeds(setDoc(poll('alice'), newPoll({ options: ['a', 'b', 'c', 'd'] })))
  })

  it('createdBy doit être le membre connecté, pas de champ en plus', async () => {
    await assertFails(setDoc(poll('alice'), newPoll({ createdBy: 'm-bob' })))
    await assertFails(setDoc(poll('alice'), newPoll({ note: 'x' })))
  })

  it('un non-membre ne crée ni ne lit de vote', async () => {
    await assertFails(setDoc(poll('eve'), newPoll({ createdBy: 'm-eve' })))
    await seedPoll()
    await assertFails(getDoc(poll('eve')))
    await assertSucceeds(getDoc(poll('bob')))
  })
})

// ---------- Options ----------

describe('polls : ajout d’options', () => {
  beforeEach(() => seedPoll())

  it('on ajoute une option à la fin, jusqu’à 4', async () => {
    await assertSucceeds(updateDoc(poll('bob'), { options: ['pates', 'poulet', 'soupe'] }))
    await assertSucceeds(updateDoc(poll('bob'), { options: ['pates', 'poulet', 'soupe', 'tarte'] }))
  })

  it('refuse une 5e option', async () => {
    await assertSucceeds(updateDoc(poll('bob'), { options: ['pates', 'poulet', 'soupe'] }))
    await assertSucceeds(updateDoc(poll('bob'), { options: ['pates', 'poulet', 'soupe', 'tarte'] }))
    await assertFails(updateDoc(poll('bob'), { options: ['pates', 'poulet', 'soupe', 'tarte', 'gratin'] }))
  })

  it('refuse un doublon, un retrait, un remplacement, deux ajouts d’un coup', async () => {
    await assertFails(updateDoc(poll('bob'), { options: ['pates', 'poulet', 'pates'] }))
    await assertFails(updateDoc(poll('bob'), { options: ['pates'] }))
    await assertFails(updateDoc(poll('bob'), { options: ['pates', 'soupe'] }))
    await assertFails(updateDoc(poll('bob'), { options: ['pates', 'poulet', 'soupe', 'tarte'] }))
  })

  it('refuse l’ajout sur un vote clos', async () => {
    await seedPoll({ status: 'closed', winner: 'pates', closedAt: new Date() })
    await assertFails(updateDoc(poll('bob'), { options: ['pates', 'poulet', 'soupe'] }))
  })
})

// ---------- Clôture ----------

describe('polls : clôture', () => {
  beforeEach(() => seedPoll())

  it('n’importe quel membre clôt, avec un gagnant parmi les options', async () => {
    await assertSucceeds(updateDoc(poll('bob'), { status: 'closed', winner: 'poulet', closedAt: serverTimestamp() }))
  })

  it('refuse un gagnant hors options, une date de clôture qui n’est pas celle du serveur', async () => {
    await assertFails(updateDoc(poll('bob'), { status: 'closed', winner: 'tarte', closedAt: serverTimestamp() }))
    await assertFails(updateDoc(poll('bob'), { status: 'closed', winner: 'poulet', closedAt: new Date() }))
  })

  it('refuse de changer d’options en même temps que la clôture', async () => {
    await assertFails(updateDoc(poll('bob'), { status: 'closed', winner: 'poulet', closedAt: serverTimestamp(), options: ['poulet'] }))
  })

  it('personne ne rouvre un vote clos, ni ne change son gagnant', async () => {
    await assertSucceeds(updateDoc(poll('bob'), { status: 'closed', winner: 'poulet', closedAt: serverTimestamp() }))
    await assertFails(updateDoc(poll('alice'), { status: 'open', winner: null, closedAt: null }))
    await assertFails(updateDoc(poll('alice'), { winner: 'pates' }))
  })

  it('un non-membre ne clôt pas, personne ne supprime', async () => {
    await assertFails(updateDoc(poll('eve'), { status: 'closed', winner: 'poulet', closedAt: serverTimestamp() }))
    await assertFails(deleteDoc(poll('alice')))
  })
})

// ---------- Votes ----------

describe('votes', () => {
  beforeEach(() => seedPoll())
  const ballot = (recipeId: string, o: Record<string, unknown> = {}) => ({ recipeId, updatedAt: serverTimestamp(), ...o })

  it('on vote pour soi, et on peut changer d’avis', async () => {
    await assertSucceeds(setDoc(vote('alice', 'm-alice'), ballot('pates')))
    await assertSucceeds(setDoc(vote('alice', 'm-alice'), ballot('poulet')))
  })

  it('on ne vote pas pour un autre membre', async () => {
    await assertFails(setDoc(vote('alice', 'm-bob'), ballot('pates')))
  })

  it('on ne vote pas pour un plat hors options', async () => {
    await assertFails(setDoc(vote('alice', 'm-alice'), ballot('tarte')))
  })

  it('on ne vote plus après la clôture', async () => {
    await assertSucceeds(updateDoc(poll('bob'), { status: 'closed', winner: 'poulet', closedAt: serverTimestamp() }))
    await assertFails(setDoc(vote('alice', 'm-alice'), ballot('pates')))
  })

  it('pas de champ en plus, updatedAt à l’heure du serveur', async () => {
    await assertFails(setDoc(vote('alice', 'm-alice'), ballot('pates', { note: 'x' })))
    await assertFails(setDoc(vote('alice', 'm-alice'), ballot('pates', { updatedAt: new Date() })))
  })

  it('les membres lisent les votes, pas les autres ; personne ne supprime un vote', async () => {
    await assertSucceeds(setDoc(vote('alice', 'm-alice'), ballot('pates')))
    await assertSucceeds(getDocs(collection(as(env, 'bob'), 'households', HID, 'polls', DATE, 'votes')))
    await assertFails(getDocs(collection(as(env, 'eve'), 'households', HID, 'polls', DATE, 'votes')))
    await assertFails(deleteDoc(vote('alice', 'm-alice')))
  })

  it('un non-membre ne vote pas', async () => {
    await assertFails(setDoc(vote('eve', 'm-eve'), ballot('pates')))
  })
})

// ---------- Transactions de l'app (src/lib/poll-ops.ts), sous les vraies règles ----------

describe('addOption (transaction « Mettre au vote »)', () => {
  it('crée le vote du jour puis ajoute des options, sans doublon', async () => {
    expect(await addOption(as(env, 'alice'), HID, DATE, 'pates', 'm-alice')).toBe('created')
    expect(await addOption(as(env, 'bob'), HID, DATE, 'poulet', 'm-bob')).toBe('added')
    expect(await addOption(as(env, 'bob'), HID, DATE, 'pates', 'm-bob')).toBe('already')
    const snap = await getDoc(poll('alice'))
    expect(snap.data()?.options).toEqual(['pates', 'poulet'])
  })

  it('refuse une 5e option et un vote clos', async () => {
    for (const r of ['a', 'b', 'c', 'd']) await addOption(as(env, 'alice'), HID, DATE, r, 'm-alice')
    await expect(addOption(as(env, 'alice'), HID, DATE, 'e', 'm-alice')).rejects.toMatchObject({ code: 'full' })
    await closePoll(as(env, 'alice'), HID, DATE, ['m-alice', 'm-bob'])
    const err = await addOption(as(env, 'bob'), HID, DATE, 'f', 'm-bob').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(PollError)
    expect((err as PollError).code).toBe('closed')
  })

  it('deux « Mettre au vote » simultanés sur un vote inexistant : les deux plats sont retenus (répété 5 fois)', async () => {
    for (let round = 0; round < 5; round++) {
      await env.clearFirestore()
      await seedHousehold(env)
      await Promise.all([
        addOption(as(env, 'alice'), HID, DATE, 'pates', 'm-alice'),
        addOption(as(env, 'bob'), HID, DATE, 'poulet', 'm-bob'),
      ])
      const snap = await getDoc(poll('alice'))
      expect([...snap.data()!.options].sort()).toEqual(['pates', 'poulet'])
    }
  })
})

describe('closePoll (transaction de clôture)', () => {
  beforeEach(() => seedPoll({ options: ['pates', 'poulet'] }))

  it('compte les votes : la majorité gagne', async () => {
    await castVote(as(env, 'alice'), HID, DATE, 'm-alice', 'poulet')
    await castVote(as(env, 'bob'), HID, DATE, 'm-bob', 'poulet')
    expect(await closePoll(as(env, 'alice'), HID, DATE, ['m-alice', 'm-bob'], () => 0)).toBe('poulet')
    const snap = await getDoc(poll('bob'))
    expect(snap.data()).toMatchObject({ status: 'closed', winner: 'poulet' })
  })

  it('égalité : tirage au sort (hasard injecté)', async () => {
    await castVote(as(env, 'alice'), HID, DATE, 'm-alice', 'pates')
    await castVote(as(env, 'bob'), HID, DATE, 'm-bob', 'poulet')
    expect(await closePoll(as(env, 'alice'), HID, DATE, ['m-alice', 'm-bob'], () => 0.99)).toBe('poulet')
  })

  it('deux clôtures simultanées : un seul gagnant, le même pour les deux (répété 5 fois)', async () => {
    for (let round = 0; round < 5; round++) {
      await env.clearFirestore()
      await seedHousehold(env)
      await seedPoll({ options: ['pates', 'poulet'] })
      await castVote(as(env, 'alice'), HID, DATE, 'm-alice', 'pates')
      await castVote(as(env, 'bob'), HID, DATE, 'm-bob', 'poulet')
      // Égalité, et un tirage opposé de chaque côté : si les deux écritures passaient,
      // les gagnants divergeraient.
      const [a, b] = await Promise.all([
        closePoll(as(env, 'alice'), HID, DATE, ['m-alice', 'm-bob'], () => 0),
        closePoll(as(env, 'bob'), HID, DATE, ['m-alice', 'm-bob'], () => 0.99),
      ])
      const stored = (await getDoc(poll('alice'))).data()!.winner
      expect(a).toBe(stored)
      expect(b).toBe(stored)
    }
  })

  it('clôturer un vote déjà clos renvoie le gagnant existant sans rien réécrire', async () => {
    await closePoll(as(env, 'alice'), HID, DATE, ['m-alice', 'm-bob'], () => 0)
    expect(await closePoll(as(env, 'bob'), HID, DATE, ['m-alice', 'm-bob'], () => 0.99)).toBe('pates')
  })
})
