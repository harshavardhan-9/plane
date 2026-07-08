import type { Member } from '../data'

interface Props {
  workspaceName: string
  workspaceUrl: string
  members: Member[]
  inviteText: string
  onInviteInput: (v: string) => void
  onInvite: () => void
}

const fieldInput: React.CSSProperties = {
  height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)',
  background: 'var(--bg-surface-1)', color: 'var(--txt-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

export default function SettingsView(p: Props) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--txt-primary)' }}>Workspace settings</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)' }}>General</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Workspace name</label>
              <input value={p.workspaceName} readOnly style={fieldInput} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Workspace URL</label>
              <input value={p.workspaceUrl} readOnly style={{ ...fieldInput, background: 'var(--bg-layer-1)', color: 'var(--txt-tertiary)' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)' }}>Members</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={p.inviteText}
              onChange={(e) => p.onInviteInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') p.onInvite() }}
              placeholder="teammate@company.com"
              type="email"
              style={{ ...fieldInput, flex: 1 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            />
            <button onClick={p.onInvite} className="hov-accent" style={{ height: 34, padding: '0 14px', borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Invite
            </button>
          </div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
            {p.members.map((mb, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: mb.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{mb.initial}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)' }}>{mb.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--txt-placeholder)' }}>{mb.email}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99, background: mb.roleBg, color: mb.roleColor }}>{mb.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
