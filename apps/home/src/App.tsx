const CMS_URL = import.meta.env.VITE_CMS_URL ?? 'http://localhost:3001'
const JOURNAL_URL = import.meta.env.VITE_JOURNAL_URL ?? 'http://localhost:3002'
const SPOTIFY_URL = import.meta.env.VITE_SPOTIFY_URL ?? 'http://localhost:3003'
const MAPS_URL = import.meta.env.VITE_MAPS_URL ?? 'http://localhost:3004'
const HABITS_URL = import.meta.env.VITE_HABITS_URL ?? 'http://localhost:3005'

type App = {
  slug: string
  name: string
  tagline: string
  description: string
  url: string
  accentColor: string
  icon: string
}

const apps: App[] = [
  {
    slug: 'cms',
    name: 'moducore',
    tagline: 'Your personal workspace',
    description: 'Create pages, manage your site, connect apps, and control everything from one place. Your home base.',
    url: CMS_URL,
    accentColor: '#111111',
    icon: '⬡',
  },
  {
    slug: 'journal',
    name: 'Journal',
    tagline: 'Write every day',
    description: 'A private, beautiful writing space. Rich text, moods, tags, search, and a streak to keep you going.',
    url: JOURNAL_URL,
    accentColor: '#4f46e5',
    icon: '✦',
  },
  {
    slug: 'spotify',
    name: 'Music',
    tagline: 'Your listening life',
    description: 'Connect Spotify to see what you\'ve been listening to — top tracks, artists, listening hours, and era breakdowns.',
    url: SPOTIFY_URL,
    accentColor: '#1db954',
    icon: '♫',
  },
  {
    slug: 'maps',
    name: 'Travel',
    tagline: 'Every journey, remembered',
    description: 'Track where you go with OwnTracks. Auto-detect journeys, commute intelligence, TfL status, and weather at a glance.',
    url: MAPS_URL,
    accentColor: '#0ea5e9',
    icon: '◎',
  },
  {
    slug: 'habits',
    name: 'Lifestyle',
    tagline: 'Build better habits',
    description: 'Track habits, set limits, earn rewards. Finance tracking with auto-categorisation. iPhone steps sync. All in one place.',
    url: HABITS_URL,
    accentColor: '#f59e0b',
    icon: '◈',
  },
]

function AppCard({ app }: { app: App }) {
  return (
    <a
      href={app.url}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 28px 24px',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        textDecoration: 'none',
        color: 'inherit',
        background: '#fff',
        transition: 'box-shadow 0.15s, transform 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.boxShadow = `0 8px 32px ${app.accentColor}22`
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = `${app.accentColor}44`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.boxShadow = 'none'
        el.style.transform = 'none'
        el.style.borderColor = '#e5e7eb'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span
          style={{
            fontSize: 22,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            background: `${app.accentColor}12`,
            color: app.accentColor,
            flexShrink: 0,
          }}
        >
          {app.icon}
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111', lineHeight: 1.2 }}>{app.name}</div>
          <div style={{ fontSize: 13, color: app.accentColor, fontWeight: 500, marginTop: 1 }}>{app.tagline}</div>
        </div>
      </div>
      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: '0 0 20px', flex: 1 }}>{app.description}</p>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 13,
          fontWeight: 600,
          color: app.accentColor,
        }}
      >
        Get started →
      </div>
    </a>
  )
}

export function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Nav */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(250,250,250,0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 24px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: '#111' }}>moducore</span>
        <a
          href={CMS_URL}
          style={{
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            background: '#111',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 8,
          }}
        >
          Sign in
        </a>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '80px 24px 56px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#888',
            background: '#f3f4f6',
            padding: '4px 12px',
            borderRadius: 20,
            marginBottom: 20,
          }}
        >
          Your personal OS
        </div>
        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 58px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: '#111',
            margin: '0 0 20px',
          }}
        >
          Everything about your life,<br />beautifully connected.
        </h1>
        <p style={{ fontSize: 18, color: '#555', lineHeight: 1.6, margin: '0 0 36px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          moducore is a suite of personal apps that work alone and together —
          journaling, music, travel, habits, and your own website, all in one place.
        </p>
        <a
          href={CMS_URL + '/signup'}
          style={{
            display: 'inline-block',
            background: '#111',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            padding: '13px 28px',
            borderRadius: 10,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          Start for free
        </a>
      </section>

      {/* App grid */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#aaa',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          The apps
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {apps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #e5e7eb',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: 13,
          color: '#aaa',
        }}
      >
        moducore — built for you
      </footer>
    </div>
  )
}
