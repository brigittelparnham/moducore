import type { HubApp, AppSlug } from './types'

const STORAGE_KEY = 'moducore_hub'

export const DEFAULT_APPS: HubApp[] = [
  { slug: 'cms',     name: 'CMS',       url: 'http://localhost:3001', icon: '🌐', color: '#3b82f6', enabled: true },
  { slug: 'journal', name: 'Journal',   url: 'http://localhost:3002', icon: '📓', color: '#f59e0b', enabled: true },
  { slug: 'spotify', name: 'Music',     url: 'http://localhost:3003', icon: '🎵', color: '#1DB954', enabled: true },
  { slug: 'maps',    name: 'Maps',      url: 'http://localhost:3004', icon: '🗺️', color: '#ef4444', enabled: true },
  { slug: 'habits',  name: 'Lifestyle', url: 'http://localhost:3005', icon: '✨', color: '#8b5cf6', enabled: true },
]

export function getHubConfig(): HubApp[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_APPS
    const parsed = JSON.parse(stored) as HubApp[]
    // Merge any new defaults not yet in stored config
    const slugs = new Set(parsed.map((a) => a.slug))
    for (const def of DEFAULT_APPS) {
      if (!slugs.has(def.slug)) parsed.push(def)
    }
    return parsed
  } catch {
    return DEFAULT_APPS
  }
}

export function setHubConfig(apps: HubApp[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
}

export function getAppUrl(slug: AppSlug): string {
  const apps = getHubConfig()
  return apps.find((a) => a.slug === slug)?.url ?? ''
}

/** Detect current app slug by matching window.location.origin to configured app URLs */
export function getCurrentAppSlug(): AppSlug | null {
  if (typeof window === 'undefined') return null
  const origin = window.location.origin
  const apps = getHubConfig()
  return apps.find((a) => a.url === origin || a.url.replace(/\/$/, '') === origin)?.slug ?? null
}
