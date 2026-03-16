import { useState, useEffect } from 'react'
import { createSpotifyApi } from '@moducore/spotify'
import type { SpotifyStatus } from '@moducore/spotify'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function SpotifyConnectPage() {
  const api = createSpotifyApi(API_URL)

  const [status, setStatus] = useState<SpotifyStatus | null>(null)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function loadStatus() {
    try {
      const s = await api.status()
      setStatus(s)
    } catch {
      // ignore
    }
  }

  useEffect(() => { loadStatus() }, [])

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await api.saveCredentials({ clientId, clientSecret })
      setSaved(true)
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Spotify? This will clear your tokens but keep your credentials.')) return
    setIsDisconnecting(true)
    try {
      await api.disconnect()
      await loadStatus()
    } catch {
      // ignore
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (!status) {
    return <div style={wrap}><p style={muted}>Loading…</p></div>
  }

  return (
    <div style={wrap}>
      <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Music Journal</h1>
      <p style={{ margin: '0 0 32px', color: '#666' }}>Connect your Spotify account to visualise your listening history.</p>

      {/* Credentials section */}
      <section style={section}>
        <h2 style={sectionHeading}>Spotify App Credentials</h2>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>
          Create a Spotify developer app at{' '}
          <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#1DB954' }}>
            developer.spotify.com/dashboard
          </a>
          {' '}and paste your Client ID and Client Secret below. Set the redirect URI to{' '}
          <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
            {API_URL}/spotify/callback
          </code>
        </p>

        {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
        {saved && <p style={{ color: '#16a34a', marginBottom: 12 }}>Credentials saved.</p>}

        <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            Client ID
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder={status.configured ? '(already saved)' : 'Paste your Client ID'}
              required={!status.configured}
              style={inputStyle}
            />
          </label>
          <label>
            Client Secret
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={status.configured ? '(already saved)' : 'Paste your Client Secret'}
              required={!status.configured}
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={isSaving} style={btnPrimary}>
            {isSaving ? 'Saving…' : 'Save credentials'}
          </button>
        </form>
      </section>

      {/* OAuth connection section */}
      {status.configured && (
        <section style={section}>
          <h2 style={sectionHeading}>Account Connection</h2>
          {status.connected ? (
            <div>
              <p style={{ color: '#16a34a', marginBottom: 16 }}>
                Connected as <strong>{status.spotifyDisplayName}</strong>
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href="/" style={btnGreen}>Open Dashboard</a>
                <button onClick={handleDisconnect} disabled={isDisconnecting} style={btnOutline}>
                  {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px' }}>
                Click below to authorise moducore to read your Spotify listening data.
              </p>
              <a href={`${API_URL}/spotify/connect`} style={btnGreen}>
                Connect Spotify Account →
              </a>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

const wrap: React.CSSProperties = { maxWidth: 560, margin: '60px auto', padding: '0 24px' }
const section: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 24,
  marginBottom: 20,
}
const sectionHeading: React.CSSProperties = { margin: '0 0 12px', fontSize: 18 }
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
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  background: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  fontSize: 14,
  cursor: 'pointer',
  alignSelf: 'flex-start',
}
const btnGreen: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 20px',
  background: '#1DB954',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  fontSize: 14,
  cursor: 'pointer',
  textDecoration: 'none',
  fontWeight: 600,
}
const btnOutline: React.CSSProperties = {
  padding: '10px 20px',
  background: 'transparent',
  color: '#555',
  border: '1px solid #d1d5db',
  borderRadius: 4,
  fontSize: 14,
  cursor: 'pointer',
}
const muted: React.CSSProperties = { color: '#888', fontSize: 14 }
