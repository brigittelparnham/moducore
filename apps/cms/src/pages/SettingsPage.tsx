import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type AvailableApp, type EmbedToken, type ConnectorRow } from '../lib/api'

export function SettingsPage() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14 }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <div />
      </div>

      <AppsSection />
      <div style={{ marginTop: 48 }}>
        <EmbedTokensSection />
      </div>
      <div style={{ marginTop: 48 }}>
        <ConnectorsSection />
      </div>
    </div>
  )
}

// ─── Apps ────────────────────────────────────────────────────────────────────

function AppsSection() {
  const [apps, setApps] = useState<AvailableApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.apps.list()
      .then((data) => setApps(data.apps))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

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

  return (
    <section>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
        Apps
      </h3>
      {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}
      {isLoading && <p style={{ color: '#666', fontSize: 13 }}>Loading…</p>}
      {apps.map((app) => (
        <div
          key={app.slug}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 0', borderBottom: '1px solid #eee',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{app.name}</div>
            {app.description && <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{app.description}</div>}
          </div>
          <button
            onClick={() => toggle(app)}
            disabled={busy === app.slug}
            style={{
              padding: '6px 14px', cursor: 'pointer', borderRadius: 4,
              background: app.installed ? '#fff' : '#111',
              color: app.installed ? '#111' : '#fff',
              border: app.installed ? '1px solid #ccc' : 'none',
            }}
          >
            {busy === app.slug ? '…' : app.installed ? 'Uninstall' : 'Install'}
          </button>
        </div>
      ))}
    </section>
  )
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
    api.embedTokens.list()
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
          Embed Tokens
        </h3>
        <button
          onClick={() => { setShowCreate(true); setNewTokenValue(null) }}
          style={{ padding: '6px 14px', background: '#111', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          + Create Token
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 16 }}>
        Embed your journal on any external site using a script tag and a token.
      </p>

      {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}

      {showCreate && (
        <CreateTokenForm
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Show new token value once */}
      {newTokenValue && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: 16, marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#166534' }}>
            Token created — copy it now, it won't be shown again.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <code style={{ flex: 1, fontSize: 12, background: '#fff', padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', wordBreak: 'break-all' }}>
              {newTokenValue}
            </code>
            <button
              onClick={() => copyToken(newTokenValue)}
              style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: '#fff', whiteSpace: 'nowrap' }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <details>
            <summary style={{ fontSize: 12, color: '#166534', cursor: 'pointer' }}>Show embed snippet</summary>
            <pre style={{ fontSize: 11, background: '#fff', padding: 10, borderRadius: 4, border: '1px solid #ccc', overflow: 'auto', marginTop: 8, whiteSpace: 'pre-wrap' }}>
{`<script src="http://localhost:5173/embeds/journal.js"></script>
<journal-widget token="${newTokenValue}" api-url="${API_URL}"></journal-widget>`}
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
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eee' }}
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
            style={{ padding: '5px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626' }}
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
  { value: 'rss', label: 'RSS Feed', fields: [{ key: 'url', label: 'Feed URL', placeholder: 'https://example.com/feed.xml' }] },
  { value: 'rest', label: 'REST API', fields: [
    { key: 'url', label: 'Endpoint URL', placeholder: 'https://api.example.com/data' },
    { key: 'headers', label: 'Headers (JSON)', placeholder: '{"Authorization":"Bearer xxx"}' },
  ]},
]

function ConnectorsSection() {
  const [connectors, setConnectors] = useState<ConnectorRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    api.connectors.list()
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
      setConnectors((prev) => prev.map((c) => (c.id === connector.id ? updated.connector : c)))
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
      // Refresh to get updated lastSyncedAt
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
          Connectors
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '6px 14px', background: '#111', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          + Add Connector
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 16 }}>
        Connect external data sources (RSS feeds, REST APIs). Data syncs every 15 minutes automatically.
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
        <div
          key={connector.id}
          style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{connector.name}</span>
                <span style={{ fontSize: 11, background: '#f3f4f6', color: '#555', padding: '2px 7px', borderRadius: 10 }}>
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
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
              <button
                onClick={() => handleSync(connector.id)}
                disabled={syncing === connector.id}
                style={{ padding: '5px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: '#fff' }}
              >
                {syncing === connector.id ? '…' : 'Sync now'}
              </button>
              <button
                onClick={() => handleToggle(connector)}
                style={{ padding: '5px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: '#fff' }}
              >
                {connector.enabled ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => handleDelete(connector.id)}
                style={{ padding: '5px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626' }}
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
      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, marginBottom: 16 }}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Type</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setConfig({}) }}
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4 }}
          >
            {CONNECTOR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Blog Feed"
            required
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
          />
        </div>
      </div>
      {fields.map((field) => (
        <div key={field.key} style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{field.label}</label>
          <input
            value={config[field.key] ?? ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            required={field.key === 'url'}
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
          />
        </div>
      ))}
      {error && <p style={{ color: 'red', fontSize: 13, margin: '0 0 8px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          style={{ padding: '7px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          {isSaving ? 'Adding…' : 'Add Connector'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '7px 16px', background: '#fff', color: '#666', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Embed Tokens (CreateTokenForm) ──────────────────────────────────────────

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
      const data = await api.embedTokens.create({ name: name.trim(), appSlug: 'journal', write })
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
      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, marginBottom: 16 }}
    >
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Token name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Website"
          required
          style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
        />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={write} onChange={(e) => setWrite(e.target.checked)} />
        Allow write access
      </label>
      {error && <p style={{ color: 'red', fontSize: 13, margin: '0 0 8px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          style={{ padding: '7px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          {isSaving ? 'Creating…' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '7px 16px', background: '#fff', color: '#666', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
