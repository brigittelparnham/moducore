import { useEffect, useState } from 'react'
import { api, type EmbedToken, type ConnectorRow, type Tenant } from '../lib/api'
import { HubSettings } from '@moducore/hub'


export function SettingsPage() {
  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px' }}>
      <h2 style={{ margin: '0 0 32px' }}>Settings</h2>

      <WorkspaceSection />
      <div style={{ marginTop: 48 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Connected Apps</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
          Configure the URLs for each moducore app. These power the app switcher and the day context panel in your journal entries.
        </p>
        <HubSettings />
      </div>
      <div style={{ marginTop: 48 }}>
        <ConnectCodesSection />
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

// ─── Connect Codes ────────────────────────────────────────────────────────────

const API_URL_CC = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const CONNECTABLE_APPS = [
  { slug: 'habits', name: 'Lifestyle', icon: '✨' },
  { slug: 'maps', name: 'Maps', icon: '🗺️' },
  { slug: 'spotify', name: 'Music', icon: '🎵' },
  { slug: 'journal', name: 'Journal', icon: '📓' },
]

function ConnectCodesSection() {
  const [codes, setCodes] = useState<Record<string, { code: string; expiresAt: string } | null>>({})
  const [consume, setConsume] = useState('')
  const [consumeMsg, setConsumeMsg] = useState('')
  const [consuming, setConsuming] = useState(false)

  const generateCode = async (appSlug: string) => {
    const res = await fetch(`${API_URL_CC}/connect-codes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ appSlug }),
    })
    const data = await res.json()
    setCodes((c) => ({ ...c, [appSlug]: { code: data.code, expiresAt: data.expiresAt } }))
  }

  const handleConsume = async () => {
    if (!consume.trim()) return
    setConsuming(true)
    setConsumeMsg('')
    try {
      const res = await fetch(`${API_URL_CC}/connect-codes/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: consume.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setConsumeMsg(data.error ?? 'Failed'); return }
      setConsumeMsg(`Linked ${data.appSlug} data successfully.`)
      setConsume('')
    } finally {
      setConsuming(false)
    }
  }

  return (
    <section>
      <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>App Connect Codes</h3>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>
        Generate a code to let another moducore account read data from one of your apps.
        Codes expire in 15 minutes.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {CONNECTABLE_APPS.map(({ slug, name, icon }) => {
          const entry = codes[slug]
          return (
            <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 14, flex: 1 }}>{name}</span>
              {entry ? (
                <>
                  <code style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, color: '#111', background: '#f3f4f6', padding: '4px 10px', borderRadius: 6 }}>
                    {entry.code}
                  </code>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    expires {new Date(entry.expiresAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => generateCode(slug)} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', background: '#fff' }}>
                    Refresh
                  </button>
                </>
              ) : (
                <button
                  onClick={() => generateCode(slug)}
                  style={{ fontSize: 13, padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}
                >
                  Generate code
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500 }}>Enter a code from another account</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={consume}
            onChange={(e) => setConsume(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 15, fontFamily: 'monospace', letterSpacing: 3, fontWeight: 700 }}
          />
          <button
            onClick={handleConsume}
            disabled={consuming || !consume.trim()}
            style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
          >
            {consuming ? 'Linking…' : 'Link'}
          </button>
        </div>
        {consumeMsg && <p style={{ fontSize: 13, color: '#16a34a', marginTop: 8 }}>{consumeMsg}</p>}
      </div>
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
