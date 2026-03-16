import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await api.auth.forgotPassword({ email })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 8 }}>Reset password</h1>

      {submitted ? (
        <>
          <p style={{ color: '#444', lineHeight: 1.5 }}>
            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
          </p>
          <p style={{ marginTop: 16 }}>
            <Link to="/login">Back to log in</Link>
          </p>
        </>
      ) : (
        <>
          <p style={{ marginBottom: 24, color: '#666' }}>
            Enter your email and we'll send you a reset link.
          </p>

          {error && <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </label>
            <button type="submit" disabled={isSubmitting} style={buttonStyle}>
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p style={{ marginTop: 16, fontSize: 14 }}>
            <Link to="/login">Back to log in</Link>
          </p>
        </>
      )}
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
