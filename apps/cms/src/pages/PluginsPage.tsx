import { useEffect, useState } from 'react'
import { api, type AvailableApp, type SpotifyStatus } from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type PluginDef = {
  slug: string
  name: string
  icon: string
  color: string
  tagline: string
  description: string
  components: string[]
  appUrl: string
}

const PLUGINS: PluginDef[] = [
  {
    slug: 'journal',
    name: 'Journal',
    icon: '📓',
    color: '#f59e0b',
    tagline: 'Write & publish your story',
    description: 'A standalone authoring app for journal entries. The CMS shows a live read-only feed with links back to the Journal app for editing.',
    components: ['Journal feed', 'Entry embed', 'Entry card'],
    appUrl: import.meta.env.VITE_JOURNAL_URL ?? 'http://localhost:3002',
  },
  {
    slug: 'spotify',
    name: 'Music Journal',
    icon: '🎵',
    color: '#1DB954',
    tagline: 'What you listen to tells a story',
    description: 'Connects your Spotify account and syncs listening history, top tracks, and artists. Visualised with D3 charts.',
    components: ['Now Playing', 'Top Tracks', 'Top Artists', 'Listening Hours', 'Music Eras'],
    appUrl: import.meta.env.VITE_SPOTIFY_URL ?? 'http://localhost:3003',
  },
  {
    slug: 'maps',
    name: 'Maps & Travel',
    icon: '🗺️',
    color: '#ef4444',
    tagline: 'Where you go tells a story',
    description: 'Tracks real journeys via OwnTracks GPS. Detects trips automatically, enriches with TfL conditions and weather, and builds personalised commute intelligence.',
    components: ['Journey List', 'Journey Card (with map)', 'Commute Stats', 'Suggest Panel'],
    appUrl: import.meta.env.VITE_MAPS_URL ?? 'http://localhost:3004',
  },
  {
    slug: 'habits',
    name: 'Lifestyle',
    icon: '✨',
    color: '#8b5cf6',
    tagline: 'Habits, limits, rewards & finance',
    description: 'Track habits with daily/weekly/monthly/yearly targets, set spending limits with conditional rewards, and log transactions. Syncs with Starling Bank.',
    components: ['Lifestyle Dashboard', 'Habit Card', 'Budget Progress', 'Transaction Row', 'Points Widget'],
    appUrl: import.meta.env.VITE_HABITS_URL ?? 'http://localhost:3005',
  },
]

