import { arrayRemove, arrayUnion, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

/** households/{hid}/prefs/recipes : { hidden: recipeId[] }, partagé par tout le foyer. */
export const hiddenRecipesRef = (householdId: string) => doc(db, 'households', householdId, 'prefs', 'recipes')

// merge + arrayUnion/arrayRemove : crée le doc au premier usage, sans écraser les ajouts
// d'un autre téléphone. Pas d'await côté UI : le cache local suffit, même hors ligne.
export function hideRecipe(householdId: string, recipeId: string) {
  return setDoc(hiddenRecipesRef(householdId), { hidden: arrayUnion(recipeId) }, { merge: true })
}

export function unhideRecipe(householdId: string, recipeId: string) {
  return setDoc(hiddenRecipesRef(householdId), { hidden: arrayRemove(recipeId) }, { merge: true })
}
