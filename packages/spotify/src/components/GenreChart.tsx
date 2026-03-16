import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useSpotify } from '../context'
import { createSpotifyApi } from '../api'
import type { SpotifyRecentlyPlayedItem } from '../types'

type HourEntry = { hour: number; count: number; label: string }

const HOUR_LABELS: string[] = [
  '12am','1am','2am','3am','4am','5am',
  '6am','7am','8am','9am','10am','11am',
  '12pm','1pm','2pm','3pm','4pm','5pm',
  '6pm','7pm','8pm','9pm','10pm','11pm',
]

function buildHourBuckets(items: SpotifyRecentlyPlayedItem[]): HourEntry[] {
  const counts = new Array<number>(24).fill(0)
  for (const item of items) {
    const h = new Date(item.played_at).getHours()
    counts[h]++
  }
  return counts.map((count, hour) => ({ hour, count, label: HOUR_LABELS[hour] }))
}

export function GenreChart() {
  const { apiBase } = useSpotify()
  const api = createSpotifyApi(apiBase)
  const svgRef = useRef<SVGSVGElement>(null)

  const [hours, setHours] = useState<HourEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.getRecentlyPlayed()
      .then(({ data }) => setHours(buildHourBuckets((data ?? []) as SpotifyRecentlyPlayedItem[])))
      .catch(() => setHours([]))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  useEffect(() => {
    if (!svgRef.current || hours.length === 0) return

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
      .domain(hours.map((d) => String(d.hour)))
      .range([0, w])
      .padding(0.15)

    const y = d3.scaleLinear()
      .domain([0, d3.max(hours, (d) => d.count) ?? 1])
      .range([h, 0])
      .nice()

    // Bars
    svg.selectAll('rect')
      .data(hours)
      .join('rect')
      .attr('x', (d) => x(String(d.hour)) ?? 0)
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => h - y(d.count))
      .attr('rx', 2)
      .attr('fill', '#1DB954')
      .attr('opacity', (d) => d.count === 0 ? 0.15 : 0.75 + (d.count / (d3.max(hours, (e) => e.count) ?? 1)) * 0.25)

    // Y axis (just 2 ticks)
    svg.append('g')
      .call(d3.axisLeft(y).ticks(3).tickSize(-w))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('stroke', '#f0f0f0'))
      .call((g) => g.selectAll('.tick text').attr('font-size', 10).attr('fill', '#aaa'))

    // X axis — only label every 6 hours
    const xAxisHours = [0, 6, 12, 18]
    svg.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(
        d3.axisBottom(x)
          .tickValues(xAxisHours.map(String))
          .tickFormat((d) => HOUR_LABELS[Number(d)])
          .tickSize(0)
      )
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick text').attr('font-size', 11).attr('fill', '#888').attr('dy', '1.2em'))
  }, [hours])

  const hasData = hours.some((h) => h.count > 0)

  return (
    <div style={card}>
      <h3 style={heading}>Listening Hours</h3>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#999' }}>When you play music (last 50 plays)</p>
      {isLoading ? (
        <p style={muted}>Loading…</p>
      ) : !hasData ? (
        <p style={muted}>No listening history yet.</p>
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
