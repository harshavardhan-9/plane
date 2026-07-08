import { useEffect, useRef, useState } from 'react'
import { ICONS, PRIORITIES, PRIORITY_ORDER, type WorkGroup, type PriorityKey } from '../data'
import Icon from '../Icon'

export type GroupBy = 'state' | 'priority' | 'assignee'

interface Props {
  layout: 'list' | 'board'
  setLayout: (l: 'list' | 'board') => void
  groups: WorkGroup[]
  nextKey: string
  quickAddText: string
  onOpenQuickAdd: (g: string) => void
  onQuickAddInput: (v: string) => void
  onQuickAddKey: (e: React.KeyboardEvent) => void
  onCycleState: (id: string) => void
  onCyclePriority: (id: string) => void
  onOpenPeek: (id: string) => void
  onCardDragStart: (id: string) => void
  onCardDragEnd: () => void
  onColDragOver: (g: string) => void
  onColDragLeave: () => void
  onColDrop: (g: string) => void
  groupBy: GroupBy
  onGroupByChange: (g: GroupBy) => void
  priorityFilter: Set<PriorityKey>
  onTogglePriorityFilter: (p: PriorityKey) => void
  assigneeOptions: { id: string; name: string }[]
  assigneeFilter: Set<string>
  onToggleAssigneeFilter: (id: string) => void
  onClearFilters: () => void
  activeFilterCount: number
}

const dueBadge = (due: string) => (
  <span title={due} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border-strong)', color: 'var(--txt-tertiary)', fontSize: 11, fontWeight: 500, boxSizing: 'border-box' }}>
    <Icon path={ICONS.calendar} size={11} /> {due}
  </span>
)

const avatar = (initial: string, name: string, bg: string, size = 22) => (
  <span title={name} style={{ width: size, height: size, borderRadius: '50%', background: bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size <= 20 ? 9 : 10, fontWeight: 600 }}>{initial}</span>
)

// Controlled quick-add row that refocuses itself whenever it becomes the active group
// (e.g. right after a create, when the parent re-renders with fresh data).
function QuickAddInput({ value, onChange, onKey, placeholder, wide }: { value: string; onChange: (v: string) => void; onKey: (e: React.KeyboardEvent) => void; placeholder: string; wide?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <input
      ref={ref} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey}
      placeholder={placeholder}
      style={{ flex: wide ? undefined : 1, width: wide ? '100%' : undefined, border: 'none', outline: 'none', background: 'transparent', color: 'var(--txt-primary)', fontSize: 13, fontWeight: 500, padding: wide ? 0 : '4px 0', boxSizing: 'border-box' }}
    />
  )
}

