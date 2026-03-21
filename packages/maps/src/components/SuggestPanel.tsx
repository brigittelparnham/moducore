import { useState } from 'react'
import { useMaps } from '../context'
import { createMapsApi } from '../api'
import type { SuggestionOption, TflLeg } from '../types'

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
      <h3 style={sectionTitle}>Journey Suggestions</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          value={toPlace}
          onChange={(e) => setToPlace(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select destination…</option>
          {places.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={handleSuggest}
          disabled={!toPlace || isLoading}
          style={btnStyle}
        >
          {isLoading ? 'Checking…' : 'Get suggestions'}
        </button>
      </div>

      {error && <p style={{ color: '#e53e3e', fontSize: 13 }}>{error}</p>}

      {suggestions.length === 0 && !isLoading && !error && toPlace && (
        <p style={mutedText}>No suggestions found — check that your destination is a known place.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {suggestions.map((s, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={durationBadge}>{formatMin(s.durationEstimateS)}</span>
                <span style={confidencePill(s.confidence)}>{confidenceLabel(s.confidence)}</span>
              </div>
              <button
                style={expandBtn}
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                {expanded === i ? '▲' : '▼'}
              </button>
            </div>

            {s.personalNote && (
              <p style={noteStyle}>📊 {s.personalNote}</p>
            )}
            {s.weatherNote && (
              <p style={noteStyle}>🌦 {s.weatherNote}</p>
            )}
            {s.disruptions.length > 0 && (
              <p style={{ ...noteStyle, color: '#c05621' }}>⚠️ {s.disruptions.join('; ')}</p>
            )}

            {expanded === i && s.legs.length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                {s.legs.map((leg, li) => (
                  <LegRow key={li} leg={leg} />
                ))}
              </div>
            )}

            <div style={{ marginTop: 6, fontSize: 11, color: '#aaa' }}>
              TfL estimate: {formatMin(s.tflDurationS)}
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
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6, fontSize: 13 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600 }}>
          {leg.lineName ? `${leg.lineName} — ` : ''}{leg.instruction}
        </div>
        {leg.departureStop && (
          <div style={{ color: '#888' }}>
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
  if (c === 'strong') return 'Personalised'
  if (c === 'early') return 'Limited data'
  return 'TfL only'
}

function confidencePill(c: SuggestionOption['confidence']): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 10,
    padding: '2px 7px',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
  if (c === 'strong') return { ...base, background: '#d1fae5', color: '#065f46' }
  if (c === 'early') return { ...base, background: '#fef3c7', color: '#92400e' }
  return { ...base, background: '#e5e7eb', color: '#374151' }
}

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 12,
  marginTop: 0,
}
const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontSize: 13,
  background: '#fff',
}
const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '12px 14px',
  background: '#fff',
}
const durationBadge: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
}
const expandBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#aaa',
  fontSize: 12,
  padding: 0,
}
const noteStyle: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 12,
  color: '#555',
}
const mutedText: React.CSSProperties = { color: '#888', fontSize: 13 }
