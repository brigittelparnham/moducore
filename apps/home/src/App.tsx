import { StickerMark } from '@moducore/ui'
import type { StickerPalette } from '@moducore/ui'

const CMS_URL     = import.meta.env.VITE_CMS_URL     ?? 'http://localhost:3001'
const JOURNAL_URL = import.meta.env.VITE_JOURNAL_URL ?? 'http://localhost:3002'
const SPOTIFY_URL = import.meta.env.VITE_SPOTIFY_URL ?? 'http://localhost:3003'
const MAPS_URL    = import.meta.env.VITE_MAPS_URL    ?? 'http://localhost:3004'
const HABITS_URL  = import.meta.env.VITE_HABITS_URL  ?? 'http://localhost:3005'

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
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

type App = {
  slug: string
  name: string
  tagline: string
  description: string
  url: string
  accent: string
  palette: StickerPalette
  tapeAngle: number
  rotate: number
  seed: number
}

const apps: App[] = [
  {
    slug: 'cms',
    name: 'moducore',
    tagline: 'your workspace',
    description: 'Create pages, manage your site, connect apps, and control everything from one place. Your home base.',
    url: CMS_URL,
    accent: S.ink,
    palette: { ink: S.ink, a: S.coral, b: S.mint, c: S.lemon, d: S.sky },
    tapeAngle: -3,
    rotate: -0.6,
    seed: 7,
  },
  {
    slug: 'journal',
    name: 'journal',
    tagline: 'write every day',
    description: 'A private writing space. Rich text, tags, and a streak to keep you going.',
    url: JOURNAL_URL,
    accent: S.lemon,
    palette: { ink: S.ink, a: S.coral, b: S.mint, c: S.lemon, d: S.sky },
    tapeAngle: 2,
    rotate: 0.8,
    seed: 42,
  },
  {
    slug: 'spotify',
    name: 'music',
    tagline: 'your listening life',
    description: "Connect Spotify to see what you've been listening to — top tracks, artists, and era breakdowns.",
    url: SPOTIFY_URL,
    accent: S.coral,
    palette: { ink: S.ink, a: S.coral, b: S.mint, c: S.lemon, d: S.sky },
    tapeAngle: -4,
    rotate: -1.1,
    seed: 11,
  },
  {
    slug: 'maps',
    name: 'travel',
    tagline: 'every journey, remembered',
    description: 'Track where you go with OwnTracks. Auto-detect journeys, commute intelligence, and TfL at a glance.',
    url: MAPS_URL,
    accent: S.sky,
    palette: { ink: S.ink, a: S.coral, b: S.mint, c: S.lemon, d: S.sky },
    tapeAngle: 3,
    rotate: 0.5,
    seed: 23,
  },
  {
    slug: 'habits',
    name: 'lifestyle',
    tagline: 'build better habits',
    description: 'Track habits, set limits, earn rewards. Finance tracking with auto-categorisation and Starling sync.',
    url: HABITS_URL,
    accent: S.mint,
    palette: { ink: S.ink, a: S.lemon, b: S.mint, c: S.paper, d: S.sky },
    tapeAngle: -2,
    rotate: -0.9,
    seed: 5,
  },
]

// ── Floating cluster pieces ───────────────────────────────────────────────────

function TapeStrip({ rot = -2 }: { rot?: number }) {
  return (
    <div style={{
      position: 'absolute', top: -10, left: '50%',
      transform: `translateX(-50%) rotate(${rot}deg)`,
      width: 72, height: 18,
      background: 'rgba(255,216,107,0.7)',
      mixBlendMode: 'multiply',
      borderLeft: '1px dashed rgba(0,0,0,0.08)',
      borderRight: '1px dashed rgba(0,0,0,0.08)',
    }} />
  )
}

