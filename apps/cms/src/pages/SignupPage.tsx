import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { SignupInput } from '@moducore/core'
import { StickerMark } from '@moducore/ui'

const S = {
  paper: '#efe6d4',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
}

export function SignupPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [form, setForm] = useState<SignupInput>({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    tenantSlug: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const set = (field: keyof SignupInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleTenantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setForm((prev) => ({
      ...prev,
      tenantName: name,
      tenantSlug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await api.auth.signup(form)
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
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.25em', opacity: 0.55 }}>
          MODUCORE · WORKSPACE
        </span>
      </div>

      <div style={card}>
        <div style={tape} />

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <StickerMark slug="cms" seed={7} size={72} palette={{ ink: S.ink, a: S.coral, b: S.mint, c: '#ffd86b', d: '#9aa8ff' }} />
          </div>
          <h1 style={{ fontFamily: "'Caveat', 'Patrick Hand', cursive", fontSize: 42, lineHeight: 1, margin: '0 0 4px', color: S.ink }}>
            join the <span style={{ color: S.coral }}>studio.</span>
          </h1>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: S.inkSoft, margin: 0, opacity: 0.7 }}>
            create your moducore account
          </p>
        </div>

        {error && (
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, padding: '10px 14px', borderRadius: 3, border: `1.5px solid ${S.coral}`, background: `${S.coral}22`, color: S.ink, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>your name</label>
          <input type="text" value={form.name} onChange={set('name')} required autoFocus placeholder="Jane Smith" style={inputStyle} />

          <label style={{ ...labelStyle, marginTop: 10 }}>email</label>
          <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" style={inputStyle} />

          <label style={{ ...labelStyle, marginTop: 10 }}>password</label>
          <input type="password" value={form.password} onChange={set('password')} required minLength={8} placeholder="at least 8 characters" style={inputStyle} />

          <label style={{ ...labelStyle, marginTop: 10 }}>workspace name</label>
          <input type="text" value={form.tenantName} onChange={handleTenantNameChange} required placeholder="My workspace" style={inputStyle} />

          <label style={{ ...labelStyle, marginTop: 10 }}>workspace slug</label>
          <input
            type="text"
            value={form.tenantSlug}
            onChange={set('tenantSlug')}
            required
            pattern="[-a-z0-9]+"
            placeholder="my-workspace"
            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
          />
          {form.tenantSlug && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.1em', color: S.inkSoft, opacity: 0.5, marginTop: 4 }}>
              {form.tenantSlug}.moducore.com
            </div>
          )}

          <button type="submit" disabled={isSubmitting} style={submitBtn(isSubmitting)}>
            {isSubmitting ? 'creating workspace…' : 'create workspace →'}
          </button>
        </form>

        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: S.inkSoft, textAlign: 'center', marginTop: 16, opacity: 0.6 }}>
          have an account?{' '}
          <Link to="/login" style={{ color: S.coral, textDecoration: 'none', fontFamily: "'Caveat', cursive", fontSize: 16 }}>sign in →</Link>
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
  padding: '40px 16px',
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
  maxWidth: 400,
  width: '100%',
  transform: 'rotate(-0.5deg)',
  zIndex: 1,
}
const tape: React.CSSProperties = {
  position: 'absolute',
  top: -9,
  left: '50%',
  transform: 'translateX(-50%) rotate(-2deg)',
  width: 80,
  height: 18,
  background: 'rgba(255,216,107,0.7)',
  mixBlendMode: 'multiply',
  boxShadow: 'inset 0 0 8px rgba(0,0,0,0.06)',
  borderLeft: '1px dashed rgba(0,0,0,0.08)',
  borderRight: '1px dashed rgba(0,0,0,0.08)',
}
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
  marginTop: 18,
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
