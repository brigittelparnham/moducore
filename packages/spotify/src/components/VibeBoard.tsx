import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useSpotify } from '../context'
import { createSpotifyApi } from '../api'
import type { AudioFeatures } from '../types'

type VibeAxis = { key: keyof AudioFeatures; label: string }

const AXES: VibeAxis[] = [
  { key: 'danceability', label: 'Dance' },
  { key: 'energy', label: 'Energy' },
  { key: 'valence', label: 'Vibe' },
  { key: 'acousticness', label: 'Acoustic' },
  { key: 'instrumentalness', label: 'Instrumental' },
]

function averageFeatures(features: AudioFeatures[]): Record<string, number> {
  if (features.length === 0) return {}
  const sums: Record<string, number> = {}
  for (const f of features) {
    for (const { key } of AXES) {
      sums[key] = (sums[key] ?? 0) + (f[key] as number)
    }
  }
  const result: Record<string, number> = {}
  for (const { key } of AXES) {
    result[key] = sums[key] / features.length
  }
  return result
}

export function VibeBoard() {
  const { apiBase } = useSpotify()
  const api = createSpotifyApi(apiBase)
  const svgRef = useRef<SVGSVGElement>(null)

  const [averages, setAverages] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.getAudioFeatures()
      .then(({ data }) => setAverages(averageFeatures(data ?? [])))
      .catch(() => setAverages({}))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  useEffect(() => {
    if (!svgRef.current || Object.keys(averages).length === 0) return

    const size = 260
    const cx = size / 2
    const cy = size / 2
    const r = size / 2 - 40
    const n = AXES.length
    const levels = 4

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', size)
      .attr('height', size)

    const angleSlice = (Math.PI * 2) / n

    // Web grid circles
    for (let lvl = 1; lvl <= levels; lvl++) {
      const rLevel = (r * lvl) / levels
      const points = AXES.map((_, i) => {
        const angle = angleSlice * i - Math.PI / 2
        return [cx + rLevel * Math.cos(angle), cy + rLevel * Math.sin(angle)]
      })
      svg.append('polygon')
        .attr('points', points.map((p) => p.join(',')).join(' '))
        .attr('fill', 'none')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
    }

    // Axis lines
    AXES.forEach((_, i) => {
      const angle = angleSlice * i - Math.PI / 2
      svg.append('line')
        .attr('x1', cx)
        .attr('y1', cy)
        .attr('x2', cx + r * Math.cos(angle))
        .attr('y2', cy + r * Math.sin(angle))
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
    })

    // Axis labels
    AXES.forEach(({ label }, i) => {
      const angle = angleSlice * i - Math.PI / 2
      const lx = cx + (r + 22) * Math.cos(angle)
      const ly = cy + (r + 22) * Math.sin(angle)
      svg.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 11)
        .attr('fill', '#555')
        .text(label)
    })

    // Data polygon
    const dataPoints = AXES.map(({ key }, i) => {
      const value = averages[key] ?? 0
      const angle = angleSlice * i - Math.PI / 2
      return [cx + r * value * Math.cos(angle), cy + r * value * Math.sin(angle)]
    })

    svg.append('polygon')
      .attr('points', dataPoints.map((p) => p.join(',')).join(' '))
      .attr('fill', '#1DB954')
      .attr('fill-opacity', 0.25)
      .attr('stroke', '#1DB954')
      .attr('stroke-width', 2)

    // Dots at each axis
    dataPoints.forEach(([dx, dy]) => {
      svg.append('circle')
        .attr('cx', dx)
        .attr('cy', dy)
        .attr('r', 4)
        .attr('fill', '#1DB954')
    })
  }, [averages])

  return (
    <div style={card}>
      <h3 style={heading}>Vibe Board</h3>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: '#999' }}>Audio profile of your top tracks</p>
      {isLoading ? (
        <p style={muted}>Loading…</p>
      ) : Object.keys(averages).length === 0 ? (
        <p style={muted}>No audio data yet.</p>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg ref={svgRef} />
        </div>
      )}
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 20,
  flex: 1,
  minWidth: 0,
}

const heading: React.CSSProperties = { margin: '0 0 4px', fontSize: 16, fontWeight: 700 }
const muted: React.CSSProperties = { color: '#888', fontSize: 14, margin: 0 }
