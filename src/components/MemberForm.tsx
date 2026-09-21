import { useState, type ReactNode } from 'react'
import type { NewMember } from '../lib/household'

const EMOJIS = ['👩', '👨', '👧', '👦', '👵', '👴', '🧑', '🐱']
const COLORS = ['#D8452B', '#2F6B4F', '#8A5CF6', '#E08A00', '#2B7BD8']

type Props = {
  submitLabel: string
  onSubmit: (member: NewMember) => Promise<void>
  // Champ en plus au-dessus (ex : nom du foyer à la création)
  children?: ReactNode
  canSubmit?: boolean
}

export function MemberForm({ submitLabel, onSubmit, children, canSubmit = true }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [color, setColor] = useState(COLORS[0])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim() || !canSubmit) return
    setPending(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), emoji, color })
    } catch {
      setError('Enregistrement impossible. Vérifie ta connexion et réessaie.')
      setPending(false)
    }
  }

  return (
    <div className="space-y-5">
      {children}

      <label className="block">
        <span className="block font-display font-bold mb-2">Ton prénom</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Maman, Léa…"
          className="w-full bg-surface-2 rounded-2xl px-4 py-3 outline-none placeholder:text-muted"
        />
      </label>

      <fieldset>
        <legend className="font-display font-bold mb-2">Ton avatar</legend>
        <div className="grid grid-cols-8 gap-1.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              aria-pressed={emoji === e}
              className={`aspect-square rounded-xl text-2xl grid place-items-center transition ${
                emoji === e ? 'bg-surface ring-2 ring-ink' : 'bg-surface-2'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Couleur ${c}`}
              aria-pressed={color === c}
              className={`w-9 h-9 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-ink ring-offset-bg' : ''}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-tomato">{error}</p>}

      <button
        onClick={submit}
        disabled={pending || !name.trim() || !canSubmit}
        className="w-full py-4 rounded-2xl bg-ink text-bg font-display font-bold text-lg disabled:opacity-40 active:scale-[.98] transition"
      >
        {pending ? 'Un instant…' : submitLabel}
      </button>
    </div>
  )
}
