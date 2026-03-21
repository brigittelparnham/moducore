import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Block } from '../components/BlockEditor'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type PageContent = { html?: string; text?: string; blocks?: Block[] }
type PageStyle = {
  accentColor?: string
  backgroundColor?: string
  fontFamily?: string
  maxWidth?: number
  showHeader?: boolean
  showFooter?: boolean
  showNav?: boolean
}
type NavLink = { label: string; href: string }
type SiteConfig = {
  siteName: string | null
  logoUrl: string | null
  accentColor: string
  fontFamily: string
  navLinks: NavLink[]
  headerBlocks: Block[]
  footerBlocks: Block[]
}

type PageData = {
  page: {
    title: string
    slug: string
    content: PageContent
    style?: PageStyle
    publishedAt: string
  }
  tenant: { name: string; slug: string }
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function RenderBlocks({ blocks, accentColor }: { blocks: Block[]; accentColor: string }) {
  return (
    <div>
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading': {
            const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3'
            const sizes = { 1: 36, 2: 26, 3: 20 }
            return (
              <Tag key={block.id} style={{ textAlign: block.align, fontSize: sizes[block.level], fontWeight: 700, margin: '1.2em 0 0.4em' }}>
                {block.text}
              </Tag>
            )
          }
          case 'text':
            return <div key={block.id} style={{ fontSize: 16, lineHeight: 1.7, color: '#333', marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: block.html }} />
          case 'image': {
            const widths = { full: '100%', wide: '80%', medium: '50%' }
            const aligns = { left: 'flex-start', center: 'center', right: 'flex-end' }
            return (
              <div key={block.id} style={{ display: 'flex', justifyContent: aligns[block.align], marginBottom: 24 }}>
                <img src={block.url} alt={block.alt} style={{ width: widths[block.width], borderRadius: 6 }} />
              </div>
            )
          }
          case 'divider':
            return <hr key={block.id} style={{ border: 'none', borderTop: `1px ${block.style} #d1d5db`, margin: '24px 0' }} />
          case 'button': {
            const aligns = { left: 'flex-start', center: 'center', right: 'flex-end' }
            return (
              <div key={block.id} style={{ display: 'flex', justifyContent: aligns[block.align], marginBottom: 16 }}>
                <a href={block.href} style={{
                  padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 600,
                  ...(block.variant === 'primary'
                    ? { background: accentColor, color: '#fff' }
                    : { background: 'transparent', color: accentColor, border: `2px solid ${accentColor}` }),
                }}>
                  {block.label}
                </a>
              </div>
            )
          }
          case 'spacer':
            return <div key={block.id} style={{ height: block.height }} />
          case 'code':
            return (
              <pre key={block.id} style={{
                background: '#1e1e2e', color: '#cdd6f4', borderRadius: 8,
                padding: '16px 20px', fontSize: 14, lineHeight: 1.6, overflowX: 'auto',
                marginBottom: 24, fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}>
                <code>{block.code}</code>
              </pre>
            )
        }
      })}
    </div>
  )
}

// ─── Public page ─────────────────────────────────────────────────────────────

export function PublicPageView() {
  const { tenantSlug, slug } = useParams<{ tenantSlug: string; slug: string }>()
  const [data, setData] = useState<PageData | null>(null)
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load page and site config in parallel
    Promise.all([
      fetch(`${API_URL}/public/${tenantSlug}/pages/${slug}`).then((r) => {
        if (!r.ok) throw new Error('Page not found')
        return r.json() as Promise<PageData>
      }),
      fetch(`${API_URL}/site-config/public/${tenantSlug}`)
        .then((r) => r.ok ? r.json() as Promise<{ config: SiteConfig | null }> : Promise.resolve({ config: null }))
        .then((d) => d.config)
        .catch(() => null),
    ])
      .then(([pageData, config]) => {
        setData(pageData)
        setSiteConfig(config)
      })
      .catch((e) => setError(e.message))
  }, [tenantSlug, slug])

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <h2 style={{ color: '#888' }}>Page not found</h2>
      </div>
    )
  }

  if (!data) {
    return <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 16px', color: '#888' }}>Loading…</div>
  }

  const content = data.page.content
  const pageStyle = data.page.style ?? {}
  const accentColor = pageStyle.accentColor ?? siteConfig?.accentColor ?? '#111111'
  const fontFamily = pageStyle.fontFamily ?? siteConfig?.fontFamily ?? 'system-ui'
  const bgColor = pageStyle.backgroundColor ?? '#fff'
  const maxWidth = pageStyle.maxWidth ?? 700
  const showHeader = pageStyle.showHeader !== false && siteConfig?.headerBlocks?.length
  const showFooter = pageStyle.showFooter !== false && siteConfig?.footerBlocks?.length
  const showNav = pageStyle.showNav !== false && siteConfig?.navLinks?.length

  return (
    <div style={{ minHeight: '100vh', background: bgColor, fontFamily }}>

      {/* ── Site header ── */}
      {showHeader && (
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
          <div style={{ maxWidth, margin: '0 auto' }}>
            <RenderBlocks blocks={siteConfig!.headerBlocks} accentColor={accentColor} />
          </div>
        </div>
      )}

      {/* ── Nav bar ── */}
      {showNav && (
        <nav style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
          <div style={{ maxWidth, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 4, height: 48 }}>
            {siteConfig!.logoUrl && (
              <img src={siteConfig!.logoUrl} alt={siteConfig!.siteName ?? ''} style={{ height: 28, marginRight: 8 }} />
            )}
            {!siteConfig!.logoUrl && siteConfig!.siteName && (
              <span style={{ fontWeight: 700, fontSize: 15, color: accentColor, marginRight: 12 }}>{siteConfig!.siteName}</span>
            )}
            {siteConfig!.navLinks.map((link, i) => (
              <a key={i} href={link.href} style={{ fontSize: 14, color: '#374151', textDecoration: 'none', padding: '4px 10px', borderRadius: 5 }}>
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* ── Page content ── */}
      <div style={{ maxWidth, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 24, color: '#111' }}>{data.page.title}</h1>

        {Array.isArray(content.blocks) ? (
          <RenderBlocks blocks={content.blocks} accentColor={accentColor} />
        ) : content.html ? (
          <div style={{ fontSize: 16, lineHeight: 1.7, color: '#333' }} dangerouslySetInnerHTML={{ __html: content.html }} />
        ) : (
          <div style={{ fontSize: 16, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#333' }}>{content.text ?? ''}</div>
        )}
      </div>

      {/* ── Site footer ── */}
      {showFooter && (
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '0 24px', marginTop: 48 }}>
          <div style={{ maxWidth, margin: '0 auto' }}>
            <RenderBlocks blocks={siteConfig!.footerBlocks} accentColor={accentColor} />
          </div>
        </div>
      )}
    </div>
  )
}
