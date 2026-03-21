import { useEffect, useState } from 'react'
import { useMaps } from '../context'
import { createMapsApi } from '../api'
import type { Journey, KnownPlace } from '../types'
import { JourneyCard } from './JourneyCard'
import { SuggestPanel } from './SuggestPanel'
import { CommuteStats } from './CommuteStats'
import { JourneyList } from './JourneyList'

type Tab = 'today' | 'history' | 'stats'

export function MapsDashboardPage() {
  const { apiBase } = useMaps()
  const api = createMapsApi(apiBase)

  const [tab, setTab] = useState<Tab>('today')
  const [todayJourneys, setTodayJourneys] = useState<Journey[]>([])
  const [places, setPlaces] = useState<KnownPlace[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Approximate current location — in a real app you'd use navigator.geolocation
  // For now, default to central London; the user's actual device position is
  // used by OwnTracks for pings, not required here for suggestions.
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
    <div style={pageStyle}>
      <div style={header}>
        <h1 style={title}>Travel</h1>
        <nav style={tabBar}>
          {(['today', 'history', 'stats'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={tabBtn(tab === t)}
            >
              {tabLabel(t)}
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
    <div>
      <section style={section}>
        <SuggestPanel fromLat={fromLat} fromLon={fromLon} places={places} />
      </section>

      <section style={section}>
        <h3 style={sectionTitle}>Today's Journeys</h3>
        {isLoading ? (
          <p style={muted}>Loading…</p>
        ) : journeys.length === 0 ? (
          <p style={muted}>No journeys detected today yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {journeys.map((j) => (
              <JourneyCard key={j.id} journey={j} showMap />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function tabLabel(t: Tab) {
  if (t === 'today') return 'Today'
  if (t === 'history') return 'History'
  return 'Stats'
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f9fafb',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}
const header: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #e5e7eb',
  padding: '0 24px',
}
const title: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  margin: '20px 0 12px',
}
const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: 2,
}
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid #1a1a1a' : '2px solid transparent',
  fontWeight: active ? 700 : 400,
  fontSize: 14,
  cursor: 'pointer',
  color: active ? '#1a1a1a' : '#888',
  marginBottom: -1,
})
const content: React.CSSProperties = {
  maxWidth: 700,
  margin: '0 auto',
  padding: '24px 16px',
}
const section: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  padding: '16px 18px',
  marginBottom: 16,
  border: '1px solid #e5e7eb',
}
const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 12,
  marginTop: 0,
}
const muted: React.CSSProperties = { color: '#888', fontSize: 14, margin: 0 }
