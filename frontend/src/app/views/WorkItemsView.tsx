import { ICONS, type StateKey, type WorkGroup } from '../data'
import Icon from '../Icon'

interface Props {
  layout: 'list' | 'board'
  setLayout: (l: 'list' | 'board') => void
  groups: WorkGroup[]
  nextKey: string
  quickAddText: string
  onOpenQuickAdd: (g: StateKey) => void
  onQuickAddInput: (v: string) => void
  onQuickAddKey: (e: React.KeyboardEvent) => void
  onCycleState: (id: number) => void
  onCyclePriority: (id: number) => void
  onCardDragStart: (id: number) => void
  onCardDragEnd: () => void
  onColDragOver: (g: StateKey) => void
  onColDragLeave: () => void
  onColDrop: (g: StateKey) => void
}

const dueBadge = (due: string) => (
  <span title={due} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border-strong)', color: 'var(--txt-tertiary)', fontSize: 11, fontWeight: 500, boxSizing: 'border-box' }}>
    <Icon path={ICONS.calendar} size={11} /> {due}
  </span>
)

const avatar = (initial: string, name: string, bg: string, size = 22) => (
  <span title={name} style={{ width: size, height: size, borderRadius: '50%', background: bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size <= 20 ? 9 : 10, fontWeight: 600 }}>{initial}</span>
)

