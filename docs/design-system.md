# Design System — Studio

The Studio design language applies across all moducore apps. Warm paper palette, tactile sticker/polaroid metaphors, handwritten + monospaced type. Implemented as a design pass on the `design-pass` branch.

---

## Source spec

The full design spec lives outside the repo at:

```
/Users/brigitteparnham/Downloads/moducore/
  Studio.html                   — design canvas (pan/zoom, 9 artboards)
  directions/shared.jsx         — APPS constant, StickerMark, AsciiMark, RisoMark, mulberry32 PRNG
  directions/studio.jsx         — Landing, Board, Maps, Tweaks screens
  directions/studio-extra.jsx   — Onboarding, Journal, Music, Habits, Portfolio screens
```

The canvas uses a custom `DesignCanvas/DCSection/DCArtboard` framework (`design-canvas.jsx`) with pan/zoom and fullscreen focus per artboard.

---

## Palette

```ts
const S = {
  paper:   '#efe6d4',   // warm tan — page background
  paperD:  '#e2d6bd',   // darker tan — headers, polaroid image areas
  ink:     '#221a16',   // near-black — primary text, buttons
  inkSoft: '#3b302a',   // softer brown — secondary text, labels
  coral:   '#ff8a5b',   // accent — CTAs, highlights, active states
  mint:    '#7fd1b9',   // accent — success, music, positive
  lemon:   '#ffd86b',   // accent — tape strips, sticky notes, journal
  sky:     '#9aa8ff',   // accent — maps/travel, stat highlights
  rose:    '#ff9bb8',   // accent — finance/spending sticky
}
```

---

## Typography

| Role | Font | Usage |
|------|------|-------|
| Body | `'Space Grotesk', 'Instrument Sans', sans-serif` | Paragraphs, labels, nav links |
| Hand | `'Caveat', 'Patrick Hand', cursive` | Headings, brand name, card labels, emotive copy |
| Mono | `'JetBrains Mono', monospace` | Tags, timestamps, uppercase meta labels, code |

Fonts installed via `@fontsource/*` in each app's `package.json`. Imported as the first line in each app's `main.tsx` before any other styles.

---

## Structural elements

### Dot grid

Fixed, full-page, pointer-events: none. Applied to every app background and auth pages.

```ts
{
  position: 'fixed',
  inset: 0,
  backgroundImage: `radial-gradient(rgba(34,26,22,0.13) 1px, transparent 1px)`,
  backgroundSize: '18px 18px',
  opacity: 0.35,
  pointerEvents: 'none',
  zIndex: 0,
}
```

### Body margin reset

Each app has `src/index.css` imported first in `main.tsx`:

```css
html, body { margin: 0; padding: 0; }
```

### Paper card

Standard card style used across all apps:

```ts
{
  background: '#fffdf8',
  border: '1.5px solid rgba(34,26,22,0.1)',
  borderRadius: 3,
  boxShadow: '2px 3px 0 rgba(34,26,22,0.06)',
}
```

Cards get a slight rotation (`transform: rotate(Xdeg)`) to feel hand-placed.

### Tape strip

Yellow masking tape across the top of polaroids and auth cards:

```ts
{
  position: 'absolute',
  top: -9,
  left: '50%',
  transform: 'translateX(-50%) rotate(-2deg)',
  width: 80,
  height: 18,
  background: 'rgba(255,216,107,0.7)',
  mixBlendMode: 'multiply',
  borderLeft: '1px dashed rgba(0,0,0,0.08)',
  borderRight: '1px dashed rgba(0,0,0,0.08)',
}
```

### Pin

Round map pin for polaroids on the board:

```ts
{
  width: 14, height: 14,
  borderRadius: '50%',
  background: `radial-gradient(circle at 30% 30%, ${color}, rgba(0,0,0,0.45))`,
  boxShadow: '0 2px 3px rgba(0,0,0,0.25)',
}
```

### Sticky note

Coloured rectangle with slight rotation, hand font:

