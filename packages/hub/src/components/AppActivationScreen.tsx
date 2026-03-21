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
        throw new Error((data as { error?: string }).error ?? 'Failed to activate')
      }
      onActivated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fafafa', padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 16px',
        }}>
          {appIcon}
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>{appName}</h1>
        <p style={{ margin: '0 0 24px', fontSize: 15, color: '#374151', lineHeight: 1.5 }}>
          You're signed in as <strong>{userName}</strong>.<br />
          Add {appName} to your moducore account to get started.
        </p>

        {error && (
          <p style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16,
          }}>{error}</p>
        )}

        <button
          onClick={handleActivate}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 16px', fontSize: 15, fontWeight: 600,
            background: loading ? '#9ca3af' : accentColor,
            color: '#fff', border: 'none', borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12,
          }}
        >
          {loading ? 'Adding…' : `Add ${appName} to my account`}
        </button>

        <button
          onClick={onSwitchAccount}
          style={{
            width: '100%', padding: '10px 16px', fontSize: 14,
            background: 'transparent', color: '#6b7280',
            border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer',
          }}
        >
          Use a different account
        </button>
      </div>
    </div>
  )
}
