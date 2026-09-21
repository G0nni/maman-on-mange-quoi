import { useEffect, useId } from 'react'
import type { Recipe } from '../data/recipe-schema'
import { formatQty } from '../lib/format'
import type { IngredientState } from '../lib/suggest'
import { BalanceTags } from './RecipeCard'

const STATE_CHIP: Record<IngredientState, { label: string; className: string }> = {
  'en-stock': { label: 'En stock', className: 'bg-herb-soft text-herb' },
  basique: { label: 'Basique', className: 'bg-surface-2 text-muted' },
  facultatif: { label: 'Facultatif', className: 'border border-line text-muted' },
  manquant: { label: 'Manquant', className: 'bg-tomato-soft text-tomato' },
}

type Props = {
  recipe: Recipe
  /** Libellé et statut de chaque ingrédient, dans l'ordre de la recette. */
  ingredients: { label: string; state: IngredientState }[]
  onHide: () => void
  onClose: () => void
}

/** Fiche détaillée en panneau par-dessus l'écran. Fermeture : bouton, fond ou Échap. */
export function RecipeSheet({ recipe, ingredients, onHide, onClose }: Props) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" />
      <div
        className="absolute inset-x-0 bottom-0 max-w-lg mx-auto max-h-[92dvh] overflow-y-auto bg-bg rounded-t-3xl px-5 pt-5 motion-safe:animate-pop"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-start gap-3">
          <span className="text-5xl" aria-hidden="true">{recipe.emoji}</span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display font-extrabold text-2xl leading-tight">{recipe.name}</h2>
            <p className="text-sm text-muted mt-1">
              {recipe.time} min · {recipe.servings} personnes
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="w-10 h-10 shrink-0 grid place-items-center rounded-xl text-muted hover:bg-surface-2">
            ✕
          </button>
        </div>

        <div className="mt-3">
          <BalanceTags balance={recipe.balance} />
        </div>

        <h3 className="font-display font-bold text-lg mt-6 mb-2">Ingrédients</h3>
        <ul className="divide-y divide-line bg-surface border border-line rounded-2xl">
          {recipe.ingredients.map((ing, i) => {
            const { label, state } = ingredients[i]
            const chip = STATE_CHIP[state]
            return (
              <li key={ing.ref} className="flex items-center gap-2 px-3 py-2.5">
                <span className="flex-1 min-w-0">
                  <span className="font-medium">{label}</span>
                  {ing.qty !== undefined && <span className="text-muted text-sm"> · {formatQty(ing.qty, ing.unit)}</span>}
                </span>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${chip.className}`}>{chip.label}</span>
              </li>
            )
          })}
        </ul>

        <h3 className="font-display font-bold text-lg mt-6 mb-2">Étapes</h3>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-7 h-7 shrink-0 rounded-full bg-mustard text-mustard-ink grid place-items-center text-sm font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex gap-2">
          <button onClick={onHide} className="flex-1 py-3 rounded-2xl border-2 border-line font-semibold text-muted">
            On n'aime pas
          </button>
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-ink text-bg font-semibold">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
