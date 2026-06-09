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
  apiBase: string
}

const S = {
  ink:     '#221a16',
  inkSoft: '#3b302a',
  coral:   '#ff8a5b',
  mint:    '#7fd1b9',
  lemon:   '#ffd86b',
  sky:     '#9aa8ff',
  rose:    '#ff9bb8',
}
const hand    = "'Caveat', 'Patrick Hand', cursive"
const handAlt = "'Patrick Hand', cursive"
const mono    = "'JetBrains Mono', monospace"

function Pin({ color = S.coral }: { color?: string }) {
  return (
    <div style={{
      position: 'absolute', right: 10, top: -6,
      width: 13, height: 13, borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${color}, rgba(0,0,0,0.45))`,
      boxShadow: '0 2px 3px rgba(0,0,0,0.25)',
      zIndex: 2,
    }} />
  )
}

function Sticky({ color, rot, pin, children }: { color: string; rot: number; pin?: string; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      background: color,
      padding: '11px 13px 13px',
      transform: `rotate(${rot}deg)`,
      boxShadow: '0 8px 18px rgba(0,0,0,0.13), 0 2px 4px rgba(0,0,0,0.08)',
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.04))',
    }}>
      <Pin color={pin ?? S.coral} />
      {children}
    </div>
  )
}

// Tiny waveform SVG for music sticker
function Waveform() {
  return (
    <svg viewBox="0 0 200 28" width="100%" height="22" style={{ marginTop: 6, display: 'block' }}>
      <path
        d="M0,14 C20,3 30,25 50,14 C70,3 80,25 100,14 C120,3 130,25 150,14 C170,3 180,25 200,14"
        fill="none" stroke={S.ink} strokeWidth="2.2" strokeLinecap="round"
      />
    </svg>
  )
}

// Tiny journey path SVG for travel sticker
function JourneyPath() {
  return (
    <svg viewBox="0 0 200 36" width="100%" height="28" style={{ marginTop: 4, display: 'block' }}>
      <path
        d="M10,28 C40,18 70,10 110,14 C150,18 170,10 195,4"
        fill="none" stroke={S.ink} strokeWidth="2.2" strokeLinecap="round"
      />
      <circle cx="10" cy="28" r="3.5" fill={S.coral} stroke={S.ink} strokeWidth="1.2" />
      <path d="M192,2 l4,3 -3,5 z" fill={S.coral} stroke={S.ink} strokeWidth="1.2" />
    </svg>
  )
}

// Mini 14-day dot row for habits sticker
function HabitDots({ filled }: { filled: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 2, marginTop: 7 }}>
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} style={{
          paddingTop: '100%',
          background: i < filled ? S.ink : 'transparent',
          border: `1px solid ${S.ink}`,
          borderRadius: 2,
        }} />
      ))}
    </div>
  )
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()
}

export function DayContextPanel({ date, apiBase }: Props) {
  const [habits, setHabits]   = useState<HabitsSummary | null>(null)
  const [maps, setMaps]       = useState<MapsSummary | null>(null)
  const [spotify, setSpotify] = useState<SpotifySummary | null>(null)

  const config         = getHubConfig()
  const habitsEnabled  = config.find((a) => a.slug === 'habits')?.enabled
  const mapsEnabled    = config.find((a) => a.slug === 'maps')?.enabled
  const spotifyEnabled = config.find((a) => a.slug === 'spotify')?.enabled

  useEffect(() => {
    const opts: RequestInit = { credentials: 'include' }
    if (habitsEnabled)
      fetch(`${apiBase}/habits/day-summary?date=${date}`, opts)
        .then((r) => r.ok ? r.json() : null).then((d) => d && setHabits(d)).catch(() => null)
    if (mapsEnabled)
      fetch(`${apiBase}/maps/day-summary?date=${date}`, opts)
        .then((r) => r.ok ? r.json() : null).then((d) => d && setMaps(d)).catch(() => null)
    if (spotifyEnabled)
      fetch(`${apiBase}/spotify/day-summary?date=${date}`, opts)
        .then((r) => r.ok ? r.json() : null).then((d) => d && setSpotify(d)).catch(() => null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, apiBase])

  const hasSpotify = spotify && spotify.trackCount > 0
  const hasMaps    = maps && maps.count > 0
  const hasHabits  = habits && habits.habitsTotal > 0

  if (!hasSpotify && !hasMaps && !hasHabits) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* header */}
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.55, color: S.inkSoft }}>
        WHAT ELSE · {fmtDate(date)} ↓
      </div>

      {/* music sticky */}
      {hasSpotify && (
        <Sticky color={S.mint} rot={-2} pin={S.coral}>
          <div style={{ fontFamily: handAlt, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: S.inkSoft }}>
            music · {spotify.trackCount} tracks
          </div>
          <div style={{ fontFamily: hand, fontSize: 22, lineHeight: 1.1, marginTop: 3, color: S.ink }}>
            {spotify.artists.length > 0
              ? <>mostly <em style={{ color: S.coral, fontStyle: 'normal' }}>{spotify.artists[0]}</em></>
              : 'tracks played'
            }
          </div>
          <Waveform />
        </Sticky>
      )}

      {/* travel sticky */}
      {hasMaps && (
        <Sticky color={S.lemon} rot={1.5} pin={S.sky}>
          <div style={{ fontFamily: handAlt, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: S.inkSoft }}>
            travel · {(maps.totalDistanceM / 1000).toFixed(1)} km
          </div>
          <div style={{ fontFamily: hand, fontSize: 22, lineHeight: 1.1, marginTop: 3, color: S.ink }}>
            {maps.count} journey{maps.count !== 1 ? 's' : ''}
            {maps.modes.length > 0 && <span style={{ fontSize: 16, color: S.inkSoft }}> · {maps.modes[0]}</span>}
          </div>
          <JourneyPath />
        </Sticky>
      )}

      {/* habits sticky */}
      {hasHabits && (
        <Sticky color={S.rose} rot={-1} pin={S.ink}>
          <div style={{ fontFamily: handAlt, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: S.inkSoft }}>
            habits · {habits.habitsCompleted} of {habits.habitsTotal} ✓
          </div>
          <div style={{ fontFamily: hand, fontSize: 22, lineHeight: 1.1, marginTop: 3, color: S.ink }}>
            {habits.stepCount
              ? <>{Math.round(habits.stepCount).toLocaleString()} <span style={{ fontSize: 16, color: S.inkSoft }}>steps</span></>
              : <>streak <b style={{ color: S.ink }}>↑</b></>
            }
          </div>
          <HabitDots filled={habits.habitsCompleted} />
        </Sticky>
      )}

      {/* footnote */}
      <div style={{ fontFamily: hand, fontSize: 17, color: S.inkSoft, lineHeight: 1.2, transform: 'rotate(-1deg)', opacity: 0.65, marginTop: 4 }}>
        ↳ your apps, telling your journal what they saw.
      </div>
    </div>
  )
}
