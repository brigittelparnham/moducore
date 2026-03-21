export type AppSlug = 'cms' | 'journal' | 'spotify' | 'maps' | 'habits'

export type HubApp = {
  slug: AppSlug
  name: string
  url: string    // base URL for the UI (e.g. http://localhost:3002)
  icon: string   // emoji
  color: string  // accent hex
  enabled: boolean
}

export type DaySummary = {
  slug: AppSlug
  data: Record<string, unknown>
}
