import { useState } from 'react'

type Props = {
  appName: string
  appIcon: string
  accentColor: string
  apiBase: string
  appSlug?: string
  onLogin: () => void
}

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 14,
    border: '1px solid #d1d5db', borderRadius: 8, outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5,
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fafafa', padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* App icon + name */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: `${accentColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 12px',
          }}>
            {appIcon}
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>{appName}</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
            {mode === 'login' ? 'Sign in to your moducore account' : 'Create your moducore account'}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3, marginBottom: 20 }}>
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '7px 0', fontSize: 13, fontWeight: 600, border: 'none',
                borderRadius: 6, cursor: 'pointer',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#111' : '#6b7280',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {error && (
          <p style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16,
          }}>{error}</p>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoFocus placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required placeholder="••••••••" style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '10px 16px', fontSize: 14, fontWeight: 600, marginTop: 4,
              background: loading ? '#9ca3af' : accentColor,
              color: '#fff', border: 'none', borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Your name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                required autoFocus placeholder="Jane Smith" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required placeholder="At least 8 characters" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Workspace name</label>
              <input type="text" value={workspaceName} onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                required placeholder="My workspace" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Workspace slug</label>
              <input type="text" value={workspaceSlug}
                onChange={(e) => { setWorkspaceSlug(e.target.value); setSlugTouched(true) }}
                required placeholder="my-workspace"
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 13 }} />
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '10px 16px', fontSize: 14, fontWeight: 600, marginTop: 4,
              background: loading ? '#9ca3af' : accentColor,
              color: '#fff', border: 'none', borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Creating account…' : `Create account & start ${appName}`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
