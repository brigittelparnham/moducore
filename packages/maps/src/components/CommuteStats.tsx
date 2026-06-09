import { useEffect, useState } from 'react'
import { useMaps } from '../context'
import { createMapsApi } from '../api'
import type { KnownRoute } from '../types'

const S = {
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

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

  if (isLoading) return (
    <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.5 }}>loading route stats…</p>
  )
  if (routes.length === 0) return (
    <p style={{ fontFamily: hand, fontSize: 20, color: S.inkSoft, opacity: 0.6 }}>
      no routes yet — complete a few journeys and routes will be detected automatically.
    </p>
  )

  const tracked = routes.filter((r) => r.journeyCount > 0)
  if (tracked.length === 0) return (
    <p style={{ fontFamily: hand, fontSize: 20, color: S.inkSoft, opacity: 0.6 }}>
      routes detected, but no journey data yet.
    </p>
  )

  return (
    <div>
      <div style={{ fontFamily: hand, fontSize: 28, color: S.ink, marginBottom: 14 }}>your routes ↘</div>
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
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: hand, fontSize: 22, color: S.ink }}>{route.name}</div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.15em', color: S.inkSoft, opacity: 0.55, marginTop: 2 }}>
            {route.journeyCount} JOURNEY{route.journeyCount !== 1 ? 'S' : ''}
          </div>
        </div>
        {typical && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: hand, fontSize: 30, color: S.ink, lineHeight: 1 }}>{formatMin(typical)}</div>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: S.inkSoft, opacity: 0.5 }}>TYPICAL</div>
          </div>
        )}
      </div>

      {ratio !== null && ratio !== undefined && typical && (
        <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
          <StatChip label="vs TfL" value={ratioLabel(ratio)} color={ratioColor(ratio)} />
          <StatChip
            label="confidence"
            value={route.journeyCount >= 5 ? 'good' : 'building'}
            color={route.journeyCount >= 5 ? S.mint : '#ffd86b'}
          />
        </div>
      )}
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: '#3b302a', opacity: 0.5, textTransform: 'uppercase' as const }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.1em', fontWeight: 700, color, textTransform: 'uppercase' as const }}>{value}</span>
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
  if (ratio < 0.95) return S.mint
  if (ratio < 1.1) return '#3b302a'
  return S.coral
}

const card: React.CSSProperties = {
  border: `1.5px solid rgba(34,26,22,0.1)`,
  borderRadius: 3,
  padding: '14px 16px',
  background: '#fffdf8',
  boxShadow: '1px 2px 0 rgba(34,26,22,0.05)',
}
