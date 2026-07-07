import { ICONS, STATES, type Issue } from '../data'
import Icon from '../Icon'

interface Props {
  userName: string
  issues: Issue[]
  onGoWorkItems: () => void
  onGoCycles: () => void
}

export default function HomeView({ userName, issues, onGoWorkItems, onGoCycles }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const assigned = issues
    .filter((it) => it.assignee === 'A' && (it.state === 'unstarted' || it.state === 'started'))
    .map((it) => ({
      key: 'PERS-' + it.seq,
      name: it.name,
      due: it.due,
      stateColor: STATES.find((s) => s.key === it.state)!.color,
    }))

  const recents = [
    { name: 'Cycle 2 — Core features', meta: 'Cycle · updated 2h ago', iconPath: ICONS.cycles, go: onGoCycles },
    { name: 'Drag-and-drop ordering in board view', meta: 'Work item · updated 4h ago', iconPath: ICONS.workItems, go: onGoWorkItems },
    { name: 'Personal', meta: 'Project · visited yesterday', iconPath: ICONS.projects, go: onGoWorkItems },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-surface-1)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--txt-primary)' }}>{greeting}, {userName}</div>
          <div style={{ fontSize: 13, color: 'var(--txt-tertiary)' }}>{todayLabel}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)' }}>Assigned to you</div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
            {assigned.map((it) => (
              <div key={it.key} onClick={onGoWorkItems} className="hov-layer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', background: 'transparent' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', border: `2.5px solid ${it.stateColor}`, flexShrink: 0, boxSizing: 'border-box' }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-tertiary)', flexShrink: 0, minWidth: 56 }}>{it.key}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{it.name}</span>
                <span style={{ fontSize: 11, color: 'var(--txt-placeholder)', flexShrink: 0 }}>{it.due}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)' }}>Recents</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recents.map((rc) => (
              <div key={rc.name} onClick={rc.go} className="hov-layer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 6, cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, background: 'var(--bg-layer-1)', color: 'var(--txt-tertiary)', flexShrink: 0 }}>
                  <Icon path={rc.iconPath} size={13} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rc.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--txt-placeholder)' }}>{rc.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
