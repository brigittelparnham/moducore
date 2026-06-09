import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { LoginInput } from '@moducore/core'

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

export function LoginPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [form, setForm] = useState<LoginInput>({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const passwordReset = new URLSearchParams(window.location.search).get('reset') === '1'

  const set = (field: keyof LoginInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await api.auth.login(form)
      await refresh()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={page}>
      <div style={dotGrid} />

      <div style={topBar}>
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.55 }}>
          MODUCORE · WORKSPACE
        </span>
      </div>

      <div style={card}>
        <div style={tape} />

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⬡</div>
          <h1 style={{ fontFamily: hand, fontSize: 44, lineHeight: 1, margin: '0 0 4px', color: S.ink }}>
            sign <span style={{ color: S.coral }}>in.</span>
          </h1>
          <p style={{ fontFamily: body, fontSize: 13, color: S.inkSoft, margin: 0, opacity: 0.7 }}>
            your moducore workspace
          </p>
        </div>

        {passwordReset && (
          <div style={{ ...messageBox, background: `${S.mint}33`, borderColor: S.mint }}>
            password updated — log in with your new password.
          </div>
        )}
        {error && (
          <div style={{ ...messageBox, background: `${S.coral}22`, borderColor: S.coral }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={formStack}>
          <label style={labelStyle}>email</label>
          <input type="email" value={form.email} onChange={set('email')} required autoFocus placeholder="you@example.com" style={inputStyle} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
            <label style={labelStyle}>password</label>
            <Link to="/forgot-password" style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', color: S.inkSoft, opacity: 0.55, textDecoration: 'none' }}>
              forgot?
            </Link>
          </div>
          <input type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" style={inputStyle} />

          <button type="submit" disabled={isSubmitting} style={submitBtn(isSubmitting)}>
            {isSubmitting ? 'signing in…' : 'sign in →'}
          </button>
        </form>

        <div style={{ fontFamily: hand, fontSize: 16, color: S.inkSoft, textAlign: 'center', marginTop: 16, opacity: 0.6 }}>
          no account?{' '}
          <Link to="/signup" style={{ color: S.coral, textDecoration: 'none', fontFamily: hand, fontSize: 16 }}>create one →</Link>
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
  background: '#efe6d4',
  padding: '0 16px',
  position: 'relative',
  fontFamily: "'Space Grotesk', 'Instrument Sans', sans-serif",
}
const dotGrid: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: `radial-gradient(rgba(34,26,22,0.13) 1px, transparent 1px)`,
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
  maxWidth: 380,
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
const messageBox: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: '10px 14px',
  borderRadius: 3,
  border: '1.5px solid',
  marginBottom: 14,
  color: '#221a16',
}
const formStack: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#3b302a',
  opacity: 0.7,
  marginBottom: 3,
  display: 'block',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 14,
  border: `1.5px solid rgba(34,26,22,0.2)`,
  borderRadius: 3,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'Space Grotesk', sans-serif",
  background: '#efe6d4',
  color: '#221a16',
}
const submitBtn = (loading: boolean): React.CSSProperties => ({
  marginTop: 16,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 600,
  background: loading ? 'rgba(34,26,22,0.35)' : '#221a16',
  color: '#efe6d4',
  border: 'none',
  borderRadius: 999,
  cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: "'Space Grotesk', sans-serif",
  letterSpacing: '-0.01em',
})
