import type { Account } from '../types'

type Props = {
  account: Account
  balance: number
  onClick?: () => void
}

const TYPE_ICONS: Record<string, string> = {
  current: '🏦',
  savings: '💰',
  cash: '💵',
  credit: '💳',
  investment: '📈',
}

export function AccountCard({ account, balance, onClick }: Props) {
  const icon = TYPE_ICONS[account.type] ?? '🏦'
  const color = account.color ?? '#6366f1'

  return (
    <div style={card(color, !!onClick)} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={iconBox(color)}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{account.name}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, textTransform: 'capitalize' }}>
            {account.type}{account.provider === 'starling' ? ' · Starling' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: balance < 0 ? '#ef4444' : '#1a1a1a' }}>
            £{Math.abs(balance).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {balance < 0 && <div style={{ fontSize: 11, color: '#ef4444' }}>overdrawn</div>}
          {account.starlingLastSyncedAt && (
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              synced {formatAgo(account.starlingLastSyncedAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

const card = (color: string, clickable: boolean): React.CSSProperties => ({
  background: '#fff',
  border: `1px solid #e5e7eb`,
  borderLeft: `4px solid ${color}`,
  borderRadius: 10,
  padding: '14px 16px',
  cursor: clickable ? 'pointer' : 'default',
})
const iconBox = (color: string): React.CSSProperties => ({
  width: 36,
  height: 36,
  borderRadius: 8,
  background: color + '22',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  flexShrink: 0,
})
