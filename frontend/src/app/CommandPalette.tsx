import { ICONS } from './data'
import Icon from './Icon'

export interface PaletteRow {
  key: string
  label: string
  color: string
  showDot: boolean
  showKey: boolean
  onClick: () => void
}

export interface PaletteGroup { label: string; rows: PaletteRow[] }

interface Props {
  query: string
  groups: PaletteGroup[]
  onInput: (v: string) => void
  onClose: () => void
}

export default function CommandPalette(p: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '14vh' }}>
      <div onClick={p.onClose} style={{ position: 'absolute', inset: 0, background: 'oklch(0.1482 0.0034 196.79 / 25%)' }} />
      <div style={{ position: 'relative', width: 560, maxWidth: '92vw', maxHeight: '60vh', background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, boxShadow: 'var(--shadow-overlay-200)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 48, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <span style={{ display: 'inline-flex', width: 15, height: 15, color: 'var(--txt-placeholder)' }}>
            <Icon path={ICONS.search} size={15} sw={2} />
          </span>
          <input
            value={p.query}
            onChange={(e) => p.onInput(e.target.value)}
            placeholder="Search work items or type a command…"
            autoFocus
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--txt-primary)', fontSize: 14 }}
          />
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--txt-placeholder)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '2px 6px' }}>Esc</span>
        </div>
        <div style={{ overflowY: 'auto', padding: 8 }}>
          {p.groups.map((pg) => (
            <div key={pg.label} style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingBottom: 6 }}>
              <div style={{ padding: '6px 8px 2px 8px', fontSize: 11, fontWeight: 600, color: 'var(--txt-placeholder)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{pg.label}</div>
              {pg.rows.map((pr, i) => (
                <button key={i} onClick={pr.onClick} className="hov-layer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                  {pr.showDot && (
                    <span style={{ width: 9, height: 9, borderRadius: '50%', border: `2.5px solid ${pr.color}`, boxSizing: 'border-box', flexShrink: 0 }} />
                  )}
                  {pr.showKey && (
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-tertiary)', flexShrink: 0 }}>{pr.key}</span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.label}</span>
                </button>
              ))}
            </div>
          ))}
          {p.groups.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--txt-placeholder)' }}>No results</div>
          )}
        </div>
      </div>
    </div>
  )
}
