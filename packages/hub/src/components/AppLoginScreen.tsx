import { useState } from 'react'

type Props = {
  appName: string
  appIcon: string
  accentColor: string
  apiBase: string
  appSlug?: string
  onLogin: () => void
}

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export function AppLoginScreen({ appName, appIcon, accentColor, apiBase, appSlug, onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleWorkspaceNameChange = (val: string) => {
    setWorkspaceName(val)
    if (!slugTouched) setWorkspaceSlug(slugify(val))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Invalid credentials')
      }
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          password,
          tenantName: workspaceName,
          tenantSlug: workspaceSlug,
          ...(appSlug ? { appSlug } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Sign up failed')
      }
      onLogin()
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

      {/* top bar */}
      <div style={topBar}>
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.55 }}>
          MODUCORE · {appName.toUpperCase()}
        </span>
      </div>

      <div style={card}>
        {/* tape strip */}
        <div style={tape} />

        {/* icon + title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 42, marginBottom: 6 }}>{appIcon}</div>
          <h1 style={{ fontFamily: hand, fontSize: 44, lineHeight: 1, margin: '0 0 4px', color: S.ink }}>
            {mode === 'login' ? <>sign <span style={{ color: accentColor }}>in.</span></> : <>join the <span style={{ color: accentColor }}>studio.</span></>}
          </h1>
          <p style={{ fontFamily: body, fontSize: 13, color: S.inkSoft, margin: 0 }}>
            {mode === 'login' ? 'your moducore account' : 'create your moducore account'}
          </p>
        </div>

        {/* mode toggle */}
        <div style={modeToggle}>
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={modeBtn(mode === m)}
            >
              {m === 'login' ? 'sign in' : 'create account'}
            </button>
          ))}
        </div>

        {error && (
          <div style={errorBox}>{error}</div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={formStack}>
            <label style={label}>email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoFocus placeholder="you@example.com" style={input} />
            <label style={label}>password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required placeholder="••••••••" style={input} />
            <button type="submit" disabled={loading} style={submitBtn(loading)}>
              {loading ? 'signing in…' : 'sign in →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} style={formStack}>
            <label style={label}>your name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              required autoFocus placeholder="Jane Smith" style={input} />
            <label style={label}>email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder="you@example.com" style={input} />
            <label style={label}>password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required placeholder="at least 8 characters" style={input} />
            <label style={label}>workspace name</label>
            <input type="text" value={workspaceName} onChange={(e) => handleWorkspaceNameChange(e.target.value)}
              required placeholder="My workspace" style={input} />
            <label style={label}>workspace slug</label>
            <input type="text" value={workspaceSlug}
              onChange={(e) => { setWorkspaceSlug(e.target.value); setSlugTouched(true) }}
              required placeholder="my-workspace"
              style={{ ...input, fontFamily: mono, fontSize: 13 }} />
            <button type="submit" disabled={loading} style={submitBtn(loading)}>
              {loading ? 'creating account…' : `create account →`}
            </button>
          </form>
        )}

        <div style={{ fontFamily: hand, fontSize: 18, color: S.inkSoft, textAlign: 'center', marginTop: 12, opacity: 0.6 }}>
          ← built for you, run by you
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
  maxWidth: 400,
  width: '100%',
  transform: 'rotate(-0.6deg)',
  zIndex: 1,
}
const tape: React.CSSProperties = {
  position: 'absolute',
  top: -9,
  left: '50%',
  transform: 'translateX(-50%) rotate(-3deg)',
  width: 80,
  height: 18,
  background: 'rgba(255,216,107,0.7)',
  mixBlendMode: 'multiply',
  boxShadow: 'inset 0 0 8px rgba(0,0,0,0.06)',
  borderLeft: '1px dashed rgba(0,0,0,0.08)',
  borderRight: '1px dashed rgba(0,0,0,0.08)',
}
const modeToggle: React.CSSProperties = {
  display: 'flex',
  background: S.paperD,
  borderRadius: 999,
  padding: 3,
  marginBottom: 18,
}
const modeBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '7px 0',
  fontFamily: body,
  fontSize: 13,
  fontWeight: 600,
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  background: active ? S.ink : 'transparent',
  color: active ? S.paper : S.inkSoft,
  transition: 'background 0.15s',
})
const errorBox: React.CSSProperties = {
  background: `rgba(255,138,91,0.15)`,
  border: `1.5px solid #ff8a5b`,
  color: S.ink,
  borderRadius: 4,
  padding: '10px 14px',
  fontFamily: body,
  fontSize: 13,
  marginBottom: 14,
}
const formStack: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}
const label: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: '0.2em',
  color: S.inkSoft,
  textTransform: 'uppercase' as const,
  marginTop: 8,
  marginBottom: 2,
  display: 'block',
  opacity: 0.7,
}
const input: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 14,
  border: `1.5px solid rgba(34,26,22,0.2)`,
  borderRadius: 4,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: body,
  background: S.paper,
  color: S.ink,
}
const submitBtn = (loading: boolean): React.CSSProperties => ({
  marginTop: 14,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 600,
  background: loading ? S.inkSoft : S.ink,
  color: S.paper,
  border: 'none',
  borderRadius: 999,
  cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: body,
  letterSpacing: '-0.01em',
})
