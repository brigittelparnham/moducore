const CMS_URL = import.meta.env.VITE_CMS_URL ?? 'http://localhost:3001'
const JOURNAL_URL = import.meta.env.VITE_JOURNAL_URL ?? 'http://localhost:3002'
const SPOTIFY_URL = import.meta.env.VITE_SPOTIFY_URL ?? 'http://localhost:3003'
const MAPS_URL = import.meta.env.VITE_MAPS_URL ?? 'http://localhost:3004'
const HABITS_URL = import.meta.env.VITE_HABITS_URL ?? 'http://localhost:3005'

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
  sky: '#9aa8ff',
  rose: '#ff9bb8',
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
  icon: string
  tapeAngle: number
  rotate: number
}

const apps: App[] = [
  {
    slug: 'cms',
    name: 'moducore',
    tagline: 'your workspace',
    description: 'Create pages, manage your site, connect apps, and control everything from one place. Your home base.',
    url: CMS_URL,
    accent: S.ink,
    icon: '⬡',
    tapeAngle: -3,
    rotate: -0.6,
  },
  {
    slug: 'journal',
    name: 'journal',
    tagline: 'write every day',
    description: 'A private writing space. Rich text, tags, and a streak to keep you going.',
    url: JOURNAL_URL,
    accent: S.lemon,
    icon: '✦',
    tapeAngle: 2,
    rotate: 0.8,
  },
  {
    slug: 'spotify',
    name: 'music',
    tagline: 'your listening life',
    description: 'Connect Spotify to see what you\'ve been listening to — top tracks, artists, and era breakdowns.',
    url: SPOTIFY_URL,
    accent: S.coral,
    icon: '♫',
    tapeAngle: -4,
    rotate: -1.1,
  },
  {
    slug: 'maps',
    name: 'travel',
    tagline: 'every journey, remembered',
    description: 'Track where you go with OwnTracks. Auto-detect journeys, commute intelligence, and TfL at a glance.',
    url: MAPS_URL,
    accent: S.sky,
    icon: '◎',
    tapeAngle: 3,
    rotate: 0.5,
  },
  {
    slug: 'habits',
    name: 'lifestyle',
    tagline: 'build better habits',
    description: 'Track habits, set limits, earn rewards. Finance tracking with auto-categorisation and Starling sync.',
    url: HABITS_URL,
    accent: S.mint,
    icon: '◈',
    tapeAngle: -2,
    rotate: -0.9,
  },
]

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
        top: -10,
        left: '50%',
        transform: `translateX(-50%) rotate(${app.tapeAngle}deg)`,
        width: 72,
        height: 18,
        background: `${app.accent}bb`,
        mixBlendMode: 'multiply',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.06)',
        borderLeft: '1px dashed rgba(0,0,0,0.1)',
        borderRight: '1px dashed rgba(0,0,0,0.1)',
      }} />

      <div style={{ fontFamily: mono, fontSize: 22, color: app.accent, marginBottom: 12, lineHeight: 1 }}>
        {app.icon}
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

export function App() {
  return (
    <div style={{ minHeight: '100vh', background: S.paper, fontFamily: body, position: 'relative' }}>
      {/* dot grid */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `radial-gradient(${S.inkSoft}22 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
        opacity: 0.35,
        zIndex: 0,
      }} />

      {/* Nav */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: `${S.paperD}ee`,
        backdropFilter: 'blur(8px)',
        borderBottom: `1.5px solid rgba(34,26,22,0.12)`,
        padding: '0 24px',
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
      }}>
        <span style={{ fontFamily: hand, fontSize: 24, color: S.ink, letterSpacing: '-0.01em' }}>moducore</span>
        <a
          href={CMS_URL}
          style={{
            fontFamily: body,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            background: S.ink,
            color: S.paper,
            padding: '7px 18px',
            borderRadius: 999,
            letterSpacing: '-0.01em',
          }}
        >
          sign in →
        </a>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px 64px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: S.inkSoft, opacity: 0.5, marginBottom: 20 }}>
          your personal OS
        </div>
        <h1 style={{ fontFamily: body, fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: S.ink, margin: '0 0 16px' }}>
          everything about your life,{' '}
          <span style={{ fontFamily: hand, color: S.coral, fontSize: 'clamp(40px, 7vw, 64px)' }}>beautifully</span>{' '}
          connected.
        </h1>
        <p style={{ fontFamily: body, fontSize: 16, color: S.inkSoft, lineHeight: 1.7, margin: '0 auto 36px', maxWidth: 520, opacity: 0.75 }}>
          moducore is a suite of personal apps that work alone and together —
          journaling, music, travel, habits, and your own website, all in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={`${CMS_URL}/signup`}
            style={{
              fontFamily: body,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              background: S.ink,
              color: S.paper,
              padding: '13px 28px',
              borderRadius: 999,
              letterSpacing: '-0.01em',
            }}
          >
            start for free →
          </a>
          <a
            href={CMS_URL}
            style={{
              fontFamily: body,
              fontSize: 15,
              textDecoration: 'none',
              background: 'transparent',
              color: S.inkSoft,
              padding: '13px 28px',
              borderRadius: 999,
              border: `1.5px solid rgba(34,26,22,0.2)`,
            }}
          >
            sign in
          </a>
        </div>
      </section>

      {/* App grid */}
      <section style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: S.inkSoft, opacity: 0.45, textAlign: 'center', marginBottom: 48 }}>
          the apps
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 32,
        }}>
          {apps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1.5px solid rgba(34,26,22,0.1)`,
        padding: '20px 24px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{ fontFamily: hand, fontSize: 18, color: S.inkSoft, opacity: 0.5 }}>moducore — built for you</span>
      </footer>
    </div>
  )
}
