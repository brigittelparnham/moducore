import { useEffect, useState } from 'react'
import { useMaps } from '../context'
import { createMapsApi } from '../api'
import { JourneyCard } from './JourneyCard'
import type { Journey } from '../types'

const S = { ink: '#221a16', inkSoft: '#3b302a' }
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

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

  const grouped = groupByDate(journeys)

  return (
    <div>
      {isLoading ? (
        <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.5 }}>loading journeys…</p>
      ) : journeys.length === 0 ? (
        <p style={{ fontFamily: hand, fontSize: 20, color: S.inkSoft, opacity: 0.6 }}>
          no journeys detected yet. make sure OwnTracks is configured and sending pings.
        </p>
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
            <button onClick={loadMore} style={loadMoreBtn}>load more ↓</button>
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
    if (d.toDateString() === today.toDateString()) label = 'today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'yesterday'
    else label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

    groups[label] = groups[label] ?? []
    groups[label].push(j)
  }
  return groups
}

const dateHeader: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#3b302a',
  opacity: 0.55,
  marginBottom: 8,
}
const loadMoreBtn: React.CSSProperties = {
  padding: '9px 20px',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  border: `1.5px solid rgba(34,26,22,0.2)`,
  borderRadius: 999,
  background: 'transparent',
  color: '#221a16',
  cursor: 'pointer',
  display: 'block',
  margin: '0 auto',
}
