import { useEffect, useMemo, useState } from 'react'
import { RecipeSheet } from '../components/RecipeSheet'
import { Toast } from '../components/Toast'
import { useCatalog } from '../hooks/useCatalog'
import { useStock } from '../hooks/useStock'
import { useToast } from '../hooks/useToast'
import { closeTodayPoll, voteFor } from '../lib/polls'
import { createIndex } from '../lib/referential'
import { ingredientState } from '../lib/suggest'
import { tally } from '../lib/tally'
import type { Recipe } from '../data/recipe-schema'
import type { Member, Poll, Vote } from '../types'

type Props = {
  householdId: string
  members: Member[]
  me: Member
  today: string
  poll: Poll | undefined
  votes: Vote[]
  onGoIdeas: () => void
}

/** Chacun vote depuis son téléphone, en tant que « me ». Temps réel via les props (AppShell). */
export function VoteScreen({ householdId, members, me, today, poll, votes, onGoIdeas }: Props) {
  const { catalog } = useCatalog()
  const stock = useStock(householdId)
  const [confirmClose, setConfirmClose] = useState(false)
  const [closing, setClosing] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [toast, setToast] = useToast()

  // Le bouton de clôture demande une confirmation, annulée au bout de 4 s.
  useEffect(() => {
    if (!confirmClose) return
    const t = setTimeout(() => setConfirmClose(false), 4000)
    return () => clearTimeout(t)
  }, [confirmClose])

  const index = useMemo(() => (catalog ? createIndex(catalog.REFERENTIAL) : null), [catalog])
  const recipeById = useMemo(() => new Map(catalog?.RECIPES.map((r) => [r.id, r])), [catalog])
  const memberById = new Map(members.map((m) => [m.id, m]))

  if (!poll || poll.options.length === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-5xl" aria-hidden="true">🗳️</p>
        <p className="font-display font-bold text-xl">Aucun plat au vote ce soir</p>
        <p className="text-muted max-w-xs mx-auto">Choisis des recettes dans les idées et mets-les au vote : chacun donnera son avis depuis son téléphone.</p>
        <button onClick={onGoIdeas} className="px-6 py-3 rounded-2xl bg-ink text-bg font-semibold">
          Voir les idées
        </button>
      </div>
    )
  }
  if (!catalog || !index) return <p className="text-muted py-10 text-center">Chargement du vote…</p>

  const ballots = Object.fromEntries(votes.map((v) => [v.memberId, v.recipeId]))
  const counts = tally(poll.options, ballots)
  const votedCount = members.filter((m) => ballots[m.id]).length
  const myChoice = ballots[me.id]
  const recipes = poll.options.map((id) => recipeById.get(id)).filter((r): r is Recipe => !!r)
  const open = openId ? recipeById.get(openId) : undefined
  const have = index.resolveStock(stock.status === 'ready' ? stock.items.map((s) => s.id) : [])

  const vote = (recipeId: string) => {
    // Pas d'await : le vote s'affiche tout de suite. Refus des règles si clos entre-temps.
    voteFor(householdId, today, me.id, recipeId).catch(() => setToast('Vote impossible : il est peut-être déjà clos'))
  }

  const close = () => {
    if (!confirmClose) return setConfirmClose(true)
    setConfirmClose(false)
    setClosing(true)
    closeTodayPoll(householdId, today, members.map((m) => m.id))
      .catch(() => setToast('Clôture impossible, vérifie ta connexion'))
      .finally(() => setClosing(false))
  }

  const avatars = (memberIds: string[]) => (
    <span className="flex -space-x-1.5 h-7">
      {memberIds.map((id) => {
        const m = memberById.get(id)
        return m ? (
          <span key={id} title={m.name} className="w-7 h-7 rounded-full grid place-items-center text-sm ring-2 ring-surface" style={{ background: m.color + '33' }}>
            {m.emoji}
          </span>
        ) : null
      })}
    </span>
  )

  // ---------- Vote clos : résultat ----------
  if (poll.status === 'closed' && poll.winner) {
    const winner = recipeById.get(poll.winner)
    const max = Math.max(...[...counts.values()].map((v) => v.length))
    const tie = [...counts.values()].filter((v) => v.length === max).length > 1
    return (
      <div className="space-y-5">
        <div className="motion-safe:animate-pop rounded-[28px] bg-mustard text-mustard-ink p-6 text-center">
          <p className="text-6xl mb-3" aria-hidden="true">{winner?.emoji ?? '🍽️'}</p>
          <p className="font-medium">Ce soir on mange</p>
          <p className="font-display font-extrabold text-3xl leading-tight mt-1">{winner?.name ?? 'un plat mystère'}</p>
          {tie && <p className="text-sm mt-3 opacity-80">Égalité, départagé au tirage au sort.</p>}
          {winner && (
            <button onClick={() => setOpenId(winner.id)} className="mt-4 px-5 py-2.5 rounded-2xl bg-mustard-ink text-mustard font-semibold">
              Voir la recette
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {recipes.map((r) => (
            <li key={r.id} className="flex items-center gap-3 bg-surface border border-line rounded-2xl px-4 py-3">
              <span className="text-2xl" aria-hidden="true">{r.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate">{r.name}</span>
                {avatars(counts.get(r.id) ?? [])}
              </span>
              <span className="font-display font-bold text-xl">{counts.get(r.id)?.length ?? 0}</span>
            </li>
          ))}
        </ul>
        {open && (
          <RecipeSheet
            recipe={open}
            ingredients={open.ingredients.map((ing) => ({ label: index.label(ing.ref), state: ingredientState(ing, have, index) }))}
            onClose={() => setOpenId(null)}
          />
        )}
      </div>
    )
  }

  // ---------- Vote ouvert ----------
  const allVoted = votedCount === members.length
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        {myChoice ? `${me.name}, tu peux changer ton vote.` : `${me.name}, choisis ton plat.`}{' '}
        <span className="font-semibold text-ink">
          {votedCount}/{members.length} {votedCount > 1 ? 'ont' : 'a'} voté
        </span>
      </p>

      <ul className="space-y-3">
        {recipes.map((r) => {
          const voters = counts.get(r.id) ?? []
          const mine = myChoice === r.id
          const pct = members.length ? (voters.length / members.length) * 100 : 0
          return (
            <li key={r.id}>
              <button
                onClick={() => vote(r.id)}
                aria-pressed={mine}
                className={`relative w-full overflow-hidden text-left rounded-3xl border-2 p-4 bg-surface transition active:scale-[.99] ${mine ? '' : 'border-line'}`}
                style={mine ? { borderColor: me.color } : undefined}
              >
                <span className="absolute inset-y-0 left-0 bg-herb-soft transition-all duration-500" style={{ width: `${pct}%` }} aria-hidden="true" />
                <span className="relative flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">{r.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display font-bold leading-snug">{r.name}</span>
                    <span className="block mt-1.5">{avatars(voters)}</span>
                  </span>
                  <span className="font-display font-extrabold text-2xl">{voters.length}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <button onClick={onGoIdeas} className="w-full py-3 rounded-2xl border-2 border-line font-semibold text-muted">
        Ajouter un plat au vote
      </button>

      <button
        onClick={close}
        disabled={closing}
        className="w-full py-4 rounded-2xl bg-tomato text-surface font-display font-bold text-lg disabled:opacity-40 active:scale-[.98] transition"
      >
        {closing
          ? 'Clôture…'
          : confirmClose
            ? 'Appuie encore pour clôturer'
            : allVoted
              ? 'Tout le monde a voté, voir le résultat'
              : 'Clôturer le vote'}
      </button>

      <Toast message={toast} />
    </div>
  )
}
