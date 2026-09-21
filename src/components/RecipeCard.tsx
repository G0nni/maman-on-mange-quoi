import type { Recipe } from '../data/recipe-schema'
import { missingText } from '../lib/format'

const BALANCE_LABEL = { P: 'Protéines', L: 'Légumes', F: 'Féculents' } as const

export function BalanceTags({ balance }: { balance: Recipe['balance'] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(['P', 'L', 'F'] as const).map((b) => {
        const on = balance.includes(b)
        return (
          <span
            key={b}
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              on ? 'bg-herb-soft text-herb border-transparent' : 'text-muted border-line line-through opacity-60'
            }`}
          >
            {BALANCE_LABEL[b]}
          </span>
        )
      })}
    </div>
  )
}

type Props = {
  recipe: Recipe
  missingLabels: string[]
  onOpen: () => void
  onHide: () => void
}

export function RecipeCard({ recipe, missingLabels, onOpen, onHide }: Props) {
  return (
    <article className="motion-safe:animate-pop bg-surface border border-line rounded-3xl p-4">
      <button onClick={onOpen} className="w-full flex gap-3 text-left">
        <span className="w-14 h-14 shrink-0 rounded-2xl bg-surface-2 grid place-items-center text-3xl" aria-hidden="true">
          {recipe.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display font-bold text-lg leading-snug">{recipe.name}</span>
          <span className="block text-sm text-muted mt-0.5">{recipe.time} min</span>
        </span>
      </button>

      <div className="mt-3">
        <BalanceTags balance={recipe.balance} />
      </div>

      {missingLabels.length > 0 && (
        <p className="mt-3 rounded-2xl bg-tomato-soft text-tomato px-3 py-2 text-sm font-semibold">
          {missingText(missingLabels)}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <button onClick={onOpen} className="px-4 py-2 rounded-2xl bg-ink text-bg text-sm font-semibold active:scale-[.98] transition">
          Voir la recette
        </button>
        <button onClick={onHide} className="px-3 py-2 rounded-2xl text-sm font-semibold text-muted hover:text-tomato transition">
          On n'aime pas
        </button>
      </div>
    </article>
  )
}
