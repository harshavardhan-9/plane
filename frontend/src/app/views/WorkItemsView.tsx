import { useEffect, useRef, useState } from 'react'
import { ICONS, type WorkGroup } from '../data'
import Icon from '../Icon'

export interface SearchRow { id: string; key: string; title: string }

interface Props {
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
  searchQuery: string
  onSearchInput: (v: string) => void
  searchResults: SearchRow[]
  onSelectSearchResult: (id: string) => void
}

const avatar = (initial: string, name: string, bg: string, size = 20) => (
  <span title={name} style={{ width: size, height: size, borderRadius: '50%', background: bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600 }}>{initial}</span>
)

// Controlled quick-add input that refocuses itself whenever it becomes the
// active group (e.g. right after a create, when the parent re-renders).
function QuickAddInput({ value, onChange, onKey, placeholder }: { value: string; onChange: (v: string) => void; onKey: (e: React.KeyboardEvent) => void; placeholder: string }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <input
      ref={ref} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey}
      placeholder={placeholder}
      style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--txt-primary)', fontSize: 13, fontWeight: 500, boxSizing: 'border-box' }}
    />
  )
}

export default function WorkItemsView(p: Props) {
  const [searchFocused, setSearchFocused] = useState(false)
  const showDropdown = searchFocused && p.searchQuery.trim().length > 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Sub header — plain search, no filters/display/layout toggle */}
      <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 21px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ position: 'relative', width: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'var(--bg-surface-1)' }}>
            <Icon path={ICONS.search} size={13} sw={2} />
            <input
              value={p.searchQuery}
              onChange={(e) => p.onSearchInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Search work items…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--txt-primary)', fontSize: 12 }}
            />
          </div>
          {showDropdown && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', zIndex: 30, background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, boxShadow: 'var(--shadow-overlay-200)', padding: 4, maxHeight: 240, overflowY: 'auto' }}>
              {p.searchResults.length === 0 ? (
                <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--txt-placeholder)' }}>No results</div>
              ) : (
                p.searchResults.map((r) => (
                  <button key={r.id} onClick={() => p.onSelectSearchResult(r.id)} className="hov-layer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-tertiary)', flexShrink: 0 }}>{r.key}</span>
                    <span style={{ fontSize: 13, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOARD */}
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
                      {avatar(card.assigneeInitial, card.assigneeName, card.assigneeBg)}
                    </div>
                  </div>
                ))}
                {col.isQuickAdd && (
                  <div style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-layer-2)', borderRadius: 8, padding: '10px 12px' }}>
                    <QuickAddInput value={p.quickAddText} onChange={p.onQuickAddInput} onKey={p.onQuickAddKey} placeholder="Title, Enter to add" />
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
    </div>
  )
}
