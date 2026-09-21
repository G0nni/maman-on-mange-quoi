// Outils communs aux tests des Security Rules (émulateur Firestore, projet fictif demo-mmq).
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'

export const PROJECT_ID = 'demo-mmq'
export const HID = 'foyer'
export const CODE = 'ABC234'
/** alice et bob sont membres du foyer (membres m-alice, m-bob), eve n'en fait pas partie. */
export const MEMBERS = ['alice', 'bob'] as const

export function setupEnv() {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
}

// Les contextes renvoient une instance « compat », acceptée par les fonctions modulaires.
export const as = (env: RulesTestEnvironment, uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore
export const anonymous = (env: RulesTestEnvironment) => env.unauthenticatedContext().firestore() as unknown as Firestore

/** Écrit sans règles (données de départ). */
export function seed(env: RulesTestEnvironment, write: (db: Firestore) => Promise<unknown>) {
  return env.withSecurityRulesDisabled((ctx) => write(ctx.firestore() as unknown as Firestore).then(() => {}))
}

export function seedHousehold(env: RulesTestEnvironment) {
  return seed(env, async (db) => {
    await setDoc(doc(db, 'households', HID), { name: 'Famille', joinCode: CODE, memberUids: [...MEMBERS], createdAt: serverTimestamp() })
    await setDoc(doc(db, 'joinCodes', CODE), { householdId: HID })
    for (const uid of MEMBERS) {
      await setDoc(doc(db, 'households', HID, 'members', `m-${uid}`), { name: uid, emoji: '🙂', color: '#2F6B4F', uid })
    }
  })
}
