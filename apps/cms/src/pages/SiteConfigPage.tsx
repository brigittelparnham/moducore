import { useEffect, useState, useRef } from 'react'
import { BlockEditor, type Block } from '../components/BlockEditor'
import { MediaPicker } from '../components/MediaPicker'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type NavLink = { label: string; href: string }
type SiteConfigData = {
  siteName: string | null
  logoUrl: string | null
  accentColor: string
  fontFamily: string
  navLinks: NavLink[]
  headerBlocks: Block[]
  footerBlocks: Block[]
}

const FONT_OPTIONS = [
  { value: 'system-ui', label: 'System UI' },
  { value: 'Georgia, serif', label: 'Georgia (Serif)' },
  { value: '"Inter", sans-serif', label: 'Inter' },
  { value: '"Playfair Display", serif', label: 'Playfair Display' },
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
]

const sectionStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb', borderRadius: 10, padding: '20px 24px', marginBottom: 28,
}
const heading: React.CSSProperties = { margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#374151' }
const inp: React.CSSProperties = {
  padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14,
  width: '100%', boxSizing: 'border-box',
}
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }
const label: React.CSSProperties = { fontSize: 13, color: '#374151', width: 110, flexShrink: 0 }

export function SiteConfigPage() {
  const [config, setConfig] = useState<SiteConfigData>({
    siteName: '', logoUrl: '', accentColor: '#111111',
    fontFamily: 'system-ui', navLinks: [], headerBlocks: [], footerBlocks: [],
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<'global' | 'nav' | 'header' | 'footer'>('global')
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerResolveRef = useRef<((url: string | null) => void) | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/site-config`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { config: SiteConfigData | null }) => {
        if (d.config) setConfig(d.config as SiteConfigData)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/site-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const onPickImage = (): Promise<string | null> =>
    new Promise((resolve) => {
      pickerResolveRef.current = resolve
      setPickerOpen(true)
    })

  const updateNavLink = (i: number, field: keyof NavLink, value: string) => {
    const links = [...config.navLinks]
    links[i] = { ...links[i], [field]: value }
    setConfig((c) => ({ ...c, navLinks: links }))
  }

  const TABS = [
    { id: 'global', label: 'Branding' },
    { id: 'nav', label: 'Navigation' },
    { id: 'header', label: 'Header' },
    { id: 'footer', label: 'Footer' },
  ] as const

  return (
    <div style={{ maxWidth: 820, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Site Config</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Global settings for your published pages at{' '}
            <code style={{ fontSize: 12, background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>
              /p/:workspace/*
            </code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 13, color: '#16a34a' }}>Saved!</span>}
          {error && <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 18px', background: '#111', color: '#fff', border: 'none',
              borderRadius: 7, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSection(t.id)}
            style={{
              flex: 1, padding: '7px 0', fontSize: 13, fontWeight: 600, border: 'none',
              borderRadius: 6, cursor: 'pointer',
              background: activeSection === t.id ? '#fff' : 'transparent',
              color: activeSection === t.id ? '#111' : '#6b7280',
              boxShadow: activeSection === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Branding ── */}
      {activeSection === 'global' && (
        <div style={sectionStyle}>
          <p style={heading}>Branding & Typography</p>

          <div style={row}>
            <span style={label}>Site name</span>
            <input style={inp} value={config.siteName ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, siteName: e.target.value }))}
              placeholder="My Site" />
          </div>

          <div style={row}>
            <span style={label}>Logo URL</span>
            <input style={{ ...inp, flex: 1 }} value={config.logoUrl ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, logoUrl: e.target.value }))}
              placeholder="https://…" />
            <button
              onClick={async () => {
                const url = await onPickImage()
                if (url) setConfig((c) => ({ ...c, logoUrl: url }))
              }}
              style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff', flexShrink: 0 }}
            >
              Pick
            </button>
          </div>

          {config.logoUrl && (
            <div style={{ marginBottom: 12 }}>
              <img src={config.logoUrl} alt="Logo preview" style={{ maxHeight: 48, borderRadius: 4 }} />
            </div>
          )}

          <div style={row}>
            <span style={label}>Accent colour</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => setConfig((c) => ({ ...c, accentColor: e.target.value }))}
                style={{ width: 40, height: 34, border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', padding: 2 }}
              />
              <input
                style={{ ...inp, width: 100 }}
                value={config.accentColor}
                onChange={(e) => setConfig((c) => ({ ...c, accentColor: e.target.value }))}
              />
            </div>
          </div>

          <div style={row}>
            <span style={label}>Font</span>
            <select
              value={config.fontFamily}
              onChange={(e) => setConfig((c) => ({ ...c, fontFamily: e.target.value }))}
              style={{ ...inp, width: 240 }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 8, padding: '12px 16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, fontFamily: config.fontFamily, fontSize: 18, color: config.accentColor, fontWeight: 700 }}>
              {config.siteName || 'My Site'}
            </p>
            <p style={{ margin: '4px 0 0', fontFamily: config.fontFamily, fontSize: 14, color: '#555' }}>
              This is a preview of your site typography and accent colour.
            </p>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      {activeSection === 'nav' && (
        <div style={sectionStyle}>
          <p style={heading}>Navigation Links</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            These links appear in the nav bar on all published pages. Leave empty to hide the nav.
          </p>

          {config.navLinks.map((link, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input
                value={link.label}
                onChange={(e) => updateNavLink(i, 'label', e.target.value)}
                placeholder="Label"
                style={{ ...inp, flex: '0 0 140px' }}
              />
              <input
                value={link.href}
                onChange={(e) => updateNavLink(i, 'href', e.target.value)}
                placeholder="https://… or /page-slug"
                style={{ ...inp, flex: 1 }}
              />
              <button
                onClick={() => setConfig((c) => ({ ...c, navLinks: c.navLinks.filter((_, j) => j !== i) }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, padding: '0 4px' }}
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={() => setConfig((c) => ({ ...c, navLinks: [...c.navLinks, { label: '', href: '' }] }))}
            style={{ padding: '7px 14px', fontSize: 13, border: '1px dashed #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff', marginTop: 4 }}
          >
            + Add link
          </button>
        </div>
      )}

      {/* ── Header ── */}
      {activeSection === 'header' && (
        <div style={sectionStyle}>
          <p style={heading}>Header Blocks</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Shown above the nav bar on all published pages. Leave empty for no header.
          </p>
          <BlockEditor
            blocks={config.headerBlocks}
            onChange={(blocks) => setConfig((c) => ({ ...c, headerBlocks: blocks }))}
            onPickImage={onPickImage}
          />
        </div>
      )}

      {/* ── Footer ── */}
      {activeSection === 'footer' && (
        <div style={sectionStyle}>
          <p style={heading}>Footer Blocks</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Shown below all page content on published pages. Leave empty for no footer.
          </p>
          <BlockEditor
            blocks={config.footerBlocks}
            onChange={(blocks) => setConfig((c) => ({ ...c, footerBlocks: blocks }))}
            onPickImage={onPickImage}
          />
        </div>
      )}

      {pickerOpen && (
        <MediaPicker
          onSelect={(url) => { setPickerOpen(false); pickerResolveRef.current?.(url); pickerResolveRef.current = null }}
          onClose={() => { setPickerOpen(false); pickerResolveRef.current?.(null); pickerResolveRef.current = null }}
        />
      )}
    </div>
  )
}
