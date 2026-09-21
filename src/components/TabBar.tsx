export type Tab = 'stock' | 'ideas' | 'vote'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'stock', label: 'Stock', icon: '🧺' },
  { id: 'ideas', label: 'Idées', icon: '💡' },
  { id: 'vote', label: 'Vote du soir', icon: '🗳️' },
]

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-lg mx-auto grid grid-cols-3 px-2 py-2">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-col items-center gap-0.5 py-1.5"
            >
              <span className={`text-2xl transition ${active ? 'scale-110' : 'grayscale opacity-60'}`} aria-hidden="true">
                {t.icon}
              </span>
              <span className={`text-xs font-semibold ${active ? 'text-ink' : 'text-muted'}`}>{t.label}</span>
              {active && <span className="absolute -top-2 w-8 h-1 rounded-full bg-mustard" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
