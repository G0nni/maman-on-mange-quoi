import { useEffect, useState } from 'react'
import { createHousehold, joinHousehold, resolveJoinCode } from '../lib/household'
import { MemberForm } from '../components/MemberForm'

type Props = { uid: string; initialCode: string | null }

export function Onboarding({ uid, initialCode }: Props) {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>(initialCode ? 'join' : 'choice')
  const [householdName, setHouseholdName] = useState('')
  const [code, setCode] = useState(initialCode ?? '')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const join = async (value = code) => {
    setJoining(true)
    setJoinError(null)
    try {
      const householdId = await resolveJoinCode(value)
      if (!householdId) {
        setJoinError('Ce code ne correspond à aucun foyer. Vérifie les 6 caractères.')
        return
      }
      // Dès que l'uid est ajouté, useHousehold passe en "unclaimed" et App affiche WhoAreYou.
      await joinHousehold(householdId, uid)
    } catch {
      setJoinError('Connexion impossible. Vérifie ton réseau et réessaie.')
    } finally {
      setJoining(false)
    }
  }

  // Arrivée via un lien /join/CODE : on rejoint directement.
  useEffect(() => {
    if (initialCode) join(initialCode)
  }, [initialCode])

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-display font-extrabold text-[2.4rem] leading-[1.02] tracking-tight mb-8">
        Maman,
        <br />
        on mange quoi&nbsp;?
      </h1>

      {mode === 'choice' && (
        <div className="space-y-3">
          <button
            onClick={() => setMode('join')}
            className="w-full text-left rounded-[28px] bg-mustard text-mustard-ink p-6 active:scale-[.98] transition"
          >
            <span className="block font-display font-extrabold text-2xl">J'ai un code</span>
            <span className="block text-sm mt-1 opacity-80">Quelqu'un de la famille t'a invité</span>
          </button>
          <button
            onClick={() => setMode('create')}
            className="w-full text-left rounded-[28px] bg-surface border border-line p-6 active:scale-[.98] transition"
          >
            <span className="block font-display font-bold text-xl">Créer notre foyer</span>
            <span className="block text-sm mt-1 text-muted">Tu inviteras les autres ensuite</span>
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="space-y-4">
          <label className="block">
            <span className="block font-display font-bold mb-2">Code du foyer</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="X7K2QP"
              className="w-full bg-surface-2 rounded-2xl px-4 py-4 text-2xl font-display font-bold tracking-[0.3em] text-center outline-none placeholder:text-muted placeholder:opacity-50"
            />
          </label>
          {joinError && <p className="text-sm text-tomato">{joinError}</p>}
          <button
            onClick={() => join()}
            disabled={code.length !== 6 || joining}
            className="w-full py-4 rounded-2xl bg-ink text-bg font-display font-bold text-lg disabled:opacity-40"
          >
            {joining ? 'Recherche du foyer…' : 'Rejoindre'}
          </button>
          <BackButton onClick={() => setMode('choice')} />
        </div>
      )}

      {mode === 'create' && (
        <>
          <MemberForm
            submitLabel="Créer le foyer"
            canSubmit={!!householdName.trim()}
            onSubmit={async (member) => {
              await createHousehold(uid, householdName.trim(), member)
            }}
          >
            <label className="block">
              <span className="block font-display font-bold mb-2">Nom du foyer</span>
              <input
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ex : La famille Cros"
                className="w-full bg-surface-2 rounded-2xl px-4 py-3 outline-none placeholder:text-muted"
              />
            </label>
          </MemberForm>
          <div className="mt-3">
            <BackButton onClick={() => setMode('choice')} />
          </div>
        </>
      )}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full py-3 text-sm font-semibold text-muted">
      Retour
    </button>
  )
}
