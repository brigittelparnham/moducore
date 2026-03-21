import type { Journey } from '../types'
import { MapView } from './MapView'

const MODE_ICON: Record<string, string> = {
  walking: '🚶',
  cycling: '🚲',
  transit: '🚇',
  mixed: '🚇',
  unknown: '📍',
}

function formatDuration(s: number): string {
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

type Props = { journey: Journey; compact?: boolean; showMap?: boolean }

export function JourneyCard({ journey, compact = false, showMap = false }: Props) {
  const icon = MODE_ICON[journey.mode] ?? '📍'
  const from = journey.originName ?? `${journey.originLat.toFixed(3)}, ${journey.originLon.toFixed(3)}`
  const to = journey.destName ?? `${journey.destLat.toFixed(3)}, ${journey.destLon.toFixed(3)}`
  const diff = journey.tflEstimatedS
    ? Math.round((journey.durationS - journey.tflEstimatedS) / 60)
    : null

  return (
    <div style={card}>
      {showMap && (
        <div style={{ marginBottom: 10 }}>
          <MapView
            originLat={journey.originLat}
            originLon={journey.originLon}
            destLat={journey.destLat}
            destLon={journey.destLon}
            height={140}
            borderRadius={6}
          />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {from} → {to}
          </div>
          {!compact && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {formatTime(journey.startedAt)} — {formatTime(journey.endedAt)}
              {' · '}{formatDistance(journey.distanceM)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{formatDuration(journey.durationS)}</div>
          {diff !== null && (
            <div style={{ fontSize: 11, color: diff > 2 ? '#ef4444' : diff < -2 ? '#16a34a' : '#888' }}>
              {diff > 0 ? `+${diff}` : diff} min vs TfL
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '12px 14px',
}
