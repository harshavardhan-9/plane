interface Props {
  userInitial: string
}

const CYCLES = [
  { name: 'Cycle 3 — Polish & launch', range: 'Jul 21 – Aug 3', progress: 0, group: 'upcoming' },
  { name: 'Cycle 2 — Core features', range: 'Jul 7 – Jul 20', progress: 45, group: 'active' },
  { name: 'Cycle 1 — Foundation', range: 'Jun 23 – Jul 6', progress: 100, group: 'completed' },
]

const badgeFor = (g: string) =>
  g === 'active'
    ? { badge: 'In progress', badgeBg: 'var(--warning-subtle)', badgeColor: 'var(--warning-text)' }
    : g === 'upcoming'
      ? { badge: 'Upcoming', badgeBg: 'var(--bg-layer-1)', badgeColor: 'var(--txt-tertiary)' }
      : { badge: 'Completed', badgeBg: 'var(--success-subtle)', badgeColor: 'var(--success-text)' }

const GROUPS = [
  { key: 'active', label: 'Active cycle' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
]

export default function CyclesView({ userInitial }: Props) {
  const cycleGroups = GROUPS.map((cg) => {
    const items = CYCLES.filter((c) => c.group === cg.key).map((c) => ({
      name: c.name,
      range: c.range,
      progressLabel: c.progress + '%',
      dashOffset: (75.4 * (100 - c.progress)) / 100,
      ...badgeFor(c.group),
    }))
    return { label: cg.label, count: items.length, items }
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {cycleGroups.map((cg) => (
        <div key={cg.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 21px', background: 'var(--bg-surface-2)', position: 'sticky', top: 0, zIndex: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)' }}>{cg.label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>{cg.count}</span>
          </div>
          {cg.items.map((cy) => (
            <div key={cy.name} className="hov-layer"
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'oklch(0.5527 0.1361 288.8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, border: '2px solid var(--bg-surface-1)', boxSizing: 'content-box' }}>{userInitial}</span>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'oklch(0.5704 0.1574 345.25)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, marginLeft: -7, border: '2px solid var(--bg-surface-1)', boxSizing: 'content-box' }}>S</span>
                </div>
                <button className="hov-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--txt-placeholder)', cursor: 'pointer' }}>
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
