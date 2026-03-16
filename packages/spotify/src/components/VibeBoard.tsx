import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useSpotify } from '../context'
import { createSpotifyApi } from '../api'
import type { SpotifyTrack } from '../types'

type EraEntry = { decade: string; count: number }

const DECADE_ORDER = ['pre-70s', '70s', '80s', '90s', '00s', '10s', '20s']

function buildEras(tracks: SpotifyTrack[]): EraEntry[] {
  const counts = new Map<string, number>()
  for (const track of tracks) {
    const year = parseInt((track.album?.release_date ?? '').slice(0, 4), 10)
    if (isNaN(year)) continue
    let decade: string
    if (year < 1970) decade = 'pre-70s'
    else if (year < 1980) decade = '70s'
    else if (year < 1990) decade = '80s'
    else if (year < 2000) decade = '90s'
    else if (year < 2010) decade = '00s'
    else if (year < 2020) decade = '10s'
    else decade = '20s'
    counts.set(decade, (counts.get(decade) ?? 0) + 1)
  }
  return DECADE_ORDER
    .filter((d) => counts.has(d))
    .map((decade) => ({ decade, count: counts.get(decade)! }))
}

export function VibeBoard() {
  const { apiBase } = useSpotify()
  const api = createSpotifyApi(apiBase)
  const svgRef = useRef<SVGSVGElement>(null)

  const [eras, setEras] = useState<EraEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.getTopTracks('long')
      .then(({ data }) => setEras(buildEras((data ?? []) as SpotifyTrack[])))
      .catch(() => setEras([]))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  useEffect(() => {
    if (!svgRef.current || eras.length === 0) return

    const margin = { top: 12, right: 12, bottom: 32, left: 28 }
    const containerWidth = svgRef.current.parentElement?.clientWidth ?? 400
    const height = 160

    const w = containerWidth - margin.left - margin.right
    const h = height - margin.top - margin.bottom

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand()
      .domain(eras.map((d) => d.decade))
      .range([0, w])
      .padding(0.25)

    const y = d3.scaleLinear()
      .domain([0, d3.max(eras, (d) => d.count) ?? 1])
      .range([h, 0])
      .nice()

    // Bars
    svg.selectAll('rect')
      .data(eras)
      .join('rect')
      .attr('x', (d) => x(d.decade) ?? 0)
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => h - y(d.count))
      .attr('rx', 3)
      .attr('fill', '#1DB954')
      .attr('opacity', (d) => 0.55 + (d.count / (d3.max(eras, (e) => e.count) ?? 1)) * 0.45)

    // Count labels on bars
    svg.selectAll('text.count')
      .data(eras)
      .join('text')
      .attr('class', 'count')
      .attr('x', (d) => (x(d.decade) ?? 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.count) - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', '#555')
      .text((d) => d.count)

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(3).tickSize(-w))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('stroke', '#f0f0f0'))
      .call((g) => g.selectAll('.tick text').attr('font-size', 10).attr('fill', '#aaa'))

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick text').attr('font-size', 12).attr('fill', '#555').attr('dy', '1.2em'))
  }, [eras])

  return (
    <div style={card}>
      <h3 style={heading}>Music Eras</h3>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#999' }}>Decades in your all-time top tracks</p>
      {isLoading ? (
        <p style={muted}>Loading…</p>
      ) : eras.length === 0 ? (
        <p style={muted}>No track data yet.</p>
      ) : (
        <div style={{ overflowX: 'hidden' }}>
          <svg ref={svgRef} style={{ display: 'block' }} />
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
