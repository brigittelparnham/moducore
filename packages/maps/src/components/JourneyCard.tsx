import type { Journey } from '../types'
import { MapView } from './MapView'

const S = {
  paper: '#efe6d4',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  sky: '#9aa8ff',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

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
            borderRadius={2}
          />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: hand, fontSize: 20, color: S.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {from} → {to}
          </div>
          {!compact && (
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.12em', color: S.inkSoft, opacity: 0.6, marginTop: 2 }}>
              {formatTime(journey.startedAt)} — {formatTime(journey.endedAt)}
              {' · '}{formatDistance(journey.distanceM)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: hand, fontSize: 26, color: S.ink, lineHeight: 1 }}>{formatDuration(journey.durationS)}</div>
          {diff !== null && (
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: diff > 2 ? S.coral : diff < -2 ? S.mint : S.inkSoft, opacity: 0.8 }}>
              {diff > 0 ? `+${diff}` : diff} vs TfL
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fffdf8',
  border: `1.5px solid rgba(34,26,22,0.1)`,
  borderRadius: 3,
  padding: '12px 14px',
  boxShadow: '1px 2px 0 rgba(34,26,22,0.05)',
}