```ts
{
  background: S.lemon,      // or mint, coral, rose, sky
  transform: `rotate(${rot}deg)`,
  boxShadow: '0 8px 18px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
  fontFamily: hand,
  backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.04))',
}
```

### Ink pill button

Primary CTA across all apps:

```ts
{
  background: S.ink,
  color: S.paper,
  borderRadius: 999,
  padding: '10px 22px',
  fontFamily: body,
  fontWeight: 600,
  fontSize: 14,
}
```

---

## StickerMark component

**Location:** `packages/ui/src/components/StickerMark.tsx`
**Export:** `import { StickerMark, StickerPalette } from '@moducore/ui'`

Generative SVG mark per app. Seeded with `mulberry32` PRNG — the same seed always produces the same mark. Ported directly from `directions/shared.jsx`.

```tsx
<StickerMark
  slug="journal"   // 'cms' | 'journal' | 'spotify' | 'maps' | 'habits'
  seed={42}        // any number — determines which variant is drawn
  size={130}       // SVG width/height in px
  palette={p}      // optional — defaults to Studio palette
/>
```

| App slug | Visual |
|----------|--------|
| `cms` | Three stacked, rotated cards |
| `journal` | Leaf / feather shape with cross-hatch lines |
| `spotify` (or `music`) | Vinyl record with sound arc lines |
| `maps` | Dashed path with arrow tip and origin dot |
| `habits` | 4×4 grid of checkboxes (seed-seeded filled/empty) |

The `palette` type:

```ts
type StickerPalette = {
  ink: string   // stroke colour
  a: string     // primary fill (coral by default)
  b: string     // secondary fill (mint)
  c: string     // tertiary fill (lemon)
  d: string     // quaternary fill (sky)
}
```

### Where it's used

| Location | Slug | Seed | Notes |
|----------|------|------|-------|
| `apps/home` AppCard polaroid | per-app | per-app | Image area of each card on the landing page |
| `apps/cms` LoginPage card | `cms` | 7 | Replaces ⬡ emoji at top of login card |
| `apps/cms` SignupPage card | `cms` | 7 | Same as login |
| `apps/cms` OnboardingPage seed wall | `cms` | per-seed | Each of the 6 selectable seed cards + the preview card |

---

## What's been implemented (design pass)

### apps/home (port 3006)
Full Studio redesign. Paper background, dot grid, sticky nav (Caveat brand), hero with coral Caveat accent, app grid as polaroid-style cards with tape strips, slight card rotation, `StickerMark` in the image area per card, hover lifts card.

### apps/cms (port 3001)
- **AppShellLayout** — paperD header with blur, Caveat tenant name, mono uppercase nav, ink active underline, dot grid background
- **LoginPage** — paper bg, dot grid, white card with lemon tape strip and `rotate(-0.6deg)`, `StickerMark` CMS mark, Caveat heading with coral accent, paper-toned inputs, ink pill submit
- **SignupPage** — same card pattern, `join the studio.` heading, workspace slug preview in mono; redirects to `/onboarding` on success
- **OnboardingPage** — full-screen seed picker at `/onboarding`; 6 seed cards pinned to a wall, click to select, reshuffle generates 6 new random seeds, custom number input, selected seed shown in a lemon polaroid preview card; stores chosen seed via `setDesignSeed()` from `@moducore/hub`; skips if seed already set
- **DashboardPage** — stat cards with slight rotation, accent colour bar at top, Caveat large number display (52px), quick action ink pill + ghost buttons

### packages/habits (used in apps/habits port 3005)
- **LifestyleDashboard** — paper bg, dot grid, paperD header tabs; fetches 30 days of logs per habit to power HabitGrid
- **HabitGrid** — replaces progress bars with the 14-day circle grid from the spec: one compact paper card, per-habit row with name + streak, 14 coloured circles (filled = logged, alternating ±3deg rotation, today glows), percentage, inline log form on `+`
- **HabitCard** — Caveat habit name, mono progress label, coral/mint/lemon progress bar (kept for detail/manage views)
- **BudgetProgress** — mono category label, ink fill bar, coral if over budget
- **TransactionRow** — mono amount, Caveat merchant name, ink category pill
- **RewardCard** — Caveat reward name, mint/lemon status pill
- **AccountCard** — Caveat balance display

