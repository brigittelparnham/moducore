import type { Reward } from '../types'

type Props = {
  reward: Reward
  points: number
  onRedeem: (id: string) => void
}

export function RewardCard({ reward, points, onRedeem }: Props) {
  const earned = !!reward.earnedAt
  const redeemed = !!reward.redeemedAt
  const canAfford = reward.rewardType === 'points_spend' && reward.pointsCost !== null
    ? points >= reward.pointsCost
    : true
  const canRedeem = earned && !redeemed && canAfford

  const statusColor = redeemed ? '#16a34a' : earned ? '#f59e0b' : '#94a3b8'
  const statusLabel = redeemed ? 'Redeemed ✓' : earned ? 'Earned — ready to use' : 'Not yet earned'

  return (
    <div style={card(redeemed)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={iconBox}>{reward.rewardType === 'points_spend' ? '⭐' : '🎁'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{reward.name}</div>
          {reward.description && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{reward.description}</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {reward.monetaryValue && (
              <span style={pill('#dcfce7', '#166534')}>£{reward.monetaryValue}</span>
            )}
            {reward.rewardType === 'points_spend' && reward.pointsCost !== null && (
              <span style={pill('#ede9fe', '#6d28d9')}>{reward.pointsCost} pts</span>
            )}
            <span style={pill('#f8fafc', statusColor, statusColor)}>{statusLabel}</span>
          </div>
          {reward.conditionFrequency && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Unlocks when {reward.conditionFrequency} limit/target is met
            </div>
          )}
        </div>
        {canRedeem && (
          <button style={redeemBtn} onClick={() => onRedeem(reward.id)}>
            Redeem
          </button>
        )}
      </div>
    </div>
  )
}

export function PointsWidget({ total, recent }: { total: number; recent?: Array<{ delta: number; reason: string }> }) {
  return (
    <div style={pointsBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28 }}>⭐</span>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 12, color: '#666' }}>points balance</div>
        </div>
      </div>
      {recent && recent.length > 0 && (
        <div style={{ marginTop: 10, borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
          {recent.slice(0, 3).map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
              <span style={{ color: '#444' }}>{r.reason}</span>
              <span style={{ fontWeight: 600, color: r.delta > 0 ? '#16a34a' : '#ef4444' }}>
                {r.delta > 0 ? '+' : ''}{r.delta}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const card = (faded: boolean): React.CSSProperties => ({
  background: faded ? '#f9fafb' : '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '14px 16px',
  opacity: faded ? 0.7 : 1,
})
const iconBox: React.CSSProperties = {
  fontSize: 22,
  width: 36,
  textAlign: 'center',
  flexShrink: 0,
}
const pill = (bg: string, color: string, border?: string): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: 600,
  background: bg,
  color,
  border: `1px solid ${border ?? 'transparent'}`,
  padding: '2px 7px',
  borderRadius: 10,
})
const redeemBtn: React.CSSProperties = {
  padding: '6px 14px',
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}
const pointsBox: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '14px 16px',
}
