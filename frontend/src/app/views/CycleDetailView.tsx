import { ICONS } from '../data'
import Icon from '../Icon'

export interface CycleRow {
  id: string
  key: string
  name: string
  stateColor: string
  stateLabel: string
  priorityColor: string
  priorityPath: string
  assigneeInitial: string
  assigneeBg: string
  assigneeName: string
  due: string
}

export interface CycleDetail {
  name: string
  range: string
  progressLabel: string
  dashOffset: number
  total: number
  done: number
  inProgress: number
  badge: string
  badgeBg: string
  badgeColor: string
  actualPoints: string
  rows: CycleRow[]
}

interface Props {
  cd: CycleDetail
  onBack: () => void
  onOpenPeek: (id: string) => void
}

export default function CycleDetailView({ cd, onBack, onOpenPeek }: Props) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px 21px 20px 21px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={onBack} className="hov-layer" style={{ display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content', border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', fontSize: 12, fontWeight: 500, padding: '3px 6px', marginLeft: -6, borderRadius: 5, cursor: 'pointer' }}>
          <Icon path={ICONS.chevronLeft} size={13} sw={2} />
          Cycles
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <svg width="40" height="40" viewBox="0 0 30 30" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="15" cy="15" r="12" fill="none" stroke="var(--bg-layer-3)" strokeWidth="3" />
            <circle cx="15" cy="15" r="12" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray="75.4" strokeDashoffset={cd.dashOffset} />
            <text x="15" y="15" transform="rotate(90 15 15)" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 7, fontWeight: 600, fill: 'var(--txt-primary)' }}>{cd.progressLabel}</text>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt-primary)' }}>{cd.name}</span>
            <span style={{ fontSize: 12, color: 'var(--txt-tertiary)' }}>{cd.range}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99, background: cd.badgeBg, color: cd.badgeColor }}>{cd.badge}</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--txt-tertiary)' }}>
            <span><span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{cd.total}</span> work items</span>
            <span><span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{cd.done}</span> done</span>
            <span><span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{cd.inProgress}</span> in progress</span>
          </div>
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-tertiary)' }}>Burndown</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--txt-placeholder)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 2, background: 'var(--accent-primary)', borderRadius: 1 }} />Actual</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 0, borderTop: '2px dashed var(--border-strong-1)' }} />Ideal</span>
            </span>
          </div>
          <svg viewBox="0 0 520 120" preserveAspectRatio="none" style={{ width: '100%', height: 120, display: 'block' }}>
            <line x1="10" y1="10" x2="510" y2="110" stroke="var(--border-strong-1)" strokeWidth="1.5" strokeDasharray="4 4" />
            <polyline points={cd.actualPoints} fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      {cd.rows.map((cr) => (
        <div key={cr.id} onClick={() => onOpenPeek(cr.id)} className="hov-layer"
          style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0 21px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-tertiary)', flexShrink: 0, minWidth: 58 }}>{cr.key}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{cr.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22, width: 24, borderRadius: 5, border: '1px solid var(--border-strong)', color: cr.priorityColor, boxSizing: 'border-box' }}>
              <span style={{ display: 'inline-flex', width: 12, height: 12 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ width: '100%', height: '100%' }}><path d={cr.priorityPath} /></svg>
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border-strong)', color: 'var(--txt-secondary)', fontSize: 11, fontWeight: 500, boxSizing: 'border-box' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', border: `2.5px solid ${cr.stateColor}`, boxSizing: 'border-box' }} />
              {cr.stateLabel}
            </span>
            <span title={cr.assigneeName} style={{ width: 22, height: 22, borderRadius: '50%', background: cr.assigneeBg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>{cr.assigneeInitial}</span>
          </div>
        </div>
      ))}
      <div style={{ height: 40 }} />
    </div>
  )
}
