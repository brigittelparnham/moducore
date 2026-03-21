import { useEffect, useState } from 'react'
import { api, type AvailableApp, type EmbedToken, type ConnectorRow, type Tenant, type SpotifyStatus } from '../lib/api'
import { HubSettings } from '@moducore/hub'

const SPOTIFY_APP_URL = import.meta.env.VITE_SPOTIFY_URL ?? 'http://localhost:3003'
const API_URL_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function SettingsPage() {
  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px' }}>
      <h2 style={{ margin: '0 0 32px' }}>Settings</h2>

      <WorkspaceSection />
      <div style={{ marginTop: 48 }}>
        <AppsSection />
      </div>
      <SpotifySection />
      <MapsSection />
      <HabitsSection />
      <div style={{ marginTop: 48 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Connected Apps</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
          Configure the URLs for each moducore app. These power the app switcher and the day context panel in your journal entries.
        </p>
        <HubSettings />
      </div>
      <div style={{ marginTop: 48 }}>
        <EmbedTokensSection />
      </div>
      <div style={{ marginTop: 48 }}>
        <ConnectorsSection />
      </div>
    </div>
  )
}

// ─── Workspace ────────────────────────────────────────────────────────────────

function WorkspaceSection() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.tenants
      .getCurrent()
      .then((data) => {
        setTenant(data.tenant)
        setName(data.tenant.name)
        setSlug(data.tenant.slug)
      })
      .catch(() => setError('Failed to load workspace settings'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    setIsSaving(true)
    setError('')
    setSuccess(false)
    try {
      const updated = await api.tenants.updateCurrent({
        ...(name !== tenant.name && { name }),
        ...(slug !== tenant.slug && { slug }),
      })
      setTenant(updated.tenant)
      setName(updated.tenant.name)
      setSlug(updated.tenant.slug)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section>
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: '#888',
        }}
      >
        Workspace
      </h3>

      {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Workspace name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 14,
              border: '1px solid #ccc',
              borderRadius: 4,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Workspace slug
          </label>
          <div style={{ position: 'relative' }}>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              required
              minLength={2}
              maxLength={30}
              pattern="[a-z0-9-]+"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 14,
                border: '1px solid #ccc',
                borderRadius: 4,
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            Used in public page URLs: /p/{slug}/your-page
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            disabled={isSaving || !tenant || (name === tenant.name && slug === tenant.slug)}
            style={{
              padding: '8px 20px',
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              opacity: isSaving || !tenant || (name === tenant?.name && slug === tenant?.slug) ? 0.5 : 1,
            }}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
          {success && <span style={{ fontSize: 13, color: '#16a34a' }}>Saved!</span>}
        </div>
      </form>
    </section>
  )
}

// ─── Spotify ─────────────────────────────────────────────────────────────────

function SpotifySection() {
  const [installed, setInstalled] = useState(false)
  const [status, setStatus] = useState<SpotifyStatus | null>(null)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [redirectUri, setRedirectUri] = useState('')
  const [showCredentialForm, setShowCredentialForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.apps.list().then((d) => {
      const app = d.apps.find((a) => a.slug === 'spotify')
      if (app?.installed) {
        setInstalled(true)
        api.spotify.status().then(setStatus).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  if (!installed) return null

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await api.spotify.saveCredentials({ clientId, clientSecret, redirectUri: redirectUri.trim() || undefined })
      setSaved(true)
      setClientId('')
      setClientSecret('')
      setRedirectUri('')
      setShowCredentialForm(false)
      const s = await api.spotify.status()
      setStatus(s)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Spotify? Tokens will be cleared.')) return
    setIsDisconnecting(true)
    try {
      await api.spotify.disconnect()
      const s = await api.spotify.status()
      setStatus(s)
    } catch {
      // ignore
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await api.spotify.sync()
      const s = await api.spotify.status()
      setStatus(s)
    } catch {
      // ignore
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div style={{ marginTop: 48 }}>
      <section>
        <h3 style={sectionLabel}>Music Journal (Spotify)</h3>

        {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        {/* Credentials form — shown when not yet configured, or when editing */}
        {(!status?.configured || showCredentialForm) && (
          <div style={box}>
            {!status?.configured && (
              <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px', lineHeight: 1.5 }}>
                Connect your Spotify developer app to enable the music journal.{' '}
                <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#1DB954' }}>
                  Create an app →
                </a>
              </p>
            )}
            {saved && <p style={{ color: '#16a34a', fontSize: 13, marginBottom: 8 }}>Credentials updated.</p>}
            <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Client ID"
                required
                style={inputStyle}
              />
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Client Secret"
                required
                style={inputStyle}
              />
              <div>
                <input
                  type="url"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  placeholder={`Redirect URI (e.g. http://127.0.0.1:3000/spotify/callback)`}
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: '#999', margin: '3px 0 0' }}>
                  Must match exactly what you registered in your Spotify app dashboard. Leave blank to use the default.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={isSaving} style={btnDark}>
                  {isSaving ? 'Saving…' : 'Save credentials'}
                </button>
                {showCredentialForm && (
                  <button type="button" onClick={() => { setShowCredentialForm(false); setClientId(''); setClientSecret(''); setRedirectUri('') }} style={btnOutline}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Configured but not connected */}
        {status?.configured && !status?.connected && !showCredentialForm && (
          <div style={box}>
            <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
              Credentials saved. Connect your Spotify account to start syncing.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <a href={api.spotify.getConnectUrl()} style={btnGreen}>
                Connect Spotify →
              </a>
              <button type="button" onClick={() => setShowCredentialForm(true)} style={btnOutline}>
                Update credentials
              </button>
            </div>
          </div>
        )}

        {/* Connected */}
        {status?.connected && !showCredentialForm && (
          <div style={box}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                  Connected as {status.spotifyDisplayName}
                </span>
                {status.connectedAt && (
                  <span style={{ fontSize: 12, color: '#999', marginLeft: 10 }}>
                    since {new Date(status.connectedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <a
                href={SPOTIFY_APP_URL}
                target="_blank"
                rel="noreferrer"
                style={{ ...btnDark, textDecoration: 'none', display: 'inline-block' }}
              >
                Open Music Journal ↗
              </a>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSync} disabled={isSyncing} style={btnOutline}>
                {isSyncing ? 'Syncing…' : 'Sync now'}
              </button>
              <button type="button" onClick={() => setShowCredentialForm(true)} style={btnOutline}>
                Update credentials
              </button>
              <button onClick={handleDisconnect} disabled={isDisconnecting} style={btnDanger}>
                {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 14,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#888',
}
const box: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  padding: '14px 16px',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  fontSize: 13,
  border: '1px solid #ccc',
  borderRadius: 4,
  boxSizing: 'border-box',
}
const btnDark: React.CSSProperties = {
  padding: '7px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  alignSelf: 'flex-start',
}
const btnGreen: React.CSSProperties = {
  padding: '7px 14px',
  background: '#1DB954',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
}
const btnOutline: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: 12,
  cursor: 'pointer',
  borderRadius: 4,
  border: '1px solid #ccc',
  background: '#fff',
}
const btnDanger: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: 12,
  cursor: 'pointer',
  borderRadius: 4,
  border: '1px solid #fca5a5',
  background: '#fff',
  color: '#dc2626',
}

// ─── Apps ────────────────────────────────────────────────────────────────────

const JOURNAL_URL_KEY = 'moducore_journal_url'
const DEFAULT_JOURNAL_URL = import.meta.env.VITE_JOURNAL_URL ?? 'http://localhost:3002'

function getJournalUrl() {
  return localStorage.getItem(JOURNAL_URL_KEY) ?? DEFAULT_JOURNAL_URL
}

function AppsSection() {
  const [apps, setApps] = useState<AvailableApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [journalEntryCount, setJournalEntryCount] = useState<number | null>(null)
  const [journalUrl, setJournalUrl] = useState(getJournalUrl())
  const [journalUrlEditing, setJournalUrlEditing] = useState(false)
  const [journalUrlDraft, setJournalUrlDraft] = useState(getJournalUrl())

  const journalInstalled = apps.find((a) => a.slug === 'journal')?.installed ?? false

  useEffect(() => {
    api.apps
      .list()
      .then((data) => setApps(data.apps))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  // Fetch journal entry count when journal is installed
  useEffect(() => {
    if (!journalInstalled) return
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/journal`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d: { entries: unknown[] }) => setJournalEntryCount(d.entries?.length ?? 0))
      .catch(() => setJournalEntryCount(null))
  }, [journalInstalled])

  const toggle = async (app: AvailableApp) => {
    setBusy(app.slug)
    setError('')
    try {
      if (app.installed) {
        await api.apps.uninstall(app.slug)
      } else {
        await api.apps.install(app.slug)
      }
      setApps((prev) =>
        prev.map((a) => (a.slug === app.slug ? { ...a, installed: !a.installed } : a))
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setBusy(null)
    }
  }

  const saveJournalUrl = () => {
    const val = journalUrlDraft.trim() || DEFAULT_JOURNAL_URL
    localStorage.setItem(JOURNAL_URL_KEY, val)
    setJournalUrl(val)
    setJournalUrlEditing(false)
  }

  return (
    <section>
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: '#888',
        }}
      >
        Apps
      </h3>
      {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}
      {isLoading && <p style={{ color: '#666', fontSize: 13 }}>Loading…</p>}

      {apps.map((app) => (
        <div key={app.slug}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: app.installed && app.slug === 'journal' ? 'none' : '1px solid #eee',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{app.name}</span>
                {app.installed && (
                  <span
                    style={{
                      fontSize: 11,
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '2px 7px',
                      borderRadius: 10,
                    }}
                  >
                    installed
                  </span>
                )}
              </div>
              {app.description && (
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{app.description}</div>
              )}
            </div>
            <button
              onClick={() => toggle(app)}
              disabled={busy === app.slug}
              style={{
                padding: '6px 14px',
                cursor: 'pointer',
                borderRadius: 4,
                background: app.installed ? '#fff' : '#111',
                color: app.installed ? '#111' : '#fff',
                border: app.installed ? '1px solid #ccc' : 'none',
              }}
            >
              {busy === app.slug ? '…' : app.installed ? 'Uninstall' : 'Install'}
            </button>
          </div>

          {/* Journal-specific: connection panel when installed */}
          {app.slug === 'journal' && app.installed && (
            <div
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                padding: '14px 16px',
                marginBottom: 16,
              }}
            >
              {/* Status row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 13, color: '#555' }}>
                  {journalEntryCount !== null
                    ? `${journalEntryCount} ${journalEntryCount === 1 ? 'entry' : 'entries'} in this journal`
                    : 'Loading journal info…'}
                </div>
                <a
                  href={journalUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 13,
                    color: '#fff',
                    background: '#111',
                    padding: '5px 12px',
                    borderRadius: 4,
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Open Journal app ↗
                </a>
              </div>

              {/* First-time guidance */}
              {journalEntryCount === 0 && (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 4,
                    padding: '10px 12px',
                    fontSize: 13,
                    color: '#78350f',
                    marginBottom: 12,
                  }}
                >
                  No entries yet. Open the journal app to write your first entry — it will appear
                  here automatically.
                </div>
              )}

              {/* Journal app URL */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>
                    Journal app URL
                  </label>
                  {!journalUrlEditing && (
                    <button
                      onClick={() => {
                        setJournalUrlDraft(journalUrl)
                        setJournalUrlEditing(true)
                      }}
                      style={{
                        fontSize: 12,
                        color: '#3b82f6',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {journalUrlEditing ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={journalUrlDraft}
                      onChange={(e) => setJournalUrlDraft(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        fontSize: 13,
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                      }}
                    />
                    <button
                      onClick={saveJournalUrl}
                      style={{
                        padding: '5px 12px',
                        fontSize: 12,
                        background: '#111',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setJournalUrlEditing(false)}
                      style={{
                        padding: '5px 10px',
                        fontSize: 12,
                        background: '#fff',
                        color: '#666',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <code
                    style={{
                      fontSize: 12,
                      color: '#555',
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 4,
                      padding: '4px 8px',
                      display: 'block',
                    }}
                  >
                    {journalUrl}
                  </code>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  )
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

function MapsSection() {
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    api.apps.list()
      .then((d) => setInstalled(d.apps.some((a) => a.slug === 'maps' && a.installed)))
      .catch(() => {})
  }, [])

  if (!installed) return null

  const ingestUrl = `${API_URL_BASE}/maps/ingest?secret=YOUR_SECRET`

  return (
    <div style={{ marginTop: 48 }}>
      <h3 style={sectionHeading}>Travel</h3>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
        OwnTracks is configured to send location pings to your API. Point your OwnTracks HTTP endpoint to:
      </p>
      <div style={{
        background: '#f3f4f6',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: '10px 14px',
        fontFamily: 'monospace',
        fontSize: 13,
        wordBreak: 'break-all',
        marginBottom: 12,
      }}>
        {ingestUrl}
      </div>
      <p style={{ fontSize: 12, color: '#888' }}>
        Set <code>LOCATION_INGEST_SECRET</code> in your API environment variables and use the same value
        as the <code>secret</code> query parameter in OwnTracks settings.
      </p>
    </div>
  )
}

// ─── Habits & Lifestyle ───────────────────────────────────────────────────────

function HabitsSection() {
  const [installed, setInstalled] = useState(false)
  const [starlingAccounts, setStarlingAccounts] = useState<{ id: string; name: string; connected: boolean; lastSyncedAt: string | null }[]>([])
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.apps.list()
      .then((d) => {
        const isInstalled = d.apps.some((a) => a.slug === 'habits' && a.installed)
        setInstalled(isInstalled)
        if (isInstalled) {
          fetch(`${API_URL_BASE}/starling/status`, { credentials: 'include' })
            .then((r) => r.json())
            .then((d) => setStarlingAccounts(d.accounts ?? []))
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  if (!installed) return null

  const healthIngestUrl = `${API_URL_BASE}/habits/health-ingest?secret=YOUR_HABITS_HEALTH_SECRET`

  async function handleConnect() {
    if (!token) return
    setConnecting(true); setMsg('')
    try {
      const res = await fetch(`${API_URL_BASE}/starling/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken: token }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error ?? 'Connection failed'); return }
      setMsg(`Connected ${data.accounts?.length ?? 0} account(s). Synced ${data.synced?.[0]?.synced ?? 0} transactions.`)
      setToken('')
      const s = await fetch(`${API_URL_BASE}/starling/status`, { credentials: 'include' }).then((r) => r.json())
      setStarlingAccounts(s.accounts ?? [])
    } catch { setMsg('Connection failed') }
    finally { setConnecting(false) }
  }

  async function handleSync() {
    setSyncing(true); setMsg('')
    try {
      const res = await fetch(`${API_URL_BASE}/starling/sync`, { method: 'POST', credentials: 'include' })
      const data = await res.json()
      const total = (data.synced ?? []).reduce((s: number, a: { synced: number }) => s + a.synced, 0)
      setMsg(`Synced ${total} new transaction(s).`)
      const s = await fetch(`${API_URL_BASE}/starling/status`, { credentials: 'include' }).then((r) => r.json())
      setStarlingAccounts(s.accounts ?? [])
    } catch { setMsg('Sync failed') }
    finally { setSyncing(false) }
  }

  return (
    <div style={{ marginTop: 48 }}>
      <h3 style={sectionHeading}>Lifestyle — Habits & Finance</h3>

      {/* Starling */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Starling Bank</p>
        {starlingAccounts.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            {starlingAccounts.map((a) => (
              <div key={a.id} style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                ✓ {a.name} — {a.connected ? `connected${a.lastSyncedAt ? `, last synced ${new Date(a.lastSyncedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}` : 'token missing'}
              </div>
            ))}
            <button
              onClick={handleSync}
              disabled={syncing}
              style={smallBtn}
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
              Generate a Personal Access Token at{' '}
              <a href="https://developer.starlingbank.com" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>
                developer.starlingbank.com
              </a>{' '}
              → API tokens → Create token → enable <code>account:read</code> and <code>transaction:read</code>.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste Personal Access Token…"
                style={{ flex: 1, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
              />
              <button onClick={handleConnect} disabled={connecting || !token} style={smallBtn}>
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
            </div>
          </div>
        )}
        {msg && <p style={{ fontSize: 12, color: '#555', marginTop: 8 }}>{msg}</p>}
      </div>

      {/* iPhone Steps */}
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>iPhone Step Count (Apple Health)</p>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
          Set <code>HABITS_HEALTH_SECRET</code> in your API env, then create an iOS Shortcut:
        </p>
        <ol style={{ fontSize: 13, color: '#555', paddingLeft: 20, margin: '0 0 8px' }}>
          <li>Open <strong>Shortcuts</strong> → <strong>Automation</strong> → <strong>New Automation</strong></li>
          <li>Trigger: <strong>Time of Day</strong> → 11:55pm daily</li>
          <li>Add action: <strong>Get Health Samples</strong> → Steps → Today → Sum</li>
          <li>Add action: <strong>Get Contents of URL</strong> → URL below, Method POST, Body JSON: <code>{"{"}"metric": "steps", "value": [Steps Variable]{"}"}</code></li>
        </ol>
        <div style={codeBox}>{healthIngestUrl}</div>
        <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
          Replace <code>YOUR_HABITS_HEALTH_SECRET</code> with the value you set in env. Also create a habit named "Steps" with unit "steps" in the app.
        </p>
      </div>
    </div>
  )
}

const smallBtn: React.CSSProperties = {
  padding: '7px 14px',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
}

const codeBox: React.CSSProperties = {
  background: '#f3f4f6',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  padding: '10px 14px',
  fontFamily: 'monospace',
  fontSize: 12,
  wordBreak: 'break-all',
}

const sectionHeading: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 14,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#888',
}

// ─── Embed Tokens ─────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function EmbedTokensSection() {
  const [tokens, setTokens] = useState<EmbedToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newTokenValue, setNewTokenValue] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.embedTokens
      .list()
      .then((data) => setTokens(data.tokens))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleCreated = (token: EmbedToken) => {
    setTokens((prev) => [token, ...prev])
    setNewTokenValue(token.token)
    setShowCreate(false)
    setCopied(false)
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this token? Any embeds using it will stop working.')) return
    try {
      await api.embedTokens.revoke(id)
      setTokens((prev) => prev.filter((t) => t.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to revoke')
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: '#888',
          }}
        >
          Embed Tokens
        </h3>
        <button
          onClick={() => {
            setShowCreate(true)
            setNewTokenValue(null)
          }}
          style={{
            padding: '6px 14px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          + Create Token
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 16 }}>
        Embed your content on any external site using a script tag and a token.
      </p>

      {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}

      {showCreate && (
        <CreateTokenForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
      )}

      {newTokenValue && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 6,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#166534' }}>
            Token created — copy it now, it won't be shown again.
          </p>
          <div
            style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}
          >
            <code
              style={{
                flex: 1,
                fontSize: 12,
                background: '#fff',
                padding: '6px 10px',
                borderRadius: 4,
                border: '1px solid #ccc',
                wordBreak: 'break-all',
              }}
            >
              {newTokenValue}
            </code>
            <button
              onClick={() => copyToken(newTokenValue)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 4,
                border: '1px solid #ccc',
                background: '#fff',
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <details>
            <summary style={{ fontSize: 12, color: '#166534', cursor: 'pointer' }}>
              Show embed snippets
            </summary>
            <pre
              style={{
                fontSize: 11,
                background: '#fff',
                padding: 10,
                borderRadius: 4,
                border: '1px solid #ccc',
                overflow: 'auto',
                marginTop: 8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {`<!-- Journal feed -->
<script src="${API_URL}/embed/moducore.iife.js"></script>
<journal-widget token="${newTokenValue}" api-url="${API_URL}"></journal-widget>

<!-- Single CMS page (replace "slug" with your page slug) -->
<cms-page token="${newTokenValue}" slug="home" api-url="${API_URL}"></cms-page>

<!-- All published CMS pages -->
<cms-pages token="${newTokenValue}" api-url="${API_URL}"></cms-pages>`}
            </pre>
          </details>
        </div>
      )}

      {isLoading && <p style={{ color: '#666', fontSize: 13 }}>Loading…</p>}
      {!isLoading && tokens.length === 0 && !showCreate && (
        <p style={{ fontSize: 13, color: '#aaa' }}>No embed tokens yet.</p>
      )}

      {tokens.map((token) => (
        <div
          key={token.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 0',
            borderBottom: '1px solid #eee',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{token.name}</span>
            <span style={{ marginLeft: 10, fontSize: 12, color: '#888' }}>
              {token.permissions.write ? 'read + write' : 'read-only'}
            </span>
            {token.expiresAt && (
              <span style={{ marginLeft: 10, fontSize: 12, color: '#888' }}>
                expires {new Date(token.expiresAt).toLocaleDateString()}
              </span>
            )}
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
              Created {new Date(token.createdAt).toLocaleDateString()}
            </div>
          </div>
          <button
            onClick={() => handleRevoke(token.id)}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              cursor: 'pointer',
              borderRadius: 4,
              border: '1px solid #fca5a5',
              background: '#fff',
              color: '#dc2626',
            }}
          >
            Revoke
          </button>
        </div>
      ))}
    </section>
  )
}

// ─── Connectors ──────────────────────────────────────────────────────────────

const CONNECTOR_TYPES = [
  {
    value: 'rss',
    label: 'RSS Feed',
    fields: [{ key: 'url', label: 'Feed URL', placeholder: 'https://example.com/feed.xml' }],
  },
  {
    value: 'rest',
    label: 'REST API',
    fields: [
      {
        key: 'url',
        label: 'Endpoint URL',
        placeholder: 'https://api.example.com/data',
      },
      {
        key: 'headers',
        label: 'Headers (JSON)',
        placeholder: '{"Authorization":"Bearer xxx"}',
      },
    ],
  },
]

function ConnectorsSection() {
  const [connectors, setConnectors] = useState<ConnectorRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    api.connectors
      .list()
      .then((d) => setConnectors(d.connectors))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleCreated = (connector: ConnectorRow) => {
    setConnectors((prev) => [connector, ...prev])
    setShowCreate(false)
  }

  const handleToggle = async (connector: ConnectorRow) => {
    try {
      const updated = await api.connectors.update(connector.id, { enabled: !connector.enabled })
      setConnectors((prev) =>
        prev.map((c) => (c.id === connector.id ? updated.connector : c))
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this connector and its cached data?')) return
    try {
      await api.connectors.delete(id)
      setConnectors((prev) => prev.filter((c) => c.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const handleSync = async (id: string) => {
    setSyncing(id)
    try {
      await api.connectors.sync(id)
      const data = await api.connectors.list()
      setConnectors(data.connectors)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: '#888',
          }}
        >
          Connectors
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '6px 14px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          + Add Connector
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 16 }}>
        Connect external data sources. Data syncs every 15 minutes automatically.
      </p>

      {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}

      {showCreate && (
        <CreateConnectorForm
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {isLoading && <p style={{ color: '#666', fontSize: 13 }}>Loading…</p>}
      {!isLoading && connectors.length === 0 && !showCreate && (
        <p style={{ fontSize: 13, color: '#aaa' }}>No connectors configured yet.</p>
      )}

      {connectors.map((connector) => (
        <div key={connector.id} style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{connector.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    background: '#f3f4f6',
                    color: '#555',
                    padding: '2px 7px',
                    borderRadius: 10,
                  }}
                >
                  {connector.type.toUpperCase()}
                </span>
                {!connector.enabled && (
                  <span style={{ fontSize: 11, color: '#f59e0b' }}>disabled</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>
                {connector.config.url}
              </div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                {connector.lastSyncedAt
                  ? `Last synced ${new Date(connector.lastSyncedAt).toLocaleString()}`
                  : 'Never synced'}
              </div>
            </div>
            <div
              style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}
            >
              <button
                onClick={() => handleSync(connector.id)}
                disabled={syncing === connector.id}
                style={{
                  padding: '5px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  background: '#fff',
                }}
              >
                {syncing === connector.id ? '…' : 'Sync now'}
              </button>
              <button
                onClick={() => handleToggle(connector)}
                style={{
                  padding: '5px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  background: '#fff',
                }}
              >
                {connector.enabled ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => handleDelete(connector.id)}
                style={{
                  padding: '5px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: '1px solid #fca5a5',
                  background: '#fff',
                  color: '#dc2626',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

function CreateConnectorForm({
  onCreated,
  onCancel,
}: {
  onCreated: (connector: ConnectorRow) => void
  onCancel: () => void
}) {
  const [type, setType] = useState('rss')
  const [name, setName] = useState('')
  const [config, setConfig] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const fields = CONNECTOR_TYPES.find((t) => t.value === type)?.fields ?? []

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const data = await api.connectors.create({ type, name: name.trim(), config })
      onCreated(data.connector)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
          >
            Type
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setConfig({})
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
          >
            {CONNECTOR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
          >
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Blog Feed"
            required
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              border: '1px solid #ccc',
              borderRadius: 4,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      {fields.map((field) => (
        <div key={field.key} style={{ marginBottom: 12 }}>
          <label
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
          >
            {field.label}
          </label>
          <input
            value={config[field.key] ?? ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            required={field.key === 'url'}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              border: '1px solid #ccc',
              borderRadius: 4,
              boxSizing: 'border-box',
            }}
          />
        </div>
      ))}
      {error && <p style={{ color: 'red', fontSize: 13, margin: '0 0 8px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          style={{
            padding: '7px 16px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {isSaving ? 'Adding…' : 'Add Connector'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '7px 16px',
            background: '#fff',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function CreateTokenForm({
  onCreated,
  onCancel,
}: {
  onCreated: (token: EmbedToken) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [write, setWrite] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSaving(true)
    setError('')
    try {
      const data = await api.embedTokens.create({ name: name.trim(), write })
      onCreated(data.token)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <label
          style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
        >
          Token name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Website"
          required
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: 13,
            border: '1px solid #ccc',
            borderRadius: 4,
            boxSizing: 'border-box',
          }}
        />
      </div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          marginBottom: 12,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={write}
          onChange={(e) => setWrite(e.target.checked)}
        />
        Allow write access
      </label>
      {error && <p style={{ color: 'red', fontSize: 13, margin: '0 0 8px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          style={{
            padding: '7px 16px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {isSaving ? 'Creating…' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '7px 16px',
            background: '#fff',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
