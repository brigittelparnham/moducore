import { useEffect, useState } from 'react'

type ConnectorState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Fetches cached connector data from the API.
 * Requires an active session (for use inside CMS or journal apps).
 *
 * @param connectorId - UUID of the connector row
 * @param apiUrl - base URL of the API server
 */
export function useConnector<T = unknown>(
  connectorId: string | null | undefined,
  apiUrl = 'http://localhost:3000'
): ConnectorState<T> {
  const [state, setState] = useState<ConnectorState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!connectorId) {
      setState({ data: null, loading: false, error: null })
      return
    }
    setState({ data: null, loading: true, error: null })
    fetch(`${apiUrl}/connectors/${connectorId}/data`, { credentials: 'include' })
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(res.status === 404 ? 'Not found' : 'Failed to load'))
      )
      .then((json: { data: T }) => setState({ data: json.data, loading: false, error: null }))
      .catch((e: unknown) =>
        setState({ data: null, loading: false, error: e instanceof Error ? e.message : 'Failed to load' })
      )
  }, [connectorId, apiUrl])

  return state
}
