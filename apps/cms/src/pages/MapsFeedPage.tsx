import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const DEFAULT_MAPS_URL = import.meta.env.VITE_MAPS_URL ?? 'http://localhost:3004'

type Journey = {
  id: string
  startedAt: string
  endedAt: string
  originName: string | null
  destName: string | null
  distanceM: number
  durationS: number
  mode: string
  tflEstimatedS: number | null
}

function modeIcon(mode: string) {
  if (mode === 'walking') return '🚶'
  if (mode === 'cycling') return '🚲'
  return '🚇'
}

function formatMin(s: number) {
  return `${Math.round(s / 60)} min`
}

function formatDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function MapsFeedPage() {
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const mapsUrl = DEFAULT_MAPS_URL

  useEffect(() => {
    fetch(`${API_URL}/maps/journeys/today`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: { journeys: Journey[] }) => setJourneys(data.journeys))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0 }}>Travel</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
            Today's journeys — full history and suggestions in the{' '}
            <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>
              Travel app ↗
            </a>
          </p>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: '8px 14px',
            background: '#111',
            color: '#fff',
            borderRadius: 4,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Open Travel app →
        </a>
      </div>

      {isLoading && <p style={{ color: '#666' }}>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && journeys.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
          <p>No journeys detected today yet.</p>
          <p style={{ fontSize: 13 }}>Make sure OwnTracks is configured and sending location pings.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {journeys.map((j) => (
          <JourneyRow key={j.id} journey={j} />
        ))}
      </div>
    </div>
  )
}

function JourneyRow({ journey: j }: { journey: Journey }) {
  const from = j.originName ?? 'Unknown'
  const to = j.destName ?? 'Unknown'
  const diff = j.tflEstimatedS ? j.durationS - j.tflEstimatedS : null

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{modeIcon(j.mode)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {from} → {to}
          </div>
          <div style={{ color: '#888', fontSize: 12 }}>
            {formatTime(j.startedAt)} · {formatMin(j.durationS)} · {formatDist(j.distanceM)}
          </div>
        </div>
        {diff !== null && (
          <div style={{ fontSize: 12, color: diff > 60 ? '#c05621' : '#065f46', fontWeight: 600 }}>
            {diff > 0 ? `+${formatMin(diff)}` : formatMin(diff)} vs TfL
          </div>
        )}
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '12px 14px',
  background: '#fff',
}
