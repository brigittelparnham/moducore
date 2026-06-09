import type { Reward } from '../types'

type Props = {
  reward: Reward
  points: number
  onRedeem: (id: string) => void
}

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
  sky: '#9aa8ff',
  rose: '#ff9bb8',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

export function RewardCard({ reward, points, onRedeem }: Props) {
  const earned = !!reward.earnedAt
  const redeemed = !!reward.redeemedAt
  const canAfford = reward.rewardType === 'points_spend' && reward.pointsCost !== null
    ? points >= reward.pointsCost
    : true
  const canRedeem = earned && !redeemed && canAfford

  const bgColor = redeemed ? S.paperD : earned ? S.lemon : '#fff'
  const statusLabel = redeemed ? 'redeemed ✓' : earned ? 'earned — ready ↑' : 'not yet earned'
  const statusColor = redeemed ? S.inkSoft : earned ? S.coral : 'rgba(34,26,22,0.4)'

  return (
    <div style={card(bgColor, redeemed)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={iconBox}>
          {reward.rewardType === 'points_spend' ? '⭐' : '🎁'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: hand, fontSize: 26, lineHeight: 1.1, color: S.ink }}>{reward.name}</div>
          {reward.description && (
            <div style={{ fontFamily: body, fontSize: 13, color: S.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
              {reward.description}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {reward.monetaryValue && (
              <span style={tag(S.mint)}>£{reward.monetaryValue}</span>
            )}
            {reward.rewardType === 'points_spend' && reward.pointsCost !== null && (
              <span style={tag(S.sky)}>{reward.pointsCost} pts</span>
            )}
            <span style={{ fontFamily: hand, fontSize: 18, color: statusColor }}>{statusLabel}</span>
          </div>
          {reward.conditionFrequency && (
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.15em', color: S.inkSoft, marginTop: 4, opacity: 0.6 }}>
              UNLOCKS WHEN {reward.conditionFrequency.toUpperCase()} TARGET MET
            </div>
          )}
        </div>
        {canRedeem && (
          <button style={redeemBtn} onClick={() => onRedeem(reward.id)}>
            redeem →
          </button>
        )}
      </div>
    </div>
  )
}

export function PointsWidget({ total, recent }: { total: number; recent?: Array<{ delta: number; reason: string }> }) {
  return (
    <div style={pointsBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontFamily: hand, fontSize: 72, lineHeight: 1, color: S.ink }}>{total}</div>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.6, textTransform: 'uppercase' as const }}>points</div>
          <div style={{ fontFamily: hand, fontSize: 22, color: S.coral, marginTop: 2 }}>your balance ↑</div>
        </div>
      </div>
      {recent && recent.length > 0 && (
        <div style={{ marginTop: 12, borderTop: `1px dashed rgba(34,26,22,0.15)`, paddingTop: 10 }}>
          {recent.slice(0, 3).map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: body, fontSize: 13, marginTop: 4, color: S.inkSoft }}>
              <span>{r.reason}</span>
              <span style={{ fontFamily: hand, fontSize: 20, color: r.delta > 0 ? S.mint : S.coral }}>
                {r.delta > 0 ? '+' : ''}{r.delta}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const card = (bg: string, faded: boolean): React.CSSProperties => ({
  background: bg,
  boxShadow: '0 8px 18px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
  borderRadius: 4,
  padding: '14px 16px',
  opacity: faded ? 0.72 : 1,
  fontFamily: body,
})
const iconBox: React.CSSProperties = {
  fontSize: 22,
  width: 36,
  textAlign: 'center',
  flexShrink: 0,
  paddingTop: 2,
}
const tag = (bg: string): React.CSSProperties => ({
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: '0.12em',
  background: bg,
  color: S.ink,
  padding: '3px 8px',
  borderRadius: 999,
  textTransform: 'uppercase' as const,
})
const redeemBtn: React.CSSProperties = {
  padding: '7px 16px',
  background: S.ink,
  color: S.paper,
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  fontFamily: body,
}
const pointsBox: React.CSSProperties = {
  background: S.lemon,
  boxShadow: '0 10px 22px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
  borderRadius: 4,
  padding: '16px 20px',
  transform: 'rotate(-0.5deg)',
}
