import { ICONS, type RowLabel } from './data'
import Icon from './Icon'

export interface PeekData {
  key: string
  name: string
  desc: string
  stateLabel: string
  stateColor: string
  priorityLabel: string
  priorityColor: string
  priorityPath: string
  assigneeName: string
  assigneeInitial: string
  assigneeBg: string
  due: string
  cycleName: string
  labels: RowLabel[]
}

export interface PeekComment { initial: string; name: string; bg: string; text: string; time: string }
export interface PeekActivity { text: string; time: string }

interface Props {
  projectName: string
  peek: PeekData
  comments: PeekComment[]
  activity: PeekActivity[]
  commentText: string
  onClose: () => void
  onName: (v: string) => void
  onDesc: (v: string) => void
  onCycleState: () => void
  onCyclePriority: () => void
  onCycleAssignee: () => void
  onCommentInput: (v: string) => void
  onAddComment: () => void
}

const propBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 8px', borderRadius: 5,
  border: '1px solid var(--border-strong)', background: 'var(--bg-surface-1)', color: 'var(--txt-secondary)',
  fontSize: 12, fontWeight: 500, cursor: 'pointer', width: 'fit-content',
}

const propChip: React.CSSProperties = { ...propBtn, cursor: 'default', boxSizing: 'border-box' }

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, color: 'var(--txt-placeholder)' }}>{label}</span>
      {children}
    </div>
  )
}

export default function PeekPanel(p: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div onClick={p.onClose} style={{ position: 'absolute', inset: 0, background: 'oklch(0.1482 0.0034 196.79 / 25%)' }} />
      <div style={{ position: 'absolute', top: 8, right: 8, bottom: 8, width: 640, maxWidth: 'calc(100vw - 90px)', background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, boxShadow: 'var(--shadow-overlay-200)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-tertiary)' }}>{p.projectName} › {p.peek.key}</span>
          <button onClick={p.onClose} title="Close" className="hov-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', cursor: 'pointer' }}>
            <Icon path={ICONS.close} size={14} sw={2} />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Main column */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={p.peek.name}
                onChange={(e) => p.onName(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--txt-primary)', fontSize: 18, fontWeight: 600, width: '100%', padding: 0, boxSizing: 'border-box' }}
              />
              <textarea
                value={p.peek.desc}
                onChange={(e) => p.onDesc(e.target.value)}
                placeholder="Click to add a description…"
                rows={4}
                style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 13, lineHeight: 1.6, width: '100%', resize: 'vertical', padding: 0, boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {/* Comments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-tertiary)' }}>Comments</div>
              {p.comments.map((cm, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: cm.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{cm.initial}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-primary)' }}>{cm.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--txt-placeholder)' }}>{cm.time}</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--txt-secondary)', lineHeight: 1.5 }}>{cm.text}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={p.commentText}
                  onChange={(e) => p.onCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') p.onAddComment() }}
                  placeholder="Add a comment…"
                  style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--txt-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                />
                <button onClick={p.onAddComment} className="hov-accent" style={{ height: 34, padding: '0 12px', borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                  Comment
                </button>
              </div>
            </div>

            {/* Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-tertiary)' }}>Activity</div>
              {p.activity.map((ac, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border-strong-1)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--txt-tertiary)', flex: 1 }}>{ac.text}</span>
                  <span style={{ fontSize: 11, color: 'var(--txt-placeholder)' }}>{ac.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Properties rail */}
          <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', background: 'var(--bg-surface-2)', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-tertiary)' }}>Properties</div>
            <PropRow label="State">
              <button onClick={p.onCycleState} title="Click to change" className="hov-border" style={propBtn}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', border: `2.5px solid ${p.peek.stateColor}`, boxSizing: 'border-box' }} />
                {p.peek.stateLabel}
              </button>
            </PropRow>
            <PropRow label="Priority">
              <button onClick={p.onCyclePriority} title="Click to change" className="hov-border" style={propBtn}>
                <span style={{ display: 'inline-flex', width: 12, height: 12, color: p.peek.priorityColor }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ width: '100%', height: '100%' }}><path d={p.peek.priorityPath} /></svg>
                </span>
                {p.peek.priorityLabel}
              </button>
            </PropRow>
            <PropRow label="Assignee">
              <button onClick={p.onCycleAssignee} title="Click to change" className="hov-border" style={propBtn}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.peek.assigneeBg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600 }}>{p.peek.assigneeInitial}</span>
                {p.peek.assigneeName}
              </button>
            </PropRow>
            <PropRow label="Due date">
              <span style={propChip}>
                <Icon path={ICONS.calendar} size={11} /> {p.peek.due}
              </span>
            </PropRow>
            <PropRow label="Cycle">
              <span style={propChip}>
                <Icon path={ICONS.cycles} size={11} /> {p.peek.cycleName}
              </span>
            </PropRow>
            <PropRow label="Labels">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {p.peek.labels.map((lb) => (
                  <span key={lb.name} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: lb.bg, color: lb.color }}>{lb.name}</span>
                ))}
              </div>
            </PropRow>
          </div>
        </div>
      </div>
    </div>
  )
}
