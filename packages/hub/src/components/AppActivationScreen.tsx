import { useState } from 'react'

type Props = {
  appName: string
  appIcon: string
  accentColor: string
  apiBase: string
  appSlug: string
  userName: string
  onActivated: () => void
  onSwitchAccount: () => void
}

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
  sky: '#9aa8ff',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

export function AppActivationScreen({
  appName, appIcon, accentColor, apiBase, appSlug, userName, onActivated, onSwitchAccount,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleActivate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiBase}/apps/${appSlug}/install`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: { message?: string } }).error?.message ?? 'Failed to activate')
      }
      onActivated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={page}>
      {/* dot grid */}
      <div style={dotGrid} />

      {/* top nav */}
      <div style={topBar}>
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.55 }}>
          MODUCORE · {appName.toUpperCase()}
        </span>
      </div>

      {/* central card */}
      <div style={card}>
        {/* tape strip at top */}
        <div style={tape} />

        {/* app icon */}
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 6 }}>{appIcon}</div>

        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', textAlign: 'center', opacity: 0.55, marginBottom: 6, textTransform: 'uppercase' as const }}>
          {appName}
        </div>

        <h1 style={{ fontFamily: hand, fontSize: 52, lineHeight: 0.95, letterSpacing: '-0.01em', textAlign: 'center', margin: '0 0 6px', color: S.ink }}>
          add this<br />
          <span style={{ color: S.coral }}>app</span> to your<br />
          <span style={{ color: accentColor !== '#000' && accentColor !== '#1a1a1a' ? accentColor : S.mint }}>board.</span>
        </h1>

        <p style={{ fontFamily: body, fontSize: 14, lineHeight: 1.6, textAlign: 'center', color: S.inkSoft, margin: '10px 0 20px', maxWidth: 280, alignSelf: 'center' }}>
          Signed in as <strong style={{ fontFamily: hand, fontSize: 18 }}>{userName}</strong>.<br />
          One tap to add {appName} to your moducore account.
        </p>

        {error && (
          <div style={errorBox}>{error}</div>
        )}

        <button
          onClick={handleActivate}
          disabled={loading}
          style={primaryBtn(loading)}
        >
          {loading ? 'adding…' : `add ${appName} →`}
        </button>

        <button onClick={onSwitchAccount} style={secondaryBtn}>
          use a different account
        </button>

        {/* hand annotation */}
        <div style={{ fontFamily: hand, fontSize: 18, color: S.inkSoft, textAlign: 'center', marginTop: 14, opacity: 0.6 }}>
          ← no extra setup needed
        </div>
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: S.paper,
  padding: '0 16px',
  position: 'relative',
  fontFamily: body,
}
const dotGrid: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: `radial-gradient(${S.inkSoft}22 1px, transparent 1px)`,
  backgroundSize: '18px 18px',
  opacity: 0.35,
  zIndex: 0,
}
const topBar: React.CSSProperties = {
  position: 'fixed',
  top: 18,
  left: 24,
  right: 24,
  display: 'flex',
  justifyContent: 'space-between',
  zIndex: 10,
}
const card: React.CSSProperties = {
  position: 'relative',
  background: '#fff',
  boxShadow: '0 22px 44px rgba(0,0,0,0.14), 0 4px 8px rgba(0,0,0,0.08)',
  padding: '36px 32px 28px',
  maxWidth: 360,
  width: '100%',
  transform: 'rotate(-0.8deg)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1,
}
const tape: React.CSSProperties = {
  position: 'absolute',
  top: -9,
  left: '50%',
  transform: 'translateX(-50%) rotate(-4deg)',
  width: 80,
  height: 18,
  background: 'rgba(255,216,107,0.7)',
  mixBlendMode: 'multiply',
  boxShadow: 'inset 0 0 8px rgba(0,0,0,0.06)',
  borderLeft: '1px dashed rgba(0,0,0,0.08)',
  borderRight: '1px dashed rgba(0,0,0,0.08)',
}
const errorBox: React.CSSProperties = {
  background: `${S.coral}22`,
  border: `1.5px solid ${S.coral}`,
  color: S.ink,
  borderRadius: 4,
  padding: '10px 14px',
  fontFamily: body,
  fontSize: 13,
  marginBottom: 14,
}
const primaryBtn = (loading: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '13px 16px',
  fontSize: 15,
  fontWeight: 600,
  background: loading ? S.inkSoft : S.ink,
  color: S.paper,
  border: 'none',
  borderRadius: 999,
  cursor: loading ? 'not-allowed' : 'pointer',
  marginBottom: 10,
  fontFamily: body,
  letterSpacing: '-0.01em',
})
const secondaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '11px 16px',
  fontSize: 13,
  background: 'transparent',
  color: S.inkSoft,
  border: `1.5px solid rgba(34,26,22,0.2)`,
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: body,
}
