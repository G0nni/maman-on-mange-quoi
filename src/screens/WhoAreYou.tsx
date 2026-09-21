import { useState } from 'react'
import { addMember, claimMember } from '../lib/household'
import { MemberForm } from '../components/MemberForm'
import type { Household, Member } from '../types'

type Props = { uid: string; household: Household; members: Member[] }

/**
 * Affiché quand l'appareil est dans le foyer mais pas encore associé à une personne.
 * Sert au premier join ET à la récupération (nouvelle session sur iOS, changement de téléphone).
 */
export function WhoAreYou({ uid, household, members }: Props) {
  const [creating, setCreating] = useState(members.length === 0)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <p className="text-muted font-medium">{household.name}</p>
      <h1 className="font-display font-extrabold text-3xl leading-tight mt-1 mb-6">
        {creating ? 'Présente-toi' : 'Qui es-tu ?'}
      </h1>

      {creating ? (
        <MemberForm
          submitLabel="Rejoindre le foyer"
          onSubmit={(member) => addMember(household.id, uid, member)}
        />
      ) : (
        <div className="space-y-3">
          <ul className="grid grid-cols-2 gap-2">
            {members.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => claimMember(household.id, m.id, uid)}
                  className="w-full flex flex-col items-center gap-2 py-4 rounded-3xl bg-surface border-2 border-line active:scale-[.97] transition"
                >
                  <span
                    className="w-14 h-14 rounded-full grid place-items-center text-3xl"
                    style={{ background: m.color + '22' }}
                  >
                    {m.emoji}
                  </span>
                  <span className="font-display font-bold">{m.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setCreating(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-line font-semibold text-muted"
          >
            Je ne suis pas dans la liste
          </button>
        </div>
      )}
    </div>
  )
}
