import { useEffect, useState } from 'react'
import { useMaps } from '../context'
import { createMapsApi } from '../api'
import type { KnownRoute } from '../types'

export function CommuteStats() {
  const { apiBase } = useMaps()
  const api = createMapsApi(apiBase)

  const [routes, setRoutes] = useState<KnownRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.routes.list()
      .then(({ routes: r }) => setRoutes(r))
      .catch(() => setRoutes([]))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  if (isLoading) return <p style={muted}>Loading route stats…</p>
  if (routes.length === 0) return (
    <p style={muted}>No routes yet — complete a few journeys and routes will be detected automatically.</p>
  )

  const tracked = routes.filter((r) => r.journeyCount > 0)
  if (tracked.length === 0) return (
    <p style={muted}>Routes detected, but no journey data yet.</p>
  )

  return (
    <div>
      <h3 style={sectionTitle}>Your Routes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tracked.map((route) => (
          <RouteRow key={route.id} route={route} />
        ))}
      </div>
    </div>
  )
}

function RouteRow({ route }: { route: KnownRoute }) {
  const typical = route.typicalDurationS
  const ratio = route.personalRatio

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{route.name}</div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            {route.journeyCount} journey{route.journeyCount !== 1 ? 's' : ''}
          </div>
        </div>
        {typical && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatMin(typical)}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>typical</div>
          </div>
        )}
      </div>

      {ratio !== null && ratio !== undefined && typical && (
        <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
          <StatChip label="vs TfL" value={ratioLabel(ratio)} color={ratioColor(ratio)} />
          {route.journeyCount >= 5 && (
            <StatChip label="confidence" value="good" color="#065f46" />
          )}
          {route.journeyCount < 5 && (
            <StatChip label="confidence" value="building" color="#92400e" />
          )}
        </div>
      )}
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ fontSize: 11 }}>
      <span style={{ color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label} </span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

function formatMin(seconds: number) {
  const m = Math.round(seconds / 60)
  return `${m} min`
}

function ratioLabel(ratio: number) {
  const pct = Math.round((ratio - 1) * 100)
  if (pct === 0) return 'on time'
  if (pct > 0) return `+${pct}% slower`
  return `${pct}% faster`
}

function ratioColor(ratio: number) {
  if (ratio < 0.95) return '#065f46'   // fast (green)
  if (ratio < 1.1) return '#374151'    // on time (neutral)
  return '#c05621'                      // slow (orange)
}

const muted: React.CSSProperties = { color: '#888', fontSize: 14 }
const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 12,
  marginTop: 0,
}
const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '12px 14px',
  background: '#fff',
}
