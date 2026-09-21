/** Message éphémère au-dessus de la barre d'onglets (état géré par useToast). */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 z-50 motion-safe:animate-pop px-4 py-2.5 rounded-2xl bg-ink text-bg text-sm font-semibold shadow-lg"
      style={{ bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}
    >
      {message}
    </div>
  )
}
