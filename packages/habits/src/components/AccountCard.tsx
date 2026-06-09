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

export function AccountCard({ account, balance, onClick }: Props) {
  const icon = TYPE_ICONS[account.type] ?? '🏦'

  return (
    <div style={card(!!onClick)} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={iconBox}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: hand, fontSize: 24, lineHeight: 1.1, color: S.ink }}>{account.name}</div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.15em', color: S.inkSoft, marginTop: 2, textTransform: 'uppercase' as const, opacity: 0.65 }}>
            {account.type}{account.provider === 'starling' ? ' · Starling' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: hand, fontSize: 36, lineHeight: 1, color: balance < 0 ? S.coral : S.ink }}>
            £{Math.abs(balance).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {balance < 0 && (
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.12em', color: S.coral, marginTop: 2 }}>OVERDRAWN</div>
          )}
          {account.starlingLastSyncedAt && (
            <div style={{ fontFamily: mono, fontSize: 10, color: S.inkSoft, opacity: 0.5, marginTop: 2 }}>
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

const card = (clickable: boolean): React.CSSProperties => ({
  background: '#fff',
  boxShadow: '0 8px 18px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
  borderRadius: 4,
  padding: '14px 16px',
  cursor: clickable ? 'pointer' : 'default',
  fontFamily: body,
  marginBottom: 10,
})
const iconBox: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 4,
  background: S.paperD,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  flexShrink: 0,
}
