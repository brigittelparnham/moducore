import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { StickerMark } from '@moducore/ui'
import { AppSwitcher } from '@moducore/hub'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const BOARD_KEY = 'moducore_board_layout'

const S = {
  paper:   '#efe6d4',
  paperD:  '#e2d6bd',
  ink:     '#221a16',
  inkSoft: '#3b302a',
  coral:   '#ff8a5b',
  mint:    '#7fd1b9',
  lemon:   '#ffd86b',
  sky:     '#9aa8ff',
  rose:    '#ff9bb8',
  white:   '#fffdf8',
}
const hand    = "'Caveat', 'Patrick Hand', cursive"
const handAlt = "'Patrick Hand', cursive"
const mono    = "'JetBrains Mono', monospace"
const body    = "'Space Grotesk', 'Instrument Sans', sans-serif"

// ─── Types ────────────────────────────────────────────────────────────────────

type WidgetId = 'journal' | 'music' | 'maps' | 'habits' | 'finance' | 'website'

type Pos = { x: number; y: number }
type Layout = Record<WidgetId, Pos>

const DEFAULT_LAYOUT: Layout = {
  journal: { x: 24,  y: 24  },
  music:   { x: 290, y: 24  },
  maps:    { x: 552, y: 14  },
  habits:  { x: 812, y: 24  },
  website: { x: 24,  y: 300 },
  finance: { x: 580, y: 290 },
}

const ROTS: Record<WidgetId, number> = {
  journal: -3, music: 2, maps: 4, habits: -2, website: 2, finance: 3,
}

// ─── Board primitives ─────────────────────────────────────────────────────────

