import { useEffect, useState } from 'react'
import { useMaps } from '../context'
import { createMapsApi } from '../api'
import { JourneyCard } from './JourneyCard'
import type { Journey } from '../types'

export function JourneyList() {
  const { apiBase } = useMaps()
  const api = createMapsApi(apiBase)

  const [journeys, setJourneys] = useState<Journey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const LIMIT = 20

  useEffect(() => {
    setIsLoading(true)
    api.journeys.list(LIMIT, 0)
      .then(({ journeys: j }) => {
        setJourneys(j)
        setHasMore(j.length === LIMIT)
        setOffset(LIMIT)
      })
      .catch(() => setJourneys([]))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  const loadMore = () => {
    api.journeys.list(LIMIT, offset).then(({ journeys: more }) => {
      setJourneys((prev) => [...prev, ...more])
      setHasMore(more.length === LIMIT)
      setOffset((o) => o + LIMIT)
    })
  }

  // Group by date
  const grouped = groupByDate(journeys)

  return (
    <div>
      {isLoading ? (
        <p style={muted}>Loading journeys…</p>
      ) : journeys.length === 0 ? (
        <p style={muted}>No journeys detected yet. Make sure OwnTracks is configured and sending pings.</p>
      ) : (
        <>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={dateHeader}>{date}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((j) => <JourneyCard key={j.id} journey={j} />)}
              </div>
            </div>
          ))}
          {hasMore && (
            <button onClick={loadMore} style={loadMoreBtn}>Load more</button>
          )}
        </>
      )}
    </div>
  )
}

function groupByDate(journeys: Journey[]): Record<string, Journey[]> {
  const groups: Record<string, Journey[]> = {}
  for (const j of journeys) {
    const d = new Date(j.startedAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

    groups[label] = groups[label] ?? []
    groups[label].push(j)
  }
  return groups
}

const muted: React.CSSProperties = { color: '#888', fontSize: 14 }
const dateHeader: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#aaa',
  marginBottom: 8,
}
const loadMoreBtn: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  display: 'block',
  margin: '0 auto',
}
