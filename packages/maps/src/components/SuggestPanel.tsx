import { useState } from 'react'
import { useMaps } from '../context'
import { createMapsApi } from '../api'
import type { SuggestionOption, TflLeg } from '../types'

const S = {
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
  sky: '#9aa8ff',
  paper: '#efe6d4',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

type Props = {
  fromLat: number
  fromLon: number
  places: Array<{ id: string; name: string; lat: number; lon: number }>
}

export function SuggestPanel({ fromLat, fromLon, places }: Props) {
  const { apiBase } = useMaps()
  const api = createMapsApi(apiBase)

  const [toPlace, setToPlace] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const handleSuggest = async () => {
    if (!toPlace) return
    setIsLoading(true)
    setError(null)
    setSuggestions([])
    try {
      const res = await api.suggest(fromLat, fromLon, undefined, undefined, toPlace)
      if ('error' in res) {
        setError(res.error as string)
      } else {
        setSuggestions(res.suggestions)
      }
    } catch {
      setError('Could not fetch suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div style={{ fontFamily: hand, fontSize: 28, color: S.ink, marginBottom: 14 }}>
        journey suggestions ↘
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          value={toPlace}
          onChange={(e) => setToPlace(e.target.value)}
          style={selectStyle}
        >
          <option value="">select destination…</option>
          {places.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={handleSuggest}
          disabled={!toPlace || isLoading}
          style={btnStyle(!toPlace || isLoading)}
        >
          {isLoading ? 'checking…' : 'go →'}
        </button>
      </div>

      {error && (
        <p style={{ fontFamily: body, fontSize: 13, color: S.coral, margin: '0 0 10px' }}>{error}</p>
      )}

      {suggestions.length === 0 && !isLoading && !error && toPlace && (
        <p style={{ fontFamily: hand, fontSize: 18, color: S.inkSoft, opacity: 0.6, margin: 0 }}>
          no suggestions — check your destination is a known place.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {suggestions.map((s, i) => (
          <div key={i} style={suggCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: hand, fontSize: 28, color: S.ink, lineHeight: 1 }}>
                  {formatMin(s.durationEstimateS)}
                </span>
                <span style={confidencePill(s.confidence)}>{confidenceLabel(s.confidence)}</span>
              </div>
              <button style={expandBtn} onClick={() => setExpanded(expanded === i ? null : i)}>
                {expanded === i ? '▲' : '▼'}
              </button>
            </div>

            {s.personalNote && (
              <p style={note}>📊 {s.personalNote}</p>
            )}
            {s.weatherNote && (
              <p style={note}>🌦 {s.weatherNote}</p>
            )}
            {s.disruptions.length > 0 && (
              <p style={{ ...note, color: S.coral }}>⚠️ {s.disruptions.join('; ')}</p>
            )}

            {expanded === i && s.legs.length > 0 && (
              <div style={{ marginTop: 10, borderTop: `1px solid rgba(34,26,22,0.08)`, paddingTop: 10 }}>
                {s.legs.map((leg, li) => (
                  <LegRow key={li} leg={leg} />
                ))}
              </div>
            )}

            <div style={{ marginTop: 6, fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: S.inkSoft, opacity: 0.5 }}>
              TFL ESTIMATE: {formatMin(s.tflDurationS)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LegRow({ leg }: { leg: TflLeg }) {
  const icon = modeIcon(leg.mode)
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: body, fontWeight: 600, fontSize: 13, color: '#221a16' }}>
          {leg.lineName ? `${leg.lineName} — ` : ''}{leg.instruction}
        </div>
        {leg.departureStop && (
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.08em', color: '#3b302a', opacity: 0.6 }}>
            {leg.departureStop} → {leg.arrivalStop} · {leg.durationMinutes} min
          </div>
        )}
      </div>
    </div>
  )
}

function formatMin(seconds: number) {
  const m = Math.round(seconds / 60)
  return `${m} min`
}

function modeIcon(mode: string) {
  if (mode === 'walking') return '🚶'
  if (mode === 'tube' || mode === 'dlr' || mode === 'elizabeth-line') return '🚇'
  if (mode === 'bus') return '🚌'
  if (mode === 'overground' || mode === 'national-rail') return '🚆'
  if (mode === 'cycle') return '🚲'
  return '🗺'
}

function confidenceLabel(c: SuggestionOption['confidence']) {
  if (c === 'strong') return 'personalised'
  if (c === 'early') return 'limited data'
  return 'tfl only'
}

function confidencePill(c: SuggestionOption['confidence']): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 9,
    fontWeight: 600,
    borderRadius: 999,
    padding: '2px 8px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  }
  if (c === 'strong') return { ...base, background: '#7fd1b9', color: '#221a16' }
  if (c === 'early') return { ...base, background: '#ffd86b', color: '#221a16' }
  return { ...base, background: 'rgba(34,26,22,0.1)', color: '#3b302a' }
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: '9px 12px',
  border: `1.5px solid rgba(34,26,22,0.2)`,
  borderRadius: 3,
  fontSize: 14,
  fontFamily: "'Space Grotesk', sans-serif",
  background: '#fffdf8',
  color: '#221a16',
  outline: 'none',
}
const btnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '9px 20px',
  background: disabled ? 'rgba(34,26,22,0.3)' : '#221a16',
  color: '#efe6d4',
  border: 'none',
  borderRadius: 999,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  whiteSpace: 'nowrap',
})
const suggCard: React.CSSProperties = {
  border: `1.5px solid rgba(34,26,22,0.1)`,
  borderRadius: 3,
  padding: '12px 14px',
  background: '#fffdf8',
  boxShadow: '1px 2px 0 rgba(34,26,22,0.05)',
}
const expandBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#3b302a',
  opacity: 0.4,
  fontSize: 12,
  padding: 0,
}
const note: React.CSSProperties = {
  margin: '6px 0 0',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: '#3b302a',
}
