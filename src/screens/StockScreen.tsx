import { useEffect, useState } from 'react'
import { useStock } from '../hooks/useStock'
import { norm, stockId } from '../lib/ingredients'
import { AlreadyInStockError, ZONES, addStockItem, removeStockItem } from '../lib/stock'
import type { Member, Zone } from '../types'

type Props = { householdId: string; me: Member }

export function StockScreen({ householdId, me }: Props) {
  const stock = useStock(householdId)
  const [name, setName] = useState('')
  const [zone, setZone] = useState<Zone>('frigo')
  const [filter, setFilter] = useState('')
  const [pending, setPending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  if (stock.status === 'loading') return <p className="text-muted py-10 text-center">Chargement du stock…</p>
  if (stock.status === 'error') return <p className="text-tomato py-10 text-center">Impossible de charger le stock. Recharge la page.</p>

  const items = stock.items

  const add = async () => {
    const n = name.trim()
    if (!n || pending) return
    const id = stockId(n)
    if (!id) return setToast('Ce nom ne contient ni lettre ni chiffre')
    // Vérification gratuite et instantanée sur la liste déjà reçue.
    // La transaction de addStockItem couvre le cas où elle n'est pas encore à jour.
    if (items.some((s) => s.id === id)) {
      setName('')
      return setToast('Déjà dans le stock')
    }

    setPending(true)
    try {
      await addStockItem(householdId, n, zone, me.id)
      setName('')
    } catch (err) {
      if (err instanceof AlreadyInStockError) {
        setName('')
        setToast('Déjà dans le stock')
      } else {
        setToast('Ajout impossible. Vérifie ta connexion.')
      }
    } finally {
      setPending(false)
    }
  }

  const remove = (id: string) => {
    removeStockItem(householdId, id).catch(() => setToast('Suppression impossible'))
  }

  const q = norm(filter)
  const visible = q ? items.filter((s) => norm(s.name).includes(q)) : items

  return (
    <div className="space-y-5">
      <div className="bg-surface rounded-3xl p-4 border border-line">
        <label htmlFor="add-item" className="block font-display font-bold text-lg mb-3">
          Ajouter un aliment
        </label>
        <div className="flex gap-2">
          <input
            id="add-item"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Ex : poivrons, jambon…"
            className="flex-1 min-w-0 bg-surface-2 rounded-2xl px-4 py-3 text-base outline-none placeholder:text-muted"
          />
          <button
            onClick={add}
            disabled={!name.trim() || pending}
            className="shrink-0 px-4 rounded-2xl bg-herb text-surface font-semibold disabled:opacity-40 active:scale-95 transition"
          >
            Ajouter
          </button>
        </div>
        <div className="flex gap-2 mt-3" role="radiogroup" aria-label="Rangement">
          {ZONES.map((z) => (
            <button
              key={z.id}
              role="radio"
              aria-checked={zone === z.id}
              onClick={() => setZone(z.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
                zone === z.id ? 'border-ink bg-ink text-bg' : 'border-line text-muted'
              }`}
            >
              {z.icon} {z.label}
            </button>
          ))}
        </div>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={`Chercher dans ${items.length} aliment${items.length > 1 ? 's' : ''}`}
        aria-label="Chercher un aliment"
        className="w-full bg-transparent border-b-2 border-line focus:border-herb px-1 py-2 outline-none placeholder:text-muted"
      />

      {items.length === 0 && (
        <p className="text-center text-muted py-8">
          Le stock est vide. Ajoute ce qu'il y a dans le frigo pour recevoir des idées de recettes.
        </p>
      )}
      {items.length > 0 && visible.length === 0 && (
        <p className="text-center text-muted py-8">Aucun aliment ne correspond à « {filter.trim()} ».</p>
      )}

      {ZONES.map((z) => {
        const inZone = visible.filter((s) => s.zone === z.id)
        if (!inZone.length) return null
        return (
          <section key={z.id}>
            <h3 className="font-display font-bold text-base mb-2 flex items-center gap-2">
              <span aria-hidden="true">{z.icon}</span>
              {z.label}
              <span className="text-muted font-body font-medium text-sm">{inZone.length}</span>
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {inZone.map((s) => (
                <li
                  key={s.id}
                  className="motion-safe:animate-pop flex items-center gap-2 bg-surface border border-line rounded-2xl pl-3 pr-1 py-1.5"
                >
                  <span className="text-xl" aria-hidden="true">{s.emoji}</span>
                  <span className="flex-1 min-w-0 truncate font-medium">{s.name}</span>
                  <button
                    onClick={() => remove(s.id)}
                    aria-label={`Retirer ${s.name}`}
                    className="w-9 h-9 grid place-items-center rounded-xl text-muted hover:bg-tomato-soft hover:text-tomato transition"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 z-50 motion-safe:animate-pop px-4 py-2.5 rounded-2xl bg-ink text-bg text-sm font-semibold shadow-lg"
          style={{ bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