### packages/maps (used in apps/maps port 3004)
- **MapsDashboardPage** — paper bg, dot grid, paperD header, mono tab labels, `know your city.` heading with sky Caveat accent, paper cards
- **JourneyCard** — Caveat route name (20px), mono time/distance, coral/mint TfL diff colouring
- **SuggestPanel** — Caveat heading, ink pill button, mint/lemon/ink confidence pills, mono footer
- **CommuteStats** — Caveat route names, mono journey count labels
- **JourneyList** — mono date headers, ink `load more ↓` pill

### packages/spotify (used in apps/spotify port 3003)
- **SpotifyDashboardPage** — paper bg, dot grid, paperD header, `what you've been listening to.` heading with coral Caveat accent
- **NowPlaying** — Caveat track name (28px), mono live/last-played badge, mint live dot, album art with borderRadius 2
- **TopTracksCard** — Caveat heading, mint pill range selectors, mono track numbers
- **TopArtistsCard** — same pattern as TopTracksCard
- **GenreChart** (ListeningHours) — Caveat heading, mono subtitle, D3 bars changed to sky `#9aa8ff`
- **VibeBoard** (MusicEras) — Caveat heading, D3 bars changed to coral `#ff8a5b`

### packages/journal (used in apps/journal port 3002)
- **JournalListPage** — paper bg, dot grid, paperD header, `words you've written.` heading with lemon Caveat accent, paper cards, mono status pills, ink new-entry pill
- **JournalEditorPage** — full-page paper bg, dot grid, paperD toolbar, Caveat title input (36px, transparent, ink border-bottom), mono tags input, back/publish/save buttons as pills

---

## The 9 design screens — status

| # | Screen | Status | Gap |
|---|--------|--------|-----|
| 1 | Welcome to the studio | ⚠️ Partial | Landing exists but simplified — no 120px hero, no floating polaroid cluster, no scribble SVG arrows |
| 2 | Onboarding — roll a seed | ✅ Built | `apps/cms/src/pages/OnboardingPage.tsx` — seed wall + preview card + reshuffle + custom input. Seed stored in localStorage via `getDesignSeed`/`setDesignSeed` from `@moducore/hub`. Triggered from signup. |
| 3 | My board — apps as stickers | ❌ Not built | Home is a static card grid, not a draggable pinboard with live sticker widgets |
| 4 | Journal entry — kiln day | ⚠️ Partial | Editor has Studio styling; missing lined paper guides, embedded polaroid image, DayContext panel as stickers |
| 5 | Music — listening life | ⚠️ Partial | Charts + Studio tokens done; missing album polaroid, wavy waveform, listening heatmap, era sticky |
| 6 | Travel polaroid | ⚠️ Partial | Maps app done; missing hand-drawn SVG map, compass rose, journey annotation text on map |
| 7 | Lifestyle — reps + finance | ⚠️ Partial | 14-day circle grid built (`HabitGrid`); still missing steps polaroid with radial ring |
| 8 | Public portfolio — brigitte.studio | ❌ Not built | No public portfolio / personal site view |
| 9 | Sticker drawer — customise | ❌ Not built | No palette picker, font picker, mess level slider, or seed reshuffle panel |

---

## Foundational pieces still missing

| Piece | What it is | Needed for |
|-------|-----------|-----------|
| Board canvas engine | Freeform drag/rotate/peel pinboard of live sticker widgets | Screen 3 |
| `StickerMark` in DayContext pills | Per-app marks instead of text labels in journal day summary | Screen 4 |
| Hand-drawn map SVG | SVG with river, park, roads, journey path, compass | Screen 6 |
| Steps polaroid with radial ring | SVG ring showing daily steps progress | Screen 7 |
| Public portfolio route | `/p/:slug` public site from CMS published pages + personal data | Screen 8 |
| Sticker drawer panel | Palette/font/mess/seed customisation stored in localStorage or user prefs | Screen 9 |
