import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useSpotify } from '../context'
import { createSpotifyApi } from '../api'
import type { SpotifyArtist } from '../types'

type GenreEntry = { genre: string; count: number }

function aggregateGenres(artists: SpotifyArtist[]): GenreEntry[] {
  const counts = new Map<string, number>()
  for (const artist of artists) {
    for (const genre of artist.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

export function GenreChart() {
  const { apiBase } = useSpotify()
  const api = createSpotifyApi(apiBase)
  const svgRef = useRef<SVGSVGElement>(null)

  const [genres, setGenres] = useState<GenreEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.getTopArtists('long')
      .then(({ data }) => setGenres(aggregateGenres(data ?? [])))
      .catch(() => setGenres([]))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  useEffect(() => {
    if (!svgRef.current || genres.length === 0) return

    const margin = { top: 8, right: 30, bottom: 8, left: 120 }
    const containerWidth = svgRef.current.parentElement?.clientWidth ?? 400
    const width = containerWidth - margin.left - margin.right
    const barHeight = 28
    const height = genres.length * barHeight

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear()
      .domain([0, d3.max(genres, (d) => d.count) ?? 1])
      .range([0, width])

    const y = d3.scaleBand()
      .domain(genres.map((d) => d.genre))
      .range([0, height])
      .padding(0.3)

    // Bars
    svg.selectAll('rect')
      .data(genres)
      .join('rect')
      .attr('y', (d) => y(d.genre) ?? 0)
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', (d) => x(d.count))
      .attr('rx', 4)
      .attr('fill', '#1DB954')
      .attr('opacity', (_, i) => 1 - i * 0.06)

    // Count labels
    svg.selectAll('text.count')
      .data(genres)
      .join('text')
      .attr('class', 'count')
      .attr('x', (d) => x(d.count) + 6)
      .attr('y', (d) => (y(d.genre) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', 11)
      .attr('fill', '#555')
      .text((d) => d.count)

    // Y axis labels
    svg.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('font-size', 12)
      .attr('fill', '#333')
      .attr('dx', -6)
  }, [genres])

  return (
    <div style={card}>
      <h3 style={heading}>Genre Mix</h3>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: '#999' }}>From your all-time top artists</p>
      {isLoading ? (
        <p style={muted}>Loading…</p>
      ) : genres.length === 0 ? (
        <p style={muted}>No genre data yet.</p>
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
