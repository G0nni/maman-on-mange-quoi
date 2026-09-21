import { useState } from 'react'
import { TabBar, type Tab } from '../components/TabBar'
import { useRecentPolls, useVotes } from '../hooks/usePolls'
import { parisDate, shiftDate } from '../lib/dates'
import type { Household, Member } from '../types'
import { IdeasScreen } from './IdeasScreen'
import { StockScreen } from './StockScreen'
import { VoteScreen } from './VoteScreen'

type Props = { household: Household; members: Member[]; me: Member }

const TITLES: Record<Tab, { title: string; sub: string }> = {
  stock: { title: 'Ce qu’on a', sub: 'Frigo, placard et congélo' },
  ideas: { title: 'Idées de recettes', sub: 'Des repas équilibrés avec le stock' },
  vote: { title: 'Le vote du soir', sub: 'Chacun choisit depuis son téléphone' },
}

/** Fenêtre d'historique : aujourd'hui et les 6 jours précédents (7 jours). */
export const HISTORY_DAYS = 7

export function AppShell({ household, members, me }: Props) {
  const [tab, setTab] = useState<Tab>('stock')
  const [copied, setCopied] = useState(false)

  // Écoutés ici (et pas dans l'écran Vote) pour la pastille de l'onglet, visible partout.
  // `today` est recalculé à chaque rendu : après minuit, le vote du lendemain prend le relais.
  const today = parisDate()
  const polls = useRecentPolls(household.id, shiftDate(today, -(HISTORY_DAYS - 1)))
  const todayPoll = polls?.find((p) => p.id === today)
  const votes = useVotes(household.id, todayPoll ? today : null)
  const mustVote = todayPoll?.status === 'open' && todayPoll.options.length > 0 && !votes.some((v) => v.memberId === me.id)

  const invite = async () => {
    const url = `${location.origin}/join/${household.joinCode}`
    // Feuille de partage native sur mobile (WhatsApp, SMS...), presse-papier sinon.
    if (navigator.share) {
      await navigator.share({ title: household.name, text: 'Rejoins notre foyer sur On mange quoi', url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="font-body">
      <div className="max-w-lg mx-auto px-4 pb-32">
        <header className="pt-6 pb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted font-medium">
              {me.emoji} {me.name}, {household.name}
            </p>
            <h1 className="font-display font-extrabold text-[2.1rem] leading-[1.02] tracking-tight mt-1">
              Maman,
              <br />
              on mange quoi&nbsp;?
            </h1>
          </div>
          <button onClick={invite} className="shrink-0 mt-1 px-3 py-2 rounded-xl bg-surface border border-line text-sm font-semibold">
            {copied ? 'Lien copié' : 'Inviter'}
          </button>
        </header>

        <div className="mb-5">
          <h2 className="font-display font-bold text-xl">{TITLES[tab].title}</h2>
          <p className="text-sm text-muted">{TITLES[tab].sub}</p>
        </div>

        <main>
          {tab === 'stock' && <StockScreen householdId={household.id} me={me} />}
          {tab === 'ideas' && (
            <IdeasScreen
              householdId={household.id}
              me={me}
              today={today}
              todayPoll={todayPoll}
              onGoStock={() => setTab('stock')}
              onGoVote={() => setTab('vote')}
            />
          )}
          {tab === 'vote' && (
            <VoteScreen
              householdId={household.id}
              members={members}
              me={me}
              today={today}
              poll={todayPoll}
              votes={votes}
              onGoIdeas={() => setTab('ideas')}
            />
          )}
        </main>
      </div>

      <TabBar tab={tab} onChange={setTab} badges={mustVote ? { vote: 'Vote ouvert, tu n’as pas encore voté' } : {}} />
    </div>
  )
}
