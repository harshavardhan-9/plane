export interface NotifRow {
  id: number
  initial: string
  bg: string
  name: string
  action: string
  target: string
  snippet: string
  time: string
  read: boolean
}

interface Props {
  rows: NotifRow[]
  unreadLabel: string
  onMarkRead: (id: number) => void
  onMarkAllRead: () => void
}

export default function InboxView({ rows, unreadLabel, onMarkRead, onMarkAllRead }: Props) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 21px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--txt-primary)' }}>Inbox</span>
          <span style={{ fontSize: 12, color: 'var(--txt-tertiary)' }}>{unreadLabel}</span>
        </div>
        <button onClick={onMarkAllRead} className="hov-layer" style={{ height: 26, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          Mark all read
        </button>
      </div>
      {rows.map((nf) => (
        <div key={nf.id} onClick={() => onMarkRead(nf.id)} className="hov-layer"
          style={{ display: 'flex', gap: 12, padding: '14px 21px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', background: nf.read ? 'transparent' : 'var(--accent-subtle)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)', marginTop: 8, flexShrink: 0, opacity: nf.read ? 0 : 1 }} />
          <span style={{ width: 26, height: 26, borderRadius: '50%', background: nf.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{nf.initial}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--txt-secondary)', lineHeight: 1.45 }}>
              <span style={{ fontWeight: nf.read ? 500 : 600, color: 'var(--txt-primary)' }}>{nf.name}</span> {nf.action} <span style={{ fontWeight: 500, color: 'var(--txt-primary)' }}>{nf.target}</span>
            </div>
            {nf.snippet && (
              <span style={{ fontSize: 12, color: 'var(--txt-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nf.snippet}</span>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'var(--txt-placeholder)', flexShrink: 0 }}>{nf.time}</span>
        </div>
      ))}
    </div>
  )
}