export function PluginsPage() {
  const [apps, setApps] = useState<AvailableApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    api.apps.list()
      .then((d) => setApps(d.apps))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const toggle = async (slug: string, installed: boolean) => {
    setBusy(slug)
    try {
      if (installed) {
        await api.apps.uninstall(slug)
      } else {
        await api.apps.install(slug)
      }
      setApps((prev) =>
        prev.map((a) => (a.slug === slug ? { ...a, installed: !a.installed } : a))
      )
    } catch {
      // ignore
    } finally {
      setBusy(null)
    }
  }

  if (isLoading) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700 }}>Plugins</h2>
      <p style={{ margin: '0 0 40px', color: '#6b7280', fontSize: 14 }}>
        Install apps and configure their CMS integration. Each plugin contributes components you can use on your pages.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        {PLUGINS.map((plugin) => {
          const appRecord = apps.find((a) => a.slug === plugin.slug)
          const installed = appRecord?.installed ?? false
          const isExpanded = expanded === plugin.slug

          return (
            <div
              key={plugin.slug}
              style={{
                border: `1px solid ${installed ? `${plugin.color}30` : '#e5e7eb'}`,
                borderRadius: 12,
                overflow: 'hidden',
                background: installed ? `${plugin.color}05` : '#fff',
              }}
            >
              {/* Card header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '20px 24px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: `${plugin.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>
                  {plugin.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{plugin.name}</span>
                    {installed && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 7px',
                        background: `${plugin.color}20`, color: plugin.color,
                        borderRadius: 10,
                      }}>
                        installed
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{plugin.tagline}</p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {installed && (
                    <>
                      <a
                        href={plugin.appUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '7px 14px', fontSize: 13, textDecoration: 'none',
                          border: '1px solid #e5e7eb', borderRadius: 6,
                          color: '#374151', background: '#fff',
                        }}
                      >
                        Open app ↗
                      </a>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : plugin.slug)}
                        style={{
                          padding: '7px 14px', fontSize: 13,
                          background: isExpanded ? '#111' : '#f9fafb',
                          color: isExpanded ? '#fff' : '#374151',
                          border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer',
                        }}
                      >
                        {isExpanded ? 'Close' : 'Configure'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggle(plugin.slug, installed)}
                    disabled={busy === plugin.slug}
                    style={{
                      padding: '7px 14px', fontSize: 13, fontWeight: 600,
                      background: installed ? '#fff' : plugin.color,
                      color: installed ? '#6b7280' : '#fff',
                      border: installed ? '1px solid #e5e7eb' : 'none',
                      borderRadius: 6, cursor: 'pointer',
                    }}
                  >
                    {busy === plugin.slug ? '…' : installed ? 'Uninstall' : 'Install'}
                  </button>
                </div>
              </div>

              {/* Expanded details: description + components + config */}
              {isExpanded && installed && (
                <div style={{
                  borderTop: `1px solid ${plugin.color}20`,
                  padding: '20px 24px',
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
                }}>
                  <div>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                      {plugin.description}
                    </p>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Components
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {plugin.components.map((c) => (
                        <span
                          key={c}
                          style={{
                            fontSize: 12, padding: '3px 10px',
                            background: `${plugin.color}12`, color: plugin.color,
                            borderRadius: 10, fontWeight: 500,
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <PluginConfigPanel slug={plugin.slug} color={plugin.color} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Per-plugin config panels ─────────────────────────────────────────────────

function PluginConfigPanel({ slug, color }: { slug: string; color: string }) {
  switch (slug) {
    case 'journal': return <JournalConfig />
    case 'spotify': return <SpotifyConfig color={color} />
    case 'maps': return <MapsConfig />
    case 'habits': return <HabitsConfig />
    default: return null
  }
}

// ─── Journal config ───────────────────────────────────────────────────────────

function JournalConfig() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/journal`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { entries: unknown[] }) => setCount(d.entries?.length ?? 0))
      .catch(() => {})
  }, [])

  return (
    <div>
      <Label>Status</Label>
      <p style={{ fontSize: 13, color: '#374151', margin: '0 0 12px' }}>
        {count === null ? 'Loading…' : `${count} journal entr${count === 1 ? 'y' : 'ies'}`}
      </p>
      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
        Journal authoring happens in the Journal app. The CMS shows a live read-only feed at <strong>/journal</strong>.
      </p>
    </div>
  )
}

// ─── Spotify config ───────────────────────────────────────────────────────────

function SpotifyConfig({ color }: { color: string }) {
  const [status, setStatus] = useState<SpotifyStatus | null>(null)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.spotify.status().then(setStatus).catch(() => {})
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.spotify.saveCredentials({ clientId, clientSecret })
      setClientId(''); setClientSecret(''); setShowForm(false)
      setStatus(await api.spotify.status())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.spotify.sync()
      setStatus(await api.spotify.status())
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Spotify? Tokens will be cleared.')) return
    await api.spotify.disconnect()
    setStatus(await api.spotify.status())
  }

  return (
    <div>
      {error && <p style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{error}</p>}

      {status?.configured ? (
        <div>
          <Label>Connection</Label>
          <p style={{ fontSize: 13, color: '#374151', margin: '0 0 10px' }}>
            {status.connected
              ? `✓ Connected as ${status.spotifyDisplayName}`
              : 'Credentials saved — not yet authorised'}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!status.connected && (
              <a
                href={`${API_URL}/spotify/connect`}
                style={{ ...btnStyle(color), textDecoration: 'none', display: 'inline-block' }}
              >
                Connect Spotify
              </a>
            )}
            {status.connected && (
              <button onClick={handleSync} disabled={syncing} style={btnStyle('#374151')}>
                {syncing ? 'Syncing…' : 'Sync now'}
              </button>
            )}
            <button onClick={handleDisconnect} style={btnStyle('#6b7280')}>Disconnect</button>
            <button onClick={() => setShowForm(!showForm)} style={outlineBtn}>Edit credentials</button>
          </div>
        </div>
      ) : (
        <div>
          <Label>Credentials</Label>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px' }}>
            Create a Spotify developer app and paste your Client ID and Secret below.
          </p>
        </div>
      )}

      {(!status?.configured || showForm) && (
        <form onSubmit={handleSave} style={{ marginTop: 12 }}>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Client ID"
            required
            style={inputStyle}
          />
          <input
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="Client Secret"
            required
            type="password"
            style={{ ...inputStyle, marginTop: 6 }}
          />
          <button type="submit" disabled={saving} style={{ ...btnStyle(color), marginTop: 8 }}>
            {saving ? 'Saving…' : 'Save credentials'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Maps config ──────────────────────────────────────────────────────────────

function MapsConfig() {
  const ingestUrl = `${API_URL}/maps/ingest?secret=YOUR_LOCATION_INGEST_SECRET`

  return (
    <div>
      <Label>OwnTracks setup</Label>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
        Point your OwnTracks HTTP endpoint to:
      </p>
      <code style={{
        display: 'block', fontSize: 11, padding: '8px 10px',
        background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6,
        wordBreak: 'break-all', marginBottom: 8,
      }}>
        {ingestUrl}
      </code>
      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
        Set <code>LOCATION_INGEST_SECRET</code> in your API .env, use the same value in OwnTracks.
      </p>
    </div>
  )
}

// ─── Habits config ────────────────────────────────────────────────────────────

function HabitsConfig() {
  const [accounts, setAccounts] = useState<{ id: string; name: string; connected: boolean; lastSyncedAt: string | null }[]>([])
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/starling/status`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []))
      .catch(() => {})
  }, [])

  const handleConnect = async () => {
    if (!token) return
    setConnecting(true); setMsg('')
    try {
      const res = await fetch(`${API_URL}/starling/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken: token }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error ?? 'Failed'); return }
      setMsg(`Connected ${data.accounts?.length ?? 0} account(s), synced ${data.synced?.[0]?.synced ?? 0} transactions.`)
      setToken('')
      const s = await fetch(`${API_URL}/starling/status`, { credentials: 'include' }).then((r) => r.json())
      setAccounts(s.accounts ?? [])
    } catch { setMsg('Connection failed') }
    finally { setConnecting(false) }
  }

  const handleSync = async () => {
    setSyncing(true); setMsg('')
    try {
      const res = await fetch(`${API_URL}/starling/sync`, { method: 'POST', credentials: 'include' })
      const data = await res.json()
      const total = (data.synced ?? []).reduce((s: number, a: { synced: number }) => s + a.synced, 0)
      setMsg(`Synced ${total} transaction(s).`)
    } catch { setMsg('Sync failed') }
    finally { setSyncing(false) }
  }

  const healthUrl = `${API_URL}/habits/health-ingest?secret=YOUR_HABITS_HEALTH_SECRET`

  return (
    <div>
      {/* Starling */}
      <Label>Starling Bank</Label>
      {accounts.length > 0 ? (
        <div style={{ marginBottom: 10 }}>
          {accounts.map((a) => (
            <p key={a.id} style={{ fontSize: 13, color: '#374151', margin: '0 0 4px' }}>
              ✓ {a.name}
              {a.lastSyncedAt && ` — synced ${new Date(a.lastSyncedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          ))}
          <button onClick={handleSync} disabled={syncing} style={outlineBtn}>
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Personal Access Token"
            type="password"
            style={inputStyle}
          />
          <button
            onClick={handleConnect}
            disabled={connecting || !token}
            style={{ ...btnStyle('#8b5cf6'), marginTop: 6 }}
          >
            {connecting ? 'Connecting…' : 'Connect Starling'}
          </button>
        </div>
      )}
      {msg && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px' }}>{msg}</p>}

      {/* iPhone Steps */}
      <Label>iPhone Steps (Shortcuts)</Label>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
        Health ingest URL for your iOS Shortcut:
      </p>
      <code style={{
        display: 'block', fontSize: 11, padding: '8px 10px',
        background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6,
        wordBreak: 'break-all',
      }}>
        {healthUrl}
      </code>
    </div>
  )
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#9ca3af',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </p>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box',
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '7px 14px', fontSize: 12, fontWeight: 600,
    background: bg, color: '#fff',
    border: 'none', borderRadius: 6, cursor: 'pointer',
  }
}

const outlineBtn: React.CSSProperties = {
  padding: '6px 12px', fontSize: 12, background: '#fff',
  border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', color: '#374151',
}
