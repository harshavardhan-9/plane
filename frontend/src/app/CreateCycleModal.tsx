interface Props {
  name: string
  startDate: string
  endDate: string
  desc: string
  pending?: boolean
  error?: string
  onName: (v: string) => void
  onStartDate: (v: string) => void
  onEndDate: (v: string) => void
  onDesc: (v: string) => void
  onClose: () => void
  onCreate: () => void
}

const fieldInput: React.CSSProperties = {
  height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)',
  background: 'var(--bg-surface-1)', color: 'var(--txt-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'var(--border-strong)' },
}

export default function CreateCycleModal(p: Props) {
  const canCreate = p.name.trim().length > 0 && !p.pending
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}>
      <div onClick={p.onClose} style={{ position: 'absolute', inset: 0, background: 'oklch(0.1482 0.0034 196.79 / 25%)' }} />
      <div style={{ position: 'relative', width: 480, maxWidth: '92vw', background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, boxShadow: 'var(--shadow-overlay-200)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 0 20px', fontSize: 16, fontWeight: 600, color: 'var(--txt-primary)' }}>Create cycle</div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Name</label>
            <input value={p.name} onChange={(e) => p.onName(e.target.value)} placeholder="e.g. Cycle 4 — Stabilization" autoFocus style={fieldInput} {...focusProps} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Start date</label>
              <input type="date" value={p.startDate} onChange={(e) => p.onStartDate(e.target.value)} style={fieldInput} {...focusProps} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-tertiary)' }}>End date</label>
              <input type="date" value={p.endDate} onChange={(e) => p.onEndDate(e.target.value)} style={fieldInput} {...focusProps} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Description</label>
            <textarea
              value={p.desc} onChange={(e) => p.onDesc(e.target.value)} placeholder="What's the goal of this cycle?" rows={3}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'var(--bg-surface-1)', color: 'var(--txt-primary)', fontSize: 13, lineHeight: 1.5, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              {...focusProps}
            />
          </div>
          {p.error && (
            <div style={{ fontSize: 12, color: 'var(--danger-text)' }}>{p.error}</div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={p.onClose} className="hov-layer" style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={p.onCreate}
            className={canCreate ? 'hov-accent' : ''}
            style={{ height: 32, padding: '0 14px', borderRadius: 6, border: 'none', background: canCreate ? 'var(--accent-primary)' : 'var(--border-strong)', color: 'var(--txt-on-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            {p.pending ? 'Creating...' : 'Create cycle'}
          </button>
        </div>
      </div>
    </div>
  )
}
