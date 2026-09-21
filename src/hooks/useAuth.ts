import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'

/**
 * Garantit qu'on a toujours un utilisateur Firebase : si aucune session n'existe
 * sur cet appareil, on en crée une anonyme. La session persiste en IndexedDB.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) setUser(u)
      else signInAnonymously(auth).catch(setError)
    })
  }, [])

  return { user, error }
}
