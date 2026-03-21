import { useEffect, useState } from 'react'
import { getHubConfig } from '@moducore/hub'

type HabitsSummary = {
  habitsCompleted: number
  habitsTotal: number
  stepCount: number | null
  spendingTotal: number | null
}

type MapsSummary = {
  count: number
  totalDistanceM: number
  modes: string[]
}

type SpotifySummary = {
  trackCount: number
  artists: string[]
}

type Props = {
  date: string      // YYYY-MM-DD
  apiBase: string   // e.g. http://localhost:3000
}

function fmt(n: number, unit: string) {
  return `${n.toLocaleString()} ${unit}`
}

function Pill({ icon, label, sub }: { icon: string; label: string; sub?: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', background: '#f9fafb', border: '1px solid #e5e7eb',
      borderRadius: 20, fontSize: 13,
    }}>
      <span>{icon}</span>
      <span style={{ fontWeight: 500, color: '#111' }}>{label}</span>
      {sub && <span style={{ color: '#6b7280' }}>{sub}</span>}
    </div>
  )
}

export function DayContextPanel({ date, apiBase }: Props) {
  const [habits, setHabits] = useState<HabitsSummary | null>(null)
  const [maps, setMaps] = useState<MapsSummary | null>(null)
  const [spotify, setSpotify] = useState<SpotifySummary | null>(null)

  const config = getHubConfig()
  const habitsEnabled = config.find((a) => a.slug === 'habits')?.enabled
  const mapsEnabled   = config.find((a) => a.slug === 'maps')?.enabled
  const spotifyEnabled = config.find((a) => a.slug === 'spotify')?.enabled

  useEffect(() => {
    const opts: RequestInit = { credentials: 'include' }

    if (habitsEnabled) {
      fetch(`${apiBase}/habits/day-summary?date=${date}`, opts)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => d && setHabits(d))
        .catch(() => null)
    }
    if (mapsEnabled) {
      fetch(`${apiBase}/maps/day-summary?date=${date}`, opts)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => d && setMaps(d))
        .catch(() => null)
    }
    if (spotifyEnabled) {
      fetch(`${apiBase}/spotify/day-summary?date=${date}`, opts)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => d && setSpotify(d))
        .catch(() => null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, apiBase])

  const hasData = habits || maps || (spotify && spotify.trackCount > 0)
  if (!hasData) return null

  return (
    <div style={{
      margin: '0 0 20px', padding: '10px 14px',
      background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 10,
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {date} — your day
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {habits && habits.habitsTotal > 0 && (
          <Pill
            icon="✅"
            label={`${habits.habitsCompleted}/${habits.habitsTotal} habits`}
          />
        )}
        {habits?.stepCount && (
          <Pill icon="👟" label={fmt(Math.round(habits.stepCount), 'steps')} />
        )}
        {habits?.spendingTotal && (
          <Pill icon="💷" label={`£${habits.spendingTotal.toFixed(2)}`} sub="spent" />
        )}
        {maps && maps.count > 0 && (
          <Pill
            icon="🗺️"
            label={`${maps.count} journey${maps.count !== 1 ? 's' : ''}`}
            sub={maps.totalDistanceM > 0 ? `${(maps.totalDistanceM / 1000).toFixed(1)} km` : undefined}
          />
        )}
        {spotify && spotify.trackCount > 0 && (
          <Pill
            icon="🎵"
            label={`${spotify.trackCount} tracks`}
            sub={spotify.artists.length > 0 ? spotify.artists.slice(0, 2).join(', ') : undefined}
          />
        )}
      </div>
    </div>
  )
}