function ClusterPin({ color = S.coral }: { color?: string }) {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${color}, rgba(0,0,0,0.45))`,
      boxShadow: '0 2px 3px rgba(0,0,0,0.25)',
    }} />
  )
}

function ClusterPolaroid({
  x, y, rot, label, slug, seed, palette,
  pinColor, pinOffsetX,
}: {
  x: number; y: number; rot: number; label: string
  slug: string; seed: number; palette: StickerPalette
  pinColor?: string; pinOffsetX?: number
}) {
  return (
    <>
      {/* pin above polaroid */}
      <div style={{ position: 'absolute', left: (pinOffsetX ?? x + 96), top: y - 7, zIndex: 5 }}>
        <ClusterPin color={pinColor ?? S.coral} />
      </div>
      <div style={{
        position: 'absolute', left: x, top: y,
        width: 210, zIndex: 3,
        background: '#fff',
        padding: '10px 10px 22px',
        transform: `rotate(${rot}deg)`,
        boxShadow: '0 10px 24px rgba(34,26,22,0.16), 0 2px 6px rgba(34,26,22,0.08)',
      }}>
        <TapeStrip rot={rot > 0 ? -3 : 2} />
        <div style={{
          width: '100%', aspectRatio: '1/1',
          background: S.paperD,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <StickerMark slug={slug} seed={seed} size={160} palette={palette} />
        </div>
        <div style={{ fontFamily: hand, fontSize: 20, color: S.inkSoft, textAlign: 'center', marginTop: 6 }}>
          {label}
        </div>
      </div>
    </>
  )
}

function ClusterSticky({
  x, y, w, h, rot, color, pinColor, pinOffsetX, children,
}: {
  x: number; y: number; w: number; h: number; rot: number
  color: string; pinColor?: string; pinOffsetX?: number
  children: React.ReactNode
}) {
  return (
    <>
      <div style={{ position: 'absolute', left: (pinOffsetX ?? x + w / 2 - 7), top: y - 8, zIndex: 5 }}>
        <ClusterPin color={pinColor ?? S.coral} />
      </div>
      <div style={{
        position: 'absolute', left: x, top: y,
        width: w, height: h,
        background: color,
        transform: `rotate(${rot}deg)`,
        padding: '14px 16px',
        boxShadow: '0 8px 18px rgba(34,26,22,0.13), 0 2px 4px rgba(34,26,22,0.08)',
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.04))',
        fontFamily: hand, fontSize: 22, lineHeight: 1.15, color: S.ink,
        zIndex: 3,
      }}>
        {children}
      </div>
    </>
  )
}

// ── App card (preserved) ──────────────────────────────────────────────────────

function AppCard({ app }: { app: App }) {
  return (
    <a
      href={app.url}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 28px 24px',
        background: '#fff',
        boxShadow: '0 12px 28px rgba(34,26,22,0.1), 0 2px 6px rgba(34,26,22,0.06)',
        textDecoration: 'none',
        color: S.ink,
        position: 'relative',
        transform: `rotate(${app.rotate}deg)`,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.transform = `rotate(0deg) translateY(-4px)`
        el.style.boxShadow = `0 20px 48px rgba(34,26,22,0.16), 0 4px 12px rgba(34,26,22,0.08)`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.transform = `rotate(${app.rotate}deg)`
        el.style.boxShadow = `0 12px 28px rgba(34,26,22,0.1), 0 2px 6px rgba(34,26,22,0.06)`
      }}
    >
      {/* tape strip */}
      <div style={{
        position: 'absolute',
        top: -10, left: '50%',
        transform: `translateX(-50%) rotate(${app.tapeAngle}deg)`,
        width: 72, height: 18,
        background: `${app.accent}bb`,
        mixBlendMode: 'multiply',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.06)',
        borderLeft: '1px dashed rgba(0,0,0,0.1)',
        borderRight: '1px dashed rgba(0,0,0,0.1)',
      }} />

      {/* polaroid image area with generative sticker mark */}
      <div style={{
        width: '100%', aspectRatio: '1/1',
        background: S.paperD,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14, overflow: 'hidden',
      }}>
        <StickerMark slug={app.slug} seed={app.seed} size={120} palette={app.palette} />
      </div>

      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: S.inkSoft, opacity: 0.55, marginBottom: 4 }}>
        {app.tagline}
      </div>
      <div style={{ fontFamily: hand, fontSize: 30, color: S.ink, lineHeight: 1.1, marginBottom: 12 }}>
        {app.name}
      </div>
      <p style={{ fontFamily: body, fontSize: 13, color: S.inkSoft, lineHeight: 1.65, margin: '0 0 20px', flex: 1, opacity: 0.75 }}>
        {app.description}
      </p>
      <div style={{ fontFamily: hand, fontSize: 18, color: app.accent }}>
        open →
      </div>
    </a>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export function App() {
  const stickerPalette: StickerPalette = { ink: S.ink, a: S.coral, b: S.mint, c: S.lemon, d: S.sky }

  return (
    <div style={{ minHeight: '100vh', background: S.paper, fontFamily: body, position: 'relative' }}>
      {/* dot grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(${S.inkSoft}22 1px, transparent 1px)`,
        backgroundSize: '18px 18px', opacity: 0.35, zIndex: 0,
      }} />

      {/* ── Nav ── */}
      <header style={{
        position: 'sticky', top: 0,
        background: `${S.paperD}ee`, backdropFilter: 'blur(8px)',
        borderBottom: `1.5px solid rgba(34,26,22,0.12)`,
        padding: '0 28px', height: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 100,
      }}>
        <span style={{ fontFamily: hand, fontSize: 22, color: S.ink }}>
          moducore · <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', opacity: 0.5 }}>a studio of small apps</span>
        </span>
        <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {(['#apps', '#about'] as const).map((href) => (
            <a key={href} href={href} style={{
              fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: S.inkSoft, textDecoration: 'none', opacity: 0.55, padding: '6px 12px',
            }}>
              {href.slice(1)}
            </a>
          ))}
          <a href={CMS_URL} style={{
            fontFamily: body, fontSize: 13, textDecoration: 'none',
            color: S.inkSoft, padding: '6px 14px', opacity: 0.65,
          }}>
            sign in
          </a>
          <a href={`${CMS_URL}/signup`} style={{
            fontFamily: body, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            background: S.ink, color: S.paper,
            padding: '7px 18px', borderRadius: 999, letterSpacing: '-0.01em',
          }}>
            start →
          </a>
        </nav>
      </header>

      {/* ── Hero — two column: text left, floating cluster right ── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '64px 60px 32px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 40,
        alignItems: 'center',
        minHeight: 720,
        overflow: 'hidden',
      }}>
        {/* Left: headline + copy + CTAs */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: S.coral, marginBottom: 16, opacity: 0.9 }}>
            HELLO ↘ WELCOME TO THE STUDIO
          </div>

          {/* Big headline */}
          <h1 style={{ fontFamily: body, fontWeight: 700, fontSize: 'clamp(52px, 6.5vw, 96px)', lineHeight: 0.93, letterSpacing: '-0.04em', margin: '0 0 0', color: S.ink }}>
            a{' '}
            <span style={{
              fontFamily: hand, fontWeight: 700,
              color: S.coral,
              fontSize: 'clamp(58px, 7.5vw, 108px)',
              display: 'inline-block',
              transform: 'rotate(-3deg) translateY(6px)',
            }}>
              messy
            </span>
            ,{' '}
            <br />
            {/* "tidy little" with scribble oval */}
            <span style={{ display: 'inline-flex', alignItems: 'baseline', position: 'relative' }}>
              tidy little
              <svg
                width="110" height="70"
                viewBox="0 0 120 80"
                style={{ margin: '0 6px', flexShrink: 0 }}
              >
                <path d="M10,60 C20,30 40,12 70,18 C100,24 110,46 90,64 C70,82 24,72 10,60 Z"
                  fill="none" stroke={S.ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22,52 C32,32 50,24 70,28"
                  fill="none" stroke={S.coral} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <br />
            <span style={{
              fontFamily: hand,
              color: S.mint,
              fontSize: 'clamp(58px, 7.5vw, 108px)',
              display: 'inline-block',
              transform: 'rotate(2deg)',
              fontStyle: 'italic',
            }}>
              life-OS.
            </span>
          </h1>

          <p style={{
            fontFamily: body, fontSize: 17, lineHeight: 1.55,
            color: S.inkSoft, maxWidth: 460, margin: '22px 0 0', opacity: 0.8,
          }}>
            moducore is a workshop for the apps that run your day. journal, music,
            travel, habits, your own website — each one a sticker you can pin, peel,
            or doodle on.{' '}
            <em style={{ fontFamily: hand, fontSize: 21, color: S.ink, fontStyle: 'normal' }}>
              built by hand, run by you.
            </em>
          </p>

          {/* CTAs — both functional */}
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a
              href={`${CMS_URL}/signup`}
              style={{
                fontFamily: body, fontSize: 15, fontWeight: 700,
                textDecoration: 'none',
                background: S.ink, color: S.paper,
                padding: '14px 24px', borderRadius: 999,
                letterSpacing: '-0.01em',
              }}
            >
              make your board →
            </a>
            <a
              href={CMS_URL}
              style={{
                fontFamily: hand, fontSize: 22, color: S.coral,
                textDecoration: 'none',
              }}
            >
              ← or sign in
            </a>
          </div>
        </div>

        {/* Right: floating polaroid cluster */}
        <div style={{ position: 'relative', height: 680, userSelect: 'none' }}>
          {/* Travel polaroid */}
          <ClusterPolaroid
            x={300} y={0} rot={6} label="travel"
            slug="maps" seed={42} palette={stickerPalette}
            pinColor={S.coral} pinOffsetX={390}
          />

          {/* Journal polaroid */}
          <ClusterPolaroid
            x={70} y={70} rot={-4} label="journal"
            slug="journal" seed={42} palette={stickerPalette}
            pinColor={S.sky} pinOffsetX={166}
          />

          {/* "kiln day" sticky */}
          <ClusterSticky x={310} y={258} w={200} h={150} rot={4} color={S.mint} pinColor={S.coral} pinOffsetX={400}>
            <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: 13, letterSpacing: '0.1em' }}>thursday · 14 may</div>
            <div style={{ fontFamily: hand, fontSize: 28, lineHeight: 1.1, marginTop: 6 }}>
              kiln day.<br />jug warped beautifully ⌬
            </div>
          </ClusterSticky>

          {/* Music polaroid */}
          <ClusterPolaroid
            x={120} y={320} rot={3} label="music"
            slug="spotify" seed={42} palette={stickerPalette}
            pinColor={S.lemon} pinOffsetX={215}
          />

          {/* "14 day streak" sticky */}
          <ClusterSticky x={340} y={440} w={170} h={170} rot={-5} color={S.coral} pinColor={S.ink} pinOffsetX={414}>
            <div style={{ fontFamily: hand, fontSize: 26, lineHeight: 1.1, marginTop: 6 }}>
              14 day streak. tiny brag.
            </div>
            <div style={{ marginTop: 10 }}>
              <StickerMark slug="habits" seed={42} size={90} palette={{ ink: S.ink, a: S.lemon, b: S.mint, c: S.paper, d: S.sky }} />
            </div>
          </ClusterSticky>

          {/* "you have five apps" sticky */}
          <ClusterSticky x={50} y={510} w={210} h={120} rot={3} color={S.lemon} pinColor={S.mint} pinOffsetX={148}>
            <div style={{ fontFamily: hand, fontSize: 26, lineHeight: 1.1 }}>
              you have{' '}
              <span style={{ textDecoration: 'underline wavy', textDecorationColor: S.coral }}>five</span>{' '}
              apps.<br />add one. drop one.
            </div>
          </ClusterSticky>

          {/* Scribble arrow SVG */}
          <svg
            width="240" height="160"
            style={{ position: 'absolute', left: 280, top: 170, pointerEvents: 'none', zIndex: 2 }}
          >
            <path
              d="M10,30 C60,10 110,40 120,90 C130,140 60,150 30,130"
              fill="none" stroke={S.inkSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            />
            <path d="M28,124 l4,12 l8,-8 z" fill={S.inkSoft} />
          </svg>
          <span style={{
            position: 'absolute', left: 298, top: 202,
            fontFamily: hand, fontSize: 20, color: S.inkSoft,
            transform: 'rotate(-6deg)', pointerEvents: 'none', zIndex: 2,
          }}>
            everything here<br />is moveable →
          </span>
        </div>
      </section>

      {/* ── App grid (all functionality preserved) ── */}
      <section id="apps" style={{ maxWidth: 1020, margin: '0 auto', padding: '20px 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 52, justifyContent: 'center' }}>
          <div style={{ height: 1, flex: 1, background: `rgba(34,26,22,0.1)` }} />
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: S.inkSoft, opacity: 0.45 }}>the apps</span>
          <div style={{ height: 1, flex: 1, background: `rgba(34,26,22,0.1)` }} />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 36,
        }}>
          {apps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </section>

      {/* ── About / footer ── */}
      <footer id="about" style={{
        borderTop: `1.5px solid rgba(34,26,22,0.1)`,
        padding: '32px 24px',
        textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.55, margin: 0 }}>
          moducore — built for you, by you.
        </p>
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', color: S.inkSoft, opacity: 0.35, marginTop: 8 }}>
          SELF-HOSTED · OPEN SOURCE · NO TRACKING
        </p>
      </footer>
    </div>
  )
}