function Pin({ color = S.coral }: { color?: string }) {
  return (
    <div style={{
      position: 'absolute', right: 12, top: -7,
      width: 14, height: 14, borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${color}, rgba(0,0,0,0.45))`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.28)',
      zIndex: 2, pointerEvents: 'none',
    }} />
  )
}

function TapeStrip({ rot = -1.5 }: { rot?: number }) {
  return (
    <div style={{
      position: 'absolute', top: -9, left: '50%',
      transform: `translateX(-50%) rotate(${rot}deg)`,
      width: 80, height: 18,
      background: 'rgba(255,216,107,0.7)',
      mixBlendMode: 'multiply',
      borderLeft: '1px dashed rgba(0,0,0,0.08)',
      borderRight: '1px dashed rgba(0,0,0,0.08)',
    }} />
  )
}

function Sticky({ color, rot, pin, children, style }: {
  color: string; rot: number; pin?: string; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{
      position: 'relative',
      background: color,
      padding: '12px 14px 14px',
      transform: `rotate(${rot}deg)`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.08)',
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.04))',
      userSelect: 'none',
      ...style,
    }}>
      <Pin color={pin ?? S.coral} />
      {children}
    </div>
  )
}

function Polaroid({ rot, label, children, style }: {
  rot: number; label?: string; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{
      position: 'relative',
      background: S.white,
      boxShadow: '0 8px 28px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)',
      transform: `rotate(${rot}deg)`,
      padding: '10px 10px 28px',
      userSelect: 'none',
      ...style,
    }}>
      <TapeStrip rot={rot > 0 ? -2 : 1.5} />
      {/* image area */}
      <div style={{
        background: S.paperD,
        width: '100%',
        aspectRatio: '1.2 / 1',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {children}
      </div>
      {label && (
        <div style={{
          fontFamily: hand, fontSize: 16, color: S.inkSoft,
          textAlign: 'center', marginTop: 8, lineHeight: 1.1,
        }}>
          {label}
        </div>
      )}
    </div>
  )
}

// Mini waveform for music sticky
function Waveform() {
  return (
    <svg viewBox="0 0 200 28" width="100%" height="22" style={{ marginTop: 8, display: 'block' }}>
      <path
        d="M0,14 C20,3 30,25 50,14 C70,3 80,25 100,14 C120,3 130,25 150,14 C170,3 180,25 200,14"
        fill="none" stroke={S.ink} strokeWidth="2.2" strokeLinecap="round"
      />
    </svg>
  )
}

// Mini smiley for mood polaroid
function Smiley() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <circle cx="100" cy="100" r="60" fill="none" stroke={S.ink} strokeWidth="3" />
      <path d="M75,90 Q78,86 81,90" fill="none" stroke={S.ink} strokeWidth="4" strokeLinecap="round" />
      <path d="M119,90 Q122,86 125,90" fill="none" stroke={S.ink} strokeWidth="4" strokeLinecap="round" />
      <path d="M78,118 Q100,134 122,118" fill="none" stroke={S.ink} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

// ─── Draggable widget wrapper ─────────────────────────────────────────────────

function DraggableWidget({
  id, layout, onDrag, children, zIndex,
}: {
  id: WidgetId
  layout: Layout
  onDrag: (id: WidgetId, pos: Pos) => void
  children: React.ReactNode
  zIndex?: number
}) {
  const drag = useRef<{ ox: number; oy: number; mx: number; my: number } | null>(null)
  const pos = layout[id]

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    drag.current = { ox: pos.x, oy: pos.y, mx: e.clientX, my: e.clientY }

    function onMove(ev: MouseEvent) {
      if (!drag.current) return
      onDrag(id, {
        x: drag.current.ox + (ev.clientX - drag.current.mx),
        y: drag.current.oy + (ev.clientY - drag.current.my),
      })
    }
    function onUp() {
      drag.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [id, pos.x, pos.y, onDrag])

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: pos.x, top: pos.y,
        cursor: 'grab',
        zIndex: zIndex ?? 1,
      }}
    >
      {children}
    </div>
  )
}

// ─── Data types ───────────────────────────────────────────────────────────────

type JournalEntry  = { title: string; content: { html?: string; text?: string }; createdAt: string } | null
type SpotifyData   = { trackCount: number; artists: string[] } | null
type MapsData      = { count: number; totalDistanceM: number } | null
type HabitsData    = { habitsCompleted: number; habitsTotal: number; stepCount: number | null; spendingTotal: number | null } | null
type FinanceData   = { balance: string; currency: string } | null

// ─── Main page ────────────────────────────────────────────────────────────────

function loadLayout(): Layout {
  try {
    const stored = localStorage.getItem(BOARD_KEY)
    if (!stored) return DEFAULT_LAYOUT
    return { ...DEFAULT_LAYOUT, ...JSON.parse(stored) as Partial<Layout> }
  } catch {
    return DEFAULT_LAYOUT
  }
}

export function BoardPage() {
  const { user } = useAuth()
  const [layout, setLayout] = useState<Layout>(loadLayout)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Data state
  const [journalEntry, setJournalEntry] = useState<JournalEntry>(null)
  const [spotify, setSpotify]           = useState<SpotifyData>(null)
  const [maps, setMaps]                 = useState<MapsData>(null)
  const [habits, setHabits]             = useState<HabitsData>(null)
  const [pageCount, setPageCount]       = useState<number>(0)
  const [finance, setFinance]           = useState<FinanceData>(null)

  const today = new Date().toISOString().slice(0, 10)
  const opts: RequestInit = { credentials: 'include' }

  // Fetch all widget data in parallel
  useEffect(() => {
    fetch(`${API}/journal/entries?limit=1`, opts)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.entries?.[0] && setJournalEntry(d.entries[0]))
      .catch(() => null)

    fetch(`${API}/spotify/day-summary?date=${today}`, opts)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setSpotify(d))
      .catch(() => null)

    fetch(`${API}/maps/day-summary?date=${today}`, opts)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setMaps(d))
      .catch(() => null)

    fetch(`${API}/habits/day-summary?date=${today}`, opts)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setHabits(d))
      .catch(() => null)

    fetch(`${API}/pages`, opts)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.pages && setPageCount(d.pages.filter((p: { status: string }) => p.status === 'published').length))
      .catch(() => null)

    fetch(`${API}/finance/accounts`, opts)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.accounts?.[0]) {
          const a = d.accounts[0]
          setFinance({ balance: a.balance ?? a.startingBalance ?? '0', currency: a.currency ?? 'GBP' })
        }
      })
      .catch(() => null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  const handleDrag = useCallback((id: WidgetId, pos: Pos) => {
    setLayout((prev) => {
      const next = { ...prev, [id]: pos }
      // Debounce save
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(BOARD_KEY, JSON.stringify(next))
        const now = new Date()
        setSavedAt(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
      }, 400)
      return next
    })
  }, [])

  // Today's heading
  const todayDate = new Date()
  const dayName  = todayDate.toLocaleDateString('en-GB', { weekday: 'long' }).toLowerCase()
  const dayNum   = todayDate.getDate()
  const monthName = todayDate.toLocaleDateString('en-GB', { month: 'long' }).toLowerCase()

  // Journal snippet: strip HTML tags, truncate to ~120 chars
  const entrySnippet = journalEntry
    ? (journalEntry.content.html ?? '').replace(/<[^>]+>/g, '').slice(0, 120)
    : null

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: S.paper,
      fontFamily: body,
      overflow: 'auto',
    }}>
      {/* dot grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(rgba(34,26,22,0.13) 1px, transparent 1px)`,
        backgroundSize: '18px 18px', opacity: 0.35, zIndex: 0,
      }} />

      {/* ── Top bar ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 44,
        background: `${S.paperD}f0`, backdropFilter: 'blur(8px)',
        borderBottom: `1.5px solid rgba(34,26,22,0.12)`,
        display: 'flex', alignItems: 'center', padding: '0 20px',
        zIndex: 200, gap: 20, fontFamily: mono, fontSize: 11,
        letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>
        <Link
          to="/"
          style={{ color: S.inkSoft, textDecoration: 'none', opacity: 0.5, fontSize: 10 }}
        >
          ← cms
        </Link>
        <span style={{ color: S.ink, opacity: 0.7 }}>
          my board · {user?.name?.split(' ')[0]?.toLowerCase() ?? 'you'}
          {savedAt && <span style={{ opacity: 0.5 }}> · saved {savedAt}</span>}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{
            display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
            background: savedAt ? S.mint : S.inkSoft, opacity: savedAt ? 1 : 0.3,
          }} />
          <span style={{ opacity: 0.55 }}>autosaving</span>
        </div>
      </div>

      {/* ── Day heading ── */}
      <div style={{
        position: 'absolute', top: 62, left: 24, right: 24,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: body, fontSize: 56, fontWeight: 700,
          letterSpacing: '-0.03em', margin: 0, lineHeight: 0.95, color: S.ink,
        }}>
          {dayName}{' '}
          <span style={{ fontFamily: hand, color: S.coral, fontSize: 64 }}>{dayNum}</span>{' '}
          {monthName}.
        </h2>
        {habits?.stepCount && (
          <div style={{
            fontFamily: hand, fontSize: 26, color: S.inkSoft,
            lineHeight: 1.1, textAlign: 'right',
          }}>
            a good day.<br />
            <span style={{ color: S.coral }}>
              ↘ {Math.round(habits.stepCount).toLocaleString()} steps
            </span>
          </div>
        )}
      </div>

      {/* ── Board canvas ── */}
      <div style={{ position: 'absolute', top: 170, left: 0, right: 0, bottom: 0, zIndex: 5 }}>

        {/* Journal polaroid */}
        <DraggableWidget id="journal" layout={layout} onDrag={handleDrag}>
          <Polaroid rot={ROTS.journal} label={journalEntry?.title ?? 'journal'} style={{ width: 230 }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(135deg, ${S.lemon}40, ${S.coral}20)`,
              display: 'flex', alignItems: 'flex-start',
              padding: 12,
            }}>
              {entrySnippet
                ? (
                  <p style={{
                    fontFamily: hand, fontSize: 18, lineHeight: 1.3,
                    color: S.ink, margin: 0,
                  }}>
                    {entrySnippet}{entrySnippet.length >= 120 ? '…' : ''}
                  </p>
                )
                : (
                  <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.5, margin: 0 }}>
                    no entry yet…
                  </p>
                )
              }
            </div>
          </Polaroid>
        </DraggableWidget>

        {/* Music sticky */}
        {(spotify !== null || true) && (
          <DraggableWidget id="music" layout={layout} onDrag={handleDrag}>
            <Sticky color={S.mint} rot={ROTS.music} pin={S.ink} style={{ width: 220 }}>
              <div style={{ fontFamily: handAlt, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: S.inkSoft }}>
                {spotify ? `now playing · ${spotify.trackCount} tracks` : 'music'}
              </div>
              <div style={{ fontFamily: hand, fontSize: 28, lineHeight: 1.1, marginTop: 6, color: S.ink }}>
                {spotify?.artists?.[0]
                  ? <>mostly <em style={{ color: S.coral, fontStyle: 'normal' }}>{spotify.artists[0]}</em></>
                  : <span style={{ opacity: 0.45 }}>nothing yet</span>
                }
              </div>
              <Waveform />
              <div style={{ fontFamily: handAlt, fontSize: 11, marginTop: 2, opacity: 0.55 }}>
                ··················
              </div>
            </Sticky>
          </DraggableWidget>
        )}

        {/* Maps polaroid */}
        <DraggableWidget id="maps" layout={layout} onDrag={handleDrag}>
          <Polaroid
            rot={ROTS.maps}
            label={maps ? `${maps.count} journey${maps.count !== 1 ? 's' : ''} · ${(maps.totalDistanceM / 1000).toFixed(1)} km` : 'travel'}
            style={{ width: 220 }}
          >
            <StickerMark slug="maps" seed={11} size={180} />
            {maps && (
              <div style={{
                position: 'absolute', bottom: 6, left: 8,
                fontFamily: hand, fontSize: 16, color: S.inkSoft,
                transform: 'rotate(-3deg)',
              }}>
                out & about ↗
              </div>
            )}
          </Polaroid>
        </DraggableWidget>

        {/* Habits sticky */}
        <DraggableWidget id="habits" layout={layout} onDrag={handleDrag}>
          <Sticky color={S.lemon} rot={ROTS.habits} pin={S.sky} style={{ width: 210 }}>
            <div style={{ fontFamily: handAlt, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: S.inkSoft }}>
              today's reps
            </div>
            {habits && habits.habitsTotal > 0
              ? (
                <>
                  <div style={{ fontFamily: hand, fontSize: 22, lineHeight: 1.3, marginTop: 6, color: S.ink }}>
                    <div>{habits.habitsCompleted} of {habits.habitsTotal} done ✓</div>
                    {habits.habitsTotal - habits.habitsCompleted > 0 && (
                      <div style={{ opacity: 0.5 }}>
                        ○ {habits.habitsTotal - habits.habitsCompleted} remaining
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 8, fontFamily: hand, fontSize: 18, color: S.coral }}>
                    streak ↑
                  </div>
                </>
              )
              : (
                <div style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.45, marginTop: 6 }}>
                  no habits yet
                </div>
              )
            }
          </Sticky>
        </DraggableWidget>

        {/* Mood polaroid (static) */}
        <div style={{
          position: 'absolute', left: 300, top: 270,
          cursor: 'default', pointerEvents: 'none',
        }}>
          <Polaroid rot={-2} label="mood today" style={{ width: 200 }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(135deg, ${S.coral}60, ${S.lemon}60)`,
            }}>
              <Smiley />
            </div>
          </Polaroid>
        </div>

        {/* Website sticky */}
        <DraggableWidget id="website" layout={layout} onDrag={handleDrag}>
          <Sticky color={S.sky} rot={ROTS.website} pin={S.coral} style={{ width: 230 }}>
            <div style={{ fontFamily: handAlt, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: S.inkSoft }}>
              my website
            </div>
            <div style={{ fontFamily: hand, fontSize: 28, lineHeight: 1, marginTop: 6, color: S.ink }}>
              {user?.email?.split('@')[1] ?? 'my site'}
            </div>
            <div style={{ fontFamily: hand, fontSize: 18, marginTop: 6, color: S.inkSoft }}>
              {pageCount > 0
                ? `${pageCount} page${pageCount !== 1 ? 's' : ''} published`
                : 'no pages yet'
              }
            </div>
          </Sticky>
        </DraggableWidget>

        {/* Finance sticky */}
        <DraggableWidget id="finance" layout={layout} onDrag={handleDrag}>
          <Sticky color={S.rose} rot={ROTS.finance} pin={S.ink} style={{ width: 220 }}>
            <div style={{ fontFamily: handAlt, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: S.inkSoft }}>
              {habits?.spendingTotal ? 'today' : 'accounts'}
            </div>
            {habits?.spendingTotal ? (
              <>
                <div style={{ fontFamily: hand, fontSize: 26, lineHeight: 1.1, marginTop: 6, color: S.ink }}>
                  {finance?.currency ?? '£'}{Math.abs(Number(habits.spendingTotal)).toFixed(2)} spent
                </div>
                <div style={{ marginTop: 8, height: 7, background: 'rgba(0,0,0,0.1)', borderRadius: 999 }}>
                  <div style={{ width: '60%', height: '100%', background: S.ink, borderRadius: 999 }} />
                </div>
                <div style={{ fontFamily: hand, fontSize: 17, marginTop: 8, color: S.inkSoft, lineHeight: 1.2 }}>
                  {finance ? `${finance.currency} balance ↓` : 'tracking…'}
                </div>
              </>
            ) : finance ? (
              <>
                <div style={{ fontFamily: hand, fontSize: 26, lineHeight: 1.1, marginTop: 6, color: S.ink }}>
                  {finance.currency} {parseFloat(finance.balance).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontFamily: hand, fontSize: 17, marginTop: 8, color: S.inkSoft }}>
                  account balance
                </div>
              </>
            ) : (
              <div style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.45, marginTop: 6 }}>
                no accounts yet
              </div>
            )}
          </Sticky>
        </DraggableWidget>

        {/* Drag hint text */}
        <div style={{
          position: 'absolute', left: 830, top: 290,
          fontFamily: hand, fontSize: 20, color: S.inkSoft,
          transform: 'rotate(-4deg)', width: 180, lineHeight: 1.3,
          pointerEvents: 'none', opacity: 0.65,
        }}>
          ← drag, rotate, peel.<br />your board, your mess.
        </div>
        <svg style={{ position: 'absolute', left: 818, top: 340, pointerEvents: 'none', opacity: 0.5 }} width="200" height="140">
          <path
            d="M10,20 C30,80 110,90 180,120"
            fill="none" stroke={S.inkSoft} strokeWidth="2" strokeLinecap="round"
          />
          <path d="M177,115 l4,10 l9,-7 z" fill={S.inkSoft} />
        </svg>

        {/* + new sticker drop zone */}
        <div style={{
          position: 'absolute', left: 840, top: 440,
          width: 180, height: 110,
          border: `2.5px dashed ${S.inkSoft}`, borderRadius: 18,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer',
          background: 'rgba(255,255,255,0.25)',
          opacity: 0.6,
        }}>
          <span style={{ fontFamily: hand, fontSize: 32, color: S.ink, lineHeight: 0.9 }}>+ new sticker</span>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', marginTop: 5, opacity: 0.6 }}>OR DROP AN APP</span>
        </div>

      </div>

      <AppSwitcher />
    </div>
  )
}
