import { useEffect, useState } from 'react'
import { useMaps } from '../context'
import { createMapsApi } from '../api'
import type { Journey, KnownPlace } from '../types'
import { JourneyCard } from './JourneyCard'
import { SuggestPanel } from './SuggestPanel'
import { CommuteStats } from './CommuteStats'
import { JourneyList } from './JourneyList'

type Tab = 'today' | 'history' | 'stats'

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
  sky: '#9aa8ff',
  rose: '#ff9bb8',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

const TABS: Tab[] = ['today', 'history', 'stats']
const TAB_LABELS: Record<Tab, string> = { today: 'today', history: 'history', stats: 'stats' }

export function MapsDashboardPage() {
  const { apiBase } = useMaps()
  const api = createMapsApi(apiBase)

  const [tab, setTab] = useState<Tab>('today')
  const [todayJourneys, setTodayJourneys] = useState<Journey[]>([])
  const [places, setPlaces] = useState<KnownPlace[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [fromLat] = useState(51.5074)
  const [fromLon] = useState(-0.1278)

  useEffect(() => {
    Promise.all([
      api.journeys.today(),
      api.places.list(),
    ])
      .then(([{ journeys }, { places: p }]) => {
        setTodayJourneys(journeys)
        setPlaces(p)
      })
      .catch(() => { /* ignore */ })
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  return (
    <div style={page}>
      <div style={dotGrid} />

      <div style={header}>
        <div style={{ padding: '0 20px', paddingTop: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.55, textTransform: 'uppercase' as const }}>
            travel
          </div>
          <h1 style={{ fontFamily: body, fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', margin: '2px 0 0', color: S.ink, lineHeight: 1 }}>
            know your{' '}
            <span style={{ fontFamily: hand, color: S.sky, fontSize: 40 }}>city.</span>
          </h1>
        </div>
        <nav style={tabBar}>
          {TABS.map((t) => (
            <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>
      </div>

      <div style={content}>
        {tab === 'today' && (
          <TodayTab
            journeys={todayJourneys}
            places={places}
            fromLat={fromLat}
            fromLon={fromLon}
            isLoading={isLoading}
          />
        )}
        {tab === 'history' && <JourneyList />}
        {tab === 'stats' && <CommuteStats />}
      </div>
    </div>
  )
}

type TodayTabProps = {
  journeys: Journey[]
  places: KnownPlace[]
  fromLat: number
  fromLon: number
  isLoading: boolean
}

function TodayTab({ journeys, places, fromLat, fromLon, isLoading }: TodayTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={paperCard}>
        <SuggestPanel fromLat={fromLat} fromLon={fromLon} places={places} />
      </div>

      <div style={paperCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontFamily: hand, fontSize: 28, color: S.ink }}>today's journeys ↘</div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', opacity: 0.55 }}>
            {journeys.length} detected
          </div>
        </div>
        {isLoading ? (
          <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.5, margin: 0 }}>loading…</p>
        ) : journeys.length === 0 ? (
          <p style={{ fontFamily: hand, fontSize: 20, color: S.inkSoft, opacity: 0.6, margin: 0 }}>
            no journeys detected today yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {journeys.map((j) => (
              <JourneyCard key={j.id} journey={j} showMap />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: S.paper,
  fontFamily: body,
  position: 'relative',
}
const dotGrid: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: `radial-gradient(${S.inkSoft}22 1px, transparent 1px)`,
  backgroundSize: '18px 18px',
  opacity: 0.35,
  zIndex: 0,
}
const header: React.CSSProperties = {
  background: S.paperD,
  borderBottom: `1.5px solid rgba(34,26,22,0.12)`,
  position: 'relative',
  zIndex: 1,
}
const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: 2,
  padding: '0 12px',
  marginTop: 10,
}
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  background: 'none',
  border: 'none',
  borderBottom: active ? `2.5px solid ${S.ink}` : '2.5px solid transparent',
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: active ? S.ink : S.inkSoft,
  opacity: active ? 1 : 0.5,
  marginBottom: -1.5,
})
const content: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 16px',
  position: 'relative',
  zIndex: 1,
}
const paperCard: React.CSSProperties = {
  background: '#fffdf8',
  border: `1.5px solid rgba(34,26,22,0.1)`,
  borderRadius: 3,
  padding: '18px 20px',
  boxShadow: '2px 3px 0 rgba(34,26,22,0.06)',
}
