// Seeded PRNG — same mulberry32 from the design spec, stable per (seed, slug)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type StickerPalette = {
  ink: string
  a: string
  b: string
  c: string
  d: string
}

const DEFAULT_PALETTE: StickerPalette = {
  ink: '#221a16',
  a: '#ff8a5b',
  b: '#7fd1b9',
  c: '#ffd86b',
  d: '#9aa8ff',
}

type Props = {
  /** App slug — 'cms' | 'journal' | 'spotify' | 'music' | 'maps' | 'habits' */
  slug: string
  seed?: number
  size?: number
  palette?: StickerPalette
}

export function StickerMark({ slug, seed = 1, size = 130, palette }: Props) {
  const p = palette ?? DEFAULT_PALETTE
  const stroke = p.ink
  const sw = 2.4

  // normalise spotify → music for the visual variant
  const key = slug === 'spotify' ? 'music' : slug

  const r = mulberry32(seed + (key.charCodeAt(0) ?? 0) * 13)

  if (key === 'journal') {
    return (
      <svg viewBox="0 0 130 130" width={size} height={size}>
        <path
          d="M28,108 C32,72 50,40 78,28 C92,22 104,30 100,46 C94,72 70,98 38,114 Z"
          fill={p.a}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <path d="M44,90 C52,78 64,66 76,58" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <path d="M52,98 C60,86 70,78 82,72" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    )
  }

  if (key === 'music') {
    return (
      <svg viewBox="0 0 130 130" width={size} height={size}>
        <circle cx="65" cy="65" r="44" fill={p.b} stroke={stroke} strokeWidth={sw} />
        <circle cx="65" cy="65" r="10" fill={p.ink} />
        <path d="M88,38 C100,46 104,68 92,84" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <path
          d="M78,30 C94,40 102,68 86,90"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    )
  }

  if (key === 'maps') {
    return (
      <svg viewBox="0 0 130 130" width={size} height={size}>
        <path
          d="M22,98 C30,80 38,86 48,70 C58,54 70,66 82,52 C94,38 102,46 110,32"
          fill="none"
          stroke={p.d}
          strokeWidth={sw * 1.5}
          strokeLinecap="round"
          strokeDasharray="2 6"
        />
        <path
          d="M22,98 C30,80 38,86 48,70 C58,54 70,66 82,52 C94,38 102,46 110,32"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray="2 6"
          opacity="0.5"
        />
        <path d="M104,28 l8,2 -3,8 z" fill={p.c} stroke={stroke} strokeWidth={sw} />
        <circle cx="22" cy="98" r="5" fill={p.a} stroke={stroke} strokeWidth={sw} />
      </svg>
    )
  }

  if (key === 'habits') {
    const cells = Array.from({ length: 16 }).map((_, i) => {
      const x = 22 + (i % 4) * 22
      const y = 22 + Math.floor(i / 4) * 22
      const filled = r() < 0.55
      return (
        <g key={i}>
          <rect x={x} y={y} width="16" height="16" rx="3" fill={filled ? p.c : 'none'} stroke={stroke} strokeWidth={sw * 0.7} />
          {filled && (
            <path
              d={`M${x + 3},${y + 9} l3,4 l7,-8`}
              fill="none"
              stroke={stroke}
              strokeWidth={sw * 0.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      )
    })
    return (
      <svg viewBox="0 0 130 130" width={size} height={size}>
        {cells}
      </svg>
    )
  }

  // cms — stacked cards
  return (
    <svg viewBox="0 0 130 130" width={size} height={size}>
      <rect x="20" y="20" width="68" height="48" rx="4" fill={p.a} stroke={stroke} strokeWidth={sw} transform="rotate(-4 54 44)" />
      <rect x="44" y="50" width="68" height="48" rx="4" fill={p.b} stroke={stroke} strokeWidth={sw} transform="rotate(3 78 74)" />
      <rect x="30" y="78" width="68" height="32" rx="4" fill={p.c} stroke={stroke} strokeWidth={sw} transform="rotate(-1 64 94)" />
    </svg>
  )
}
