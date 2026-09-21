import { useState, type ReactNode } from 'react'
import { useAuth } from './hooks/useAuth'
import { useHousehold } from './hooks/useHousehold'
import { Onboarding } from './screens/Onboarding'
import { WhoAreYou } from './screens/WhoAreYou'
import { AppShell } from './screens/AppShell'

// On lit /join/CODE une seule fois au démarrage, puis on nettoie l'URL
// pour qu'un refresh ne relance pas le join.
function readJoinCode() {
  const match = location.pathname.match(/^\/join\/([A-Z0-9]{6})$/i)
  if (match) history.replaceState(null, '', '/')
  return match ? match[1].toUpperCase() : null
}

export default function App() {
  const [joinCode] = useState(readJoinCode)
  const { user, error } = useAuth()
  const state = useHousehold(user?.uid)

  if (error) return <FullScreen>Connexion impossible. Vérifie ton réseau puis recharge la page.</FullScreen>
  if (!user || state.status === 'loading') return <FullScreen>Chargement…</FullScreen>

  switch (state.status) {
    case 'none':
      return <Onboarding uid={user.uid} initialCode={joinCode} />
    case 'unclaimed':
      return <WhoAreYou uid={user.uid} household={state.household} members={state.members} />
    case 'ready':
      return <AppShell household={state.household} members={state.members} me={state.me} />
  }
}

function FullScreen({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh grid place-items-center px-6 text-center text-muted">{children}</div>
}