export default function WorkItemsView(p: Props) {
  const isList = p.layout === 'list'
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false)

  const toggleBtn = (active: boolean, onClick: () => void, path: string, title: string) => (
    <button onClick={onClick} title={title}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 24, borderRadius: 5, border: 'none', cursor: 'pointer', background: active ? 'var(--bg-surface-1)' : 'transparent', color: active ? 'var(--txt-primary)' : 'var(--txt-tertiary)', boxShadow: active ? 'var(--shadow-raised-100)' : 'none' }}>
      <Icon path={path} size={14} />
    </button>
  )

  const dropdownWrap = (open: boolean, onClose: () => void, content: React.ReactNode) => open && (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 41, width: 220, background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, boxShadow: 'var(--shadow-overlay-200)', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {content}
      </div>
    </>
  )

  const checkRow = (label: string, checked: boolean, onClick: () => void, dotColor?: string) => (
    <button key={label} onClick={onClick} className="hov-layer"
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${checked ? 'var(--accent-primary)' : 'var(--border-strong)'}`, background: checked ? 'var(--accent-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {checked && <Icon path={ICONS.check} size={10} sw={3} />}
      </span>
      {dotColor && <span style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${dotColor}`, boxSizing: 'border-box', flexShrink: 0 }} />}
      <span style={{ fontSize: 13, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )

  const radioRow = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick} className="hov-layer"
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 6px', borderRadius: 6, border: 'none', background: active ? 'var(--layer-transparent-active)' : 'transparent', color: active ? 'var(--txt-primary)' : 'var(--txt-secondary)', fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
      {label}
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
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setFiltersOpen((o) => !o); setDisplayOpen(false) }} className="hov-layer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: p.activeFilterCount > 0 ? 'var(--accent-subtle)' : 'transparent', color: p.activeFilterCount > 0 ? 'var(--accent-primary)' : 'var(--txt-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              <Icon path={ICONS.filters} size={13} /> Filters{p.activeFilterCount > 0 ? ` (${p.activeFilterCount})` : ''}
            </button>
            {dropdownWrap(filtersOpen, () => setFiltersOpen(false), (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-placeholder)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Priority</span>
                  {p.activeFilterCount > 0 && (
                    <button onClick={p.onClearFilters} style={{ fontSize: 11, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear</button>
                  )}
                </div>
                {[...PRIORITY_ORDER].reverse().map((pk) =>
                  checkRow(pk.charAt(0).toUpperCase() + pk.slice(1), p.priorityFilter.has(pk), () => p.onTogglePriorityFilter(pk), PRIORITIES[pk].color))}
                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '2px 0' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-placeholder)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assignee</span>
                {p.assigneeOptions.map((a) =>
                  checkRow(a.name, p.assigneeFilter.has(a.id), () => p.onToggleAssigneeFilter(a.id)))}
              </>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setDisplayOpen((o) => !o); setFiltersOpen(false) }} className="hov-layer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              Display <Icon path={ICONS.chevronDown} size={13} sw={2} />
            </button>
            {dropdownWrap(displayOpen, () => setDisplayOpen(false), (
              <>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-placeholder)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Group by</span>
                {radioRow('State', p.groupBy === 'state', () => { p.onGroupByChange('state'); setDisplayOpen(false) })}
                {radioRow('Priority', p.groupBy === 'priority', () => { p.onGroupByChange('priority'); setDisplayOpen(false) })}
                {radioRow('Assignee', p.groupBy === 'assignee', () => { p.onGroupByChange('assignee'); setDisplayOpen(false) })}
              </>
            ))}
          </div>
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
                <div key={row.id} onClick={() => p.onOpenPeek(row.id)} className="hov-layer" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0 21px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', background: 'transparent' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-tertiary)', flexShrink: 0, minWidth: 58 }}>{row.key}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{row.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {row.labels.map((lb) => (
                      <span key={lb.name} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: lb.bg, color: lb.color }}>{lb.name}</span>
                    ))}
                    <button onClick={(e) => { e.stopPropagation(); p.onCyclePriority(row.id) }} title="Priority — click to change" className="hov-layer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22, width: 24, borderRadius: 5, border: '1px solid var(--border-strong)', background: 'transparent', color: row.priorityColor, cursor: 'pointer' }}>
                      <Icon path={row.priorityPath} size={12} sw={2.4} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); p.onCycleState(row.id) }} title={`${row.stateLabel} — click to change`} className="hov-layer"
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
                  <QuickAddInput value={p.quickAddText} onChange={p.onQuickAddInput} onKey={p.onQuickAddKey} placeholder="Type a title, then press Enter. Esc to cancel." />
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
                      onClick={() => p.onOpenPeek(card.id)}
                      onDragStart={() => p.onCardDragStart(card.id)} onDragEnd={p.onCardDragEnd}
                      style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-layer-2)', borderRadius: 8, padding: 12, boxShadow: 'var(--shadow-raised-100)', cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 6, opacity: card.dragOpacity }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-tertiary)' }}>{card.key}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', lineHeight: 1.4 }}>{card.name}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); p.onCyclePriority(card.id) }} title="Priority — click to change" className="hov-layer"
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
                      <QuickAddInput value={p.quickAddText} onChange={p.onQuickAddInput} onKey={p.onQuickAddKey} placeholder="Title, Enter to add" wide />
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
