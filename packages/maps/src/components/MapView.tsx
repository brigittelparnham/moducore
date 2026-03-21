import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

type Props = {
  originLat: number
  originLon: number
  destLat: number
  destLon: number
  /** Optional intermediate waypoints (ping trace) */
  waypoints?: [number, number][]
  height?: number
  borderRadius?: number
}

export function MapView({
  originLat,
  originLon,
  destLat,
  destLon,
  waypoints,
  height = 160,
  borderRadius = 8,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Remove any previous instance
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map)

    const origin: [number, number] = [originLat, originLon]
    const dest: [number, number] = [destLat, destLon]

    // Polyline: use waypoints if provided, otherwise straight line origin→dest
    const linePoints: [number, number][] = waypoints && waypoints.length > 0
      ? [origin, ...waypoints, dest]
      : [origin, dest]

    L.polyline(linePoints, { color: '#1a1a1a', weight: 3, opacity: 0.75 }).addTo(map)

    // Origin marker (green)
    L.circleMarker(origin, {
      radius: 6,
      color: '#fff',
      weight: 2,
      fillColor: '#16a34a',
      fillOpacity: 1,
    }).addTo(map)

    // Dest marker (red)
    L.circleMarker(dest, {
      radius: 6,
      color: '#fff',
      weight: 2,
      fillColor: '#dc2626',
      fillOpacity: 1,
    }).addTo(map)

    // Fit to bounds with padding
    const bounds = L.latLngBounds(linePoints).pad(0.25)
    map.fitBounds(bounds)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [originLat, originLon, destLat, destLon, waypoints])

  return (
    <div
      ref={containerRef}
      style={{
        height,
        width: '100%',
        borderRadius,
        overflow: 'hidden',
        background: '#e5e7eb',
      }}
    />
  )
}
