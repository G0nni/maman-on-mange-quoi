import { useMemo, useState } from 'react'
import { RecipeCard } from '../components/RecipeCard'
import { RecipeSheet } from '../components/RecipeSheet'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useCatalog } from '../hooks/useCatalog'
import { useHiddenRecipes } from '../hooks/useHiddenRecipes'
import { useStock } from '../hooks/useStock'
import { hideRecipe, unhideRecipe } from '../lib/prefs'
import { createIndex } from '../lib/referential'
import { WEEKDAY_MAX_MINUTES, currentSaison, ingredientState, isWeekday, missingRefs, suggest } from '../lib/suggest'
import type { Recipe } from '../data/recipe-schema'

type Props = { householdId: string; onGoStock: () => void }

export function IdeasScreen({ householdId, onGoStock }: Props) {
  const stock = useStock(householdId)
  const hidden = useHiddenRecipes(householdId)
  const { catalog, error } = useCatalog()
  const [modeLong, setModeLong] = useState(false)
  // Déjà proposées pendant la session (l'écran reste monté tant qu'on ne change pas d'onglet).
  const [seen, setSeen] = useState<string[]>([])
  const [shownIds, setShownIds] = useState<string[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [toast, setToast] = useToast()

  const index = useMemo(() => (catalog ? createIndex(catalog.REFERENTIAL) : null), [catalog])
  const recipeById = useMemo(() => new Map(catalog?.RECIPES.map((r) => [r.id, r])), [catalog])
  const stockIds = stock.status === 'ready' ? stock.items.map((s) => s.id) : []
  // Recalculé à chaque rendu (quelques dizaines d'ids) : si le stock change pendant qu'on
  // regarde les idées, les bandeaux « Il manque » et la fiche suivent.
  const have = index?.resolveStock(stockIds) ?? new Set<string>()

  if (error) return <p className="text-tomato py-10 text-center">Impossible de charger les recettes. Vérifie ta connexion.</p>
  if (!catalog || !index || stock.status === 'loading' || hidden === null)
    return <p className="text-muted py-10 text-center">Chargement des recettes…</p>
  if (stock.status === 'error') return <p className="text-tomato py-10 text-center">Impossible de charger le stock.</p>

  const now = new Date()
  const weekday = now.getDay()
  const hiddenSet = new Set(hidden)

  const propose = () => {
    const options = { weekday, saison: currentSaison(now), modeLong, hidden }
    let result = suggest(stockIds, catalog.RECIPES, catalog.REFERENTIAL, { ...options, seen })
    let alreadySeen = seen
    if (result.length === 0 && seen.length > 0) {
      // Tout ce qui était faisable a déjà été proposé : on repart de zéro.
      result = suggest(stockIds, catalog.RECIPES, catalog.REFERENTIAL, options)
      alreadySeen = []
    }
    const ids = result.map((s) => s.recipe.id)
    setSeen([...alreadySeen, ...ids])
    setShownIds(ids)
  }

  const hide = (recipe: Recipe) => {
    hideRecipe(householdId, recipe.id).catch(() => setToast('Impossible de masquer ce plat'))
    setShownIds((ids) => ids?.filter((id) => id !== recipe.id) ?? null)
    setOpenId(null)
    setToast(`« ${recipe.name} » ne sera plus proposé`)
  }

  const shown = (shownIds ?? []).map((id) => recipeById.get(id)).filter((r): r is Recipe => !!r && !hiddenSet.has(r.id))
  const open = openId ? recipeById.get(openId) : undefined
  const hiddenRecipes = hidden.map((id) => recipeById.get(id)).filter((r): r is Recipe => !!r)

  return (
    <div className="space-y-5">
      <button
        onClick={propose}
        className="w-full rounded-[28px] bg-mustard text-mustard-ink px-6 py-6 text-left active:scale-[.98] transition shadow-[0_6px_0_0_rgba(0,0,0,0.12)]"
      >
        <span className="block text-4xl mb-2" aria-hidden="true">🧑‍🍳</span>
        <span className="block font-display font-extrabold text-2xl leading-tight">
          {shownIds ? '3 autres idées' : 'Proposer 3 recettes'}
        </span>
        <span className="block text-sm font-medium mt-1 opacity-80">
          Avec les {stockIds.length} aliment{stockIds.length > 1 ? 's' : ''} du stock
        </span>
      </button>

      {isWeekday(weekday) && (
        <label className="flex items-center justify-between gap-3 bg-surface border border-line rounded-2xl px-4 py-3 cursor-pointer">
          <span>
            <span className="block font-semibold">On a le temps ce soir</span>
            <span className="block text-sm text-muted">
              {modeLong ? 'Tous les plats, même les longs' : `Plats de ${WEEKDAY_MAX_MINUTES} min maximum`}
            </span>
          </span>
          <input type="checkbox" role="switch" checked={modeLong} onChange={(e) => setModeLong(e.target.checked)} className="sr-only peer" />
          <span
            aria-hidden="true"
            className="relative w-12 h-7 shrink-0 rounded-full bg-surface-2 border border-line transition peer-checked:bg-herb peer-focus-visible:outline-3 peer-focus-visible:outline-mustard after:absolute after:top-0.5 after:left-0.5 after:w-5.5 after:h-5.5 after:rounded-full after:bg-surface after:shadow after:transition peer-checked:after:translate-x-5"
          />
        </label>
      )}

      {shownIds === null && <p className="text-center text-muted py-4">Appuie sur le bouton pour recevoir 3 idées de repas avec ce que tu as.</p>}

      {shownIds !== null && shown.length === 0 && (
        <div className="bg-surface border border-line rounded-3xl p-5 text-center space-y-3">
          <p className="text-4xl" aria-hidden="true">🧺</p>
          <p className="font-display font-bold text-lg">Pas assez d'ingrédients pour un plat</p>
          <p className="text-muted">
            Ajoute ce qu'il y a dans le frigo, le placard et le congélo, même en vrac : les idées viendront toutes seules.
          </p>
          <button onClick={onGoStock} className="px-5 py-3 rounded-2xl bg-ink text-bg font-semibold">
            Compléter le stock
          </button>
        </div>
      )}

      {shown.length > 0 && shown.length < 3 && (
        <p className="text-sm text-muted bg-surface border border-line rounded-2xl p-3">
          Seulement {shown.length} idée{shown.length > 1 ? 's' : ''} avec le stock actuel. Ajoute des aliments pour avoir plus de choix.
        </p>
      )}

      <ul className="space-y-3">
        {shown.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard
              recipe={recipe}
              missingLabels={missingRefs(recipe, have, index).map(index.label)}
              onOpen={() => setOpenId(recipe.id)}
              onHide={() => hide(recipe)}
            />
          </li>
        ))}
      </ul>

      {hiddenRecipes.length > 0 && (
        <details className="bg-surface border border-line rounded-2xl px-4 py-3">
          <summary className="font-semibold cursor-pointer">Plats masqués ({hiddenRecipes.length})</summary>
          <ul className="mt-2 divide-y divide-line">
            {hiddenRecipes.map((r) => (
              <li key={r.id} className="flex items-center gap-2 py-2">
                <span aria-hidden="true">{r.emoji}</span>
                <span className="flex-1 min-w-0">{r.name}</span>
                <button
                  onClick={() => unhideRecipe(householdId, r.id).catch(() => setToast('Impossible de remettre ce plat'))}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-surface-2 text-sm font-semibold"
                >
                  Remettre
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {open && (
        <RecipeSheet
          recipe={open}
          ingredients={open.ingredients.map((ing) => ({ label: index.label(ing.ref), state: ingredientState(ing, have, index) }))}
          onHide={() => hide(open)}
          onClose={() => setOpenId(null)}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}
