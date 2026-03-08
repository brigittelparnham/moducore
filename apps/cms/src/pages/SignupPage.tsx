import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { SignupInput } from '@moducore/core'

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

  // Auto-generate slug from workspace name
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
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 8 }}>Create your workspace</h1>
      <p style={{ marginBottom: 24, color: '#666' }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>

      {error && (
        <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          Your name
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            required
            style={inputStyle}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            style={inputStyle}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={8}
            style={inputStyle}
          />
        </label>
        <label>
          Workspace name
          <input
            type="text"
            value={form.tenantName}
            onChange={handleTenantNameChange}
            required
            style={inputStyle}
          />
        </label>
        <label>
          Workspace URL slug
          <input
            type="text"
            value={form.tenantSlug}
            onChange={set('tenantSlug')}
            required
            pattern="[a-z0-9-]+"
            style={inputStyle}
          />
          <small style={{ color: '#666' }}>{form.tenantSlug}.moducore.com</small>
        </label>

        <button type="submit" disabled={isSubmitting} style={buttonStyle}>
          {isSubmitting ? 'Creating workspace…' : 'Create workspace'}
        </button>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  marginTop: 4,
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  background: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  fontSize: 14,
  cursor: 'pointer',
  marginTop: 8,
}
