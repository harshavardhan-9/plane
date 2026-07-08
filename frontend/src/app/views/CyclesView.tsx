export interface CycleListItem {
  id: string
  name: string
  range: string
  progressLabel: string
  dashOffset: number
  badge: string
  badgeBg: string
  badgeColor: string
}

export interface CycleListGroup { label: string; count: number; items: CycleListItem[] }

interface Props {
  groups: CycleListGroup[]
  userInitial: string
  onOpen: (id: string) => void
}

export default function CyclesView({ groups, userInitial, onOpen }: Props) {
  const total = groups.reduce((n, g) => n + g.count, 0)
  if (total === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--txt-placeholder)' }}>No cycles yet.</div>
      </div>
    )
  }
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {groups.filter((g) => g.count > 0).map((cg) => (
        <div key={cg.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 21px', background: 'var(--bg-surface-2)', position: 'sticky', top: 0, zIndex: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)' }}>{cg.label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>{cg.count}</span>
          </div>
          {cg.items.map((cy) => (
            <div key={cy.id} onClick={() => onOpen(cy.id)} className="hov-layer"
              style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 56, padding: '8px 21px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <svg width="30" height="30" viewBox="0 0 30 30" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="15" cy="15" r="12" fill="none" stroke="var(--bg-layer-3)" strokeWidth="3" />
                <circle cx="15" cy="15" r="12" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray="75.4" strokeDashoffset={cy.dashOffset} />
                <text x="15" y="15" transform="rotate(90 15 15)" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 8, fontWeight: 600, fill: 'var(--txt-primary)' }}>{cy.progressLabel}</text>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cy.name}</span>
                <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>{cy.range}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99, background: cy.badgeBg, color: cy.badgeColor }}>{cy.badge}</span>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'oklch(0.5527 0.1361 288.8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, border: '2px solid var(--bg-surface-1)', boxSizing: 'content-box' }}>{userInitial}</span>
                <button onClick={(e) => e.stopPropagation()} className="hov-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--txt-placeholder)', cursor: 'pointer' }}>
                  <span style={{ display: 'inline-flex', width: 14, height: 14 }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: '100%', height: '100%' }}>
                      <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
