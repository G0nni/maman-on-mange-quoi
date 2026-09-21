import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

// En dev uniquement, VITE_USE_EMULATOR=true branche l'app sur l'émulateur (npm run emulators),
// avec le projet fictif demo-mmq : aucune requête ne peut partir vers le vrai projet.
const useEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
const app = initializeApp(useEmulator ? { ...config, projectId: 'demo-mmq', apiKey: config.apiKey || 'demo' } : config)

export const auth = getAuth(app)

// Cache IndexedDB : l'app s'affiche instantanément avec les dernières données connues,
// fonctionne hors ligne, et les onSnapshot ne refacturent pas les docs déjà en cache.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
