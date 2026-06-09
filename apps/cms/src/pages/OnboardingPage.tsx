import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StickerMark } from '@moducore/ui'
import { setDesignSeed, getDesignSeed } from '@moducore/hub'

const S = {
  paper:   '#efe6d4',
  paperD:  '#e2d6bd',
  ink:     '#221a16',
  inkSoft: '#3b302a',
  coral:   '#ff8a5b',
  mint:    '#7fd1b9',
  lemon:   '#ffd86b',
  sky:     '#9aa8ff',
  rose:    '#ff9bb8',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

const PALETTE = { ink: S.ink, a: S.coral, b: S.mint, c: S.lemon, d: S.sky }

const CARD_COLORS = [S.lemon, '#fff', S.mint, '#fff', S.sky, '#fff']
const PIN_COLORS  = [S.mint, S.sky, S.coral, S.ink, S.lemon, S.rose]

function randomSeed() {
  return Math.floor(Math.random() * 9999) + 1
}

function freshSixSeeds(): number[] {
  const s = new Set<number>()
  while (s.size < 6) s.add(randomSeed())
  return Array.from(s)
}

const INITIAL_SEEDS = [42, 11, 207, 3, 99, 318]

export function OnboardingPage() {
  const navigate = useNavigate()
  // If seed already chosen, skip to dashboard
  useEffect(() => {
    if (getDesignSeed() !== null) navigate('/', { replace: true })
  }, [navigate])

  const [seeds, setSeeds] = useState<number[]>(INITIAL_SEEDS)
  const [selected, setSelected] = useState<number>(INITIAL_SEEDS[0])
  const [customInput, setCustomInput] = useState('')

  const reshuffle = useCallback(() => {
    const next = freshSixSeeds()
    setSeeds(next)
    setSelected(next[0])
    setCustomInput('')
  }, [])

  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 5)
    setCustomInput(v)
    if (v.length > 0) setSelected(Number(v) || 1)
  }

  const handleLockIn = () => {
    setDesignSeed(selected)
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: S.paper, fontFamily: body, position: 'relative', overflow: 'hidden' }}>
      {/* dot grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(${S.inkSoft}22 1px, transparent 1px)`,
        backgroundSize: '18px 18px', opacity: 0.35, zIndex: 0,
      }} />

      {/* top bar */}
      <div style={{
        position: 'absolute', top: 18, left: 24, right: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', zIndex: 10,
      }}>
        <span style={{ opacity: 0.4 }}>moducore · setup</span>

        {/* step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StepPip n={1} active />
          <div style={{ width: 18, height: 1, background: S.ink }} />
          <StepPip n={2} />
          <div style={{ width: 18, height: 1, background: S.ink, opacity: 0.3 }} />
          <StepPip n={3} />
        </div>

        <button
          onClick={handleLockIn}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: S.inkSoft, opacity: 0.55 }}
        >
          skip →
        </button>
      </div>

      {/* main content */}
      <div style={{
        position: 'absolute', top: 68, left: 48, right: 48, bottom: 24,
        display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 36, zIndex: 1,
      }}>

        {/* ── Left ── */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.3em', color: S.coral }}>
            STEP 01 OF 03
          </div>

          <h1 style={{
            fontFamily: body, fontWeight: 700, fontSize: 'clamp(56px, 7vw, 88px)',
            letterSpacing: '-0.04em', lineHeight: 0.92, margin: '8px 0 0',
          }}>
            roll a<br />
            <span style={{ fontFamily: hand, color: S.coral, fontSize: 'clamp(68px, 9vw, 120px)', display: 'inline-block', transform: 'rotate(-3deg)' }}>
              seed.
            </span>
          </h1>

          <p style={{ fontFamily: body, fontSize: 16, lineHeight: 1.6, color: S.inkSoft, maxWidth: 420, marginTop: 16 }}>
            one number becomes your signature — your dock icons, your wordmark, the
            doodles on every sticker. roll until one feels like you.
          </p>

          <div style={{ marginTop: 12, fontFamily: hand, fontSize: 22, color: S.ink }}>
            ↘ tap a card to pick · reshuffle for new ones.
          </div>

          {/* selected seed preview card */}
          <div style={{
            marginTop: 28,
            padding: '14px 18px',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 10px 22px rgba(0,0,0,0.10)',
            transform: 'rotate(-0.6deg)',
            display: 'flex',
            gap: 18,
            alignItems: 'center',
            position: 'relative',
          }}>
            {/* lemon tape */}
            <div style={{
              position: 'absolute', top: -8, left: '50%',
              transform: 'translateX(-50%) rotate(-2deg)',
              width: 72, height: 16,
              background: 'rgba(255,216,107,0.7)',
              mixBlendMode: 'multiply',
              borderLeft: '1px dashed rgba(0,0,0,0.08)',
              borderRight: '1px dashed rgba(0,0,0,0.08)',
            }} />

            <div style={{ padding: 8, background: S.lemon, borderRadius: 12, boxShadow: `inset 0 0 0 2px ${S.ink}`, flexShrink: 0 }}>
              <StickerMark slug="cms" seed={selected} size={96} palette={PALETTE} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.22em', opacity: 0.6 }}>YOUR SIGNATURE</div>
              <div style={{ fontFamily: hand, fontSize: 40, lineHeight: 1, marginTop: 4 }}>
                seed_<span style={{ color: S.coral }}>{String(selected).padStart(5, '0')}</span>
              </div>
              <div style={{ fontFamily: body, fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                density {((selected % 100) / 100).toFixed(2)} · seed #{selected}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', gap: 10, paddingTop: 24, flexWrap: 'wrap' }}>
            <button
              onClick={handleLockIn}
              style={{
                padding: '13px 24px',
                background: S.ink, color: S.paper,
                border: 'none', borderRadius: 999,
                fontFamily: body, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', letterSpacing: '-0.01em',
              }}
            >
              lock it in · step 2 →
            </button>
            <button
              onClick={reshuffle}
              style={{
                padding: '13px 20px',
                background: 'transparent', color: S.ink,
                border: `1.5px solid ${S.ink}`, borderRadius: 999,
                fontFamily: body, fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↻ reshuffle 6 new
            </button>
          </div>
        </div>

        {/* ── Right — seed wall ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.22em', opacity: 0.6, marginBottom: 10 }}>
            THE SEED WALL · 6 / ∞
          </div>

          <div style={{ position: 'relative', flex: 1, minHeight: 360 }}>
            {seeds.map((s, i) => {
              const col = i % 3
              const row = Math.floor(i / 3)
              const x = col * 158
              const y = row * 200 + (col === 1 ? 24 : 0)
              const rot = [-4, 3, -2, 2, -3, 4][i]
              const isSelected = s === selected
              const cardBg = isSelected ? S.lemon : (CARD_COLORS[i] ?? '#fff')
              const pinColor = PIN_COLORS[i] ?? S.coral

              return (
                <button
                  key={`${s}-${i}`}
                  onClick={() => { setSelected(s); setCustomInput('') }}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: 140,
                    background: cardBg,
                    padding: '10px 10px 14px',
                    transform: `rotate(${rot}deg)`,
                    boxShadow: isSelected
                      ? `0 14px 26px rgba(255,138,91,0.4)`
                      : '0 10px 20px rgba(0,0,0,0.12)',
                    border: isSelected ? `2.5px solid ${S.ink}` : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.transform = `rotate(${rot * 0.4}deg) translateY(-4px)` }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = `rotate(${rot}deg)` }}
                >
                  {/* pin */}
                  <div style={{
                    position: 'absolute', left: '50%', top: -7, transform: 'translateX(-50%)',
                    width: 14, height: 14, borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, ${pinColor}, rgba(0,0,0,0.45))`,
                    boxShadow: '0 2px 3px rgba(0,0,0,0.25)',
                  }} />

                  <div style={{
                    aspectRatio: '1/1',
                    background: isSelected ? '#fff' : S.paperD,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <StickerMark slug="cms" seed={s} size={94} palette={PALETTE} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: hand, fontSize: 18, marginTop: 6, color: S.ink }}>
                    <span>#{String(s).padStart(5, '0')}</span>
                    {isSelected && <span style={{ color: S.coral }}>✓</span>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* type your own */}
          <div style={{ marginTop: 16, fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', opacity: 0.6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>OR — TYPE YOUR OWN</span>
            <input
              type="text"
              inputMode="numeric"
              value={customInput}
              onChange={handleCustom}
              placeholder="_____"
              style={{
                width: 80,
                border: 'none',
                borderBottom: `1.5px solid ${S.ink}`,
                background: 'transparent',
                fontFamily: mono,
                fontSize: 12,
                letterSpacing: '0.15em',
                color: S.ink,
                outline: 'none',
                textAlign: 'center',
                padding: '2px 4px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StepPip({ n, active = false }: { n: number; active?: boolean }) {
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%',
      background: active ? S.ink : 'transparent',
      border: active ? 'none' : `1.5px solid ${S.ink}`,
      color: active ? S.paper : S.ink,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontFamily: mono, opacity: active ? 1 : (n === 3 ? 0.4 : 1),
    }}>
      {n}
    </span>
  )
}