export default function WorkItemsView(p: Props) {
  const isList = p.layout === 'list'

  const toggleBtn = (active: boolean, onClick: () => void, path: string, title: string) => (
    <button onClick={onClick} title={title}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 24, borderRadius: 5, border: 'none', cursor: 'pointer', background: active ? 'var(--bg-surface-1)' : 'transparent', color: active ? 'var(--txt-primary)' : 'var(--txt-tertiary)', boxShadow: active ? 'var(--shadow-raised-100)' : 'none' }}>
      <Icon path={path} size={14} />
    </button>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Sub header */}
      <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 21px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-layer-1)', borderRadius: 6, padding: 2 }}>
          {toggleBtn(isList, () => p.setLayout('list'), ICONS.list, 'List layout')}
          {toggleBtn(!isList, () => p.setLayout('board'), ICONS.board, 'Board layout')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="hov-layer" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Icon path={ICONS.filters} size={13} /> Filters
          </button>
          <button className="hov-layer" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            Display <Icon path={ICONS.chevronDown} size={13} sw={2} />
          </button>
        </div>
      </div>

      {/* LIST LAYOUT */}
      {isList && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {p.groups.map((g) => (
            <div key={g.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 21px', background: 'var(--bg-surface-2)', position: 'sticky', top: 0, zIndex: 2 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: `3px solid ${g.color}`, boxSizing: 'border-box', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)' }}>{g.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>{g.count}</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => p.onOpenQuickAdd(g.key)} title="New work item" className="hov-layer-active"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', cursor: 'pointer' }}>
                  <Icon path={ICONS.plus} size={14} sw={2} />
                </button>
              </div>
              {g.items.map((row) => (
                <div key={row.id} className="hov-layer" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0 21px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', background: 'transparent' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-tertiary)', flexShrink: 0, minWidth: 58 }}>{row.key}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{row.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {row.labels.map((lb) => (
                      <span key={lb.name} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: lb.bg, color: lb.color }}>{lb.name}</span>
                    ))}
                    <button onClick={() => p.onCyclePriority(row.id)} title="Priority — click to change" className="hov-layer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22, width: 24, borderRadius: 5, border: '1px solid var(--border-strong)', background: 'transparent', color: row.priorityColor, cursor: 'pointer' }}>
                      <Icon path={row.priorityPath} size={12} sw={2.4} />
                    </button>
                    <button onClick={() => p.onCycleState(row.id)} title={`${row.stateLabel} — click to change`} className="hov-layer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', border: `2.5px solid ${row.stateColor}`, boxSizing: 'border-box' }} />
                      {row.stateLabel}
                    </button>
                    {dueBadge(row.due)}
                    {avatar(row.assigneeInitial, row.assigneeName, row.assigneeBg)}
                  </div>
                </div>
              ))}
              {g.isQuickAdd && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 21px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--layer-transparent-hover)' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-placeholder)', minWidth: 58 }}>{p.nextKey}</span>
                  <input value={p.quickAddText} onChange={(e) => p.onQuickAddInput(e.target.value)} onKeyDown={p.onQuickAddKey}
                    placeholder="Type a title, then press Enter. Esc to cancel." autoFocus
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--txt-primary)', fontSize: 13, fontWeight: 500, padding: '4px 0' }} />
                </div>
              )}
            </div>
          ))}
          <div style={{ height: 40 }} />
        </div>
      )}

      {/* BOARD LAYOUT */}
      {!isList && (
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', background: 'var(--bg-surface-2)' }}>
          <div style={{ display: 'flex', gap: 12, padding: '16px 21px', height: '100%', boxSizing: 'border-box', alignItems: 'flex-start' }}>
            {p.groups.map((col) => (
              <div key={col.key}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; p.onColDragOver(col.key) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) p.onColDragLeave() }}
                onDrop={(e) => { e.preventDefault(); p.onColDrop(col.key) }}
                style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: '100%', borderRadius: 8, background: col.dropBg, transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 10px 8px', flexShrink: 0 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', border: `3px solid ${col.color}`, boxSizing: 'border-box', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)' }}>{col.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>{col.count}</span>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => p.onOpenQuickAdd(col.key)} title="New work item" className="hov-layer-active"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', cursor: 'pointer' }}>
                    <Icon path={ICONS.plus} size={14} sw={2} />
                  </button>
                </div>
                <div style={{ overflowY: 'auto', padding: '0 8px 8px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.items.map((card) => (
                    <div key={card.id} draggable className="hov-border"
                      onDragStart={() => p.onCardDragStart(card.id)} onDragEnd={p.onCardDragEnd}
                      style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-layer-2)', borderRadius: 8, padding: 12, boxShadow: 'var(--shadow-raised-100)', cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 6, opacity: card.dragOpacity }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-tertiary)' }}>{card.key}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', lineHeight: 1.4 }}>{card.name}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 4 }}>
                        <button onClick={() => p.onCyclePriority(card.id)} title="Priority — click to change" className="hov-layer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20, width: 22, borderRadius: 4, border: '1px solid var(--border-strong)', background: 'transparent', color: card.priorityColor, cursor: 'pointer' }}>
                          <Icon path={card.priorityPath} size={11} sw={2.4} />
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, height: 20, padding: '0 6px', borderRadius: 4, border: '1px solid var(--border-strong)', color: 'var(--txt-tertiary)', fontSize: 11, fontWeight: 500, boxSizing: 'border-box' }}>
                          <Icon path={ICONS.calendar} size={11} /> {card.due}
                        </span>
                        {card.labels.map((clb) => (
                          <span key={clb.name} style={{ fontSize: 11, fontWeight: 500, padding: '1px 7px', borderRadius: 99, background: clb.bg, color: clb.color }}>{clb.name}</span>
                        ))}
                        <div style={{ flex: 1 }} />
                        {avatar(card.assigneeInitial, card.assigneeName, card.assigneeBg, 20)}
                      </div>
                    </div>
                  ))}
                  {col.isQuickAdd && (
                    <div style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-layer-2)', borderRadius: 8, padding: '10px 12px' }}>
                      <input value={p.quickAddText} onChange={(e) => p.onQuickAddInput(e.target.value)} onKeyDown={p.onQuickAddKey}
                        placeholder="Title, Enter to add" autoFocus
                        style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--txt-primary)', fontSize: 13, fontWeight: 500, boxSizing: 'border-box' }} />
                    </div>
                  )}
                  <button onClick={() => p.onOpenQuickAdd(col.key)} className="hov-layer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', fontSize: 12, fontWeight: 500, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>
                    <Icon path={ICONS.plus} size={13} sw={2} /> New work item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
