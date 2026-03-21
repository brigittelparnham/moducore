import type { Journey, KnownPlace, KnownRoute, SuggestionOption } from './types'

export function createMapsApi(apiBase: string) {
  const base = `${apiBase}/maps`

  const get = (path: string) =>
    fetch(`${base}${path}`, { credentials: 'include' }).then((r) => r.json())

  const post = (path: string, body: unknown) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    }).then((r) => r.json())

  const del = (path: string) =>
    fetch(`${base}${path}`, { method: 'DELETE', credentials: 'include' }).then((r) => r.json())

  return {
    journeys: {
      list: (limit = 50, offset = 0): Promise<{ journeys: Journey[] }> =>
        get(`/journeys?limit=${limit}&offset=${offset}`),
      today: (): Promise<{ journeys: Journey[] }> => get('/journeys/today'),
      get: (id: string): Promise<{ journey: Journey }> => get(`/journeys/${id}`),
      label: (id: string, routeId: string): Promise<{ ok: boolean }> =>
        post(`/journeys/${id}/label`, { routeId }),
    },
    places: {
      list: (): Promise<{ places: KnownPlace[] }> => get('/places'),
      create: (name: string, lat: number, lon: number, radiusM?: number): Promise<{ place: KnownPlace }> =>
        post('/places', { name, lat, lon, radiusM }),
      delete: (id: string): Promise<{ ok: boolean }> => del(`/places/${id}`),
    },
    routes: {
      list: (): Promise<{ routes: KnownRoute[] }> => get('/routes'),
      create: (
        name: string,
        originLat: number, originLon: number,
        destLat: number, destLon: number
      ): Promise<{ route: KnownRoute }> =>
        post('/routes', { name, originLat, originLon, destLat, destLon }),
    },
    suggest: (
      fromLat: number, fromLon: number,
      toLat?: number, toLon?: number,
      toPlace?: string
    ): Promise<{ suggestions: SuggestionOption[] }> => {
      const params = new URLSearchParams({ fromLat: String(fromLat), fromLon: String(fromLon) })
      if (toLat !== undefined) params.set('toLat', String(toLat))
      if (toLon !== undefined) params.set('toLon', String(toLon))
      if (toPlace) params.set('toPlace', toPlace)
      return get(`/suggest?${params}`)
    },
  }
}
