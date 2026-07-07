import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWorkspaces, createWorkspace } from '../../api/workspaces'
import { logout } from '../../api/auth'
import { clearAuth, getStoredUser } from '../../store/auth'

const WS_COLORS = ['#e11d48', '#7c3aed', '#2563eb', '#059669', '#d97706', '#0891b2', '#be185d']
const wsColor = (name: string) => WS_COLORS[name.charCodeAt(0) % WS_COLORS.length]

const inputStyle: React.CSSProperties = {
  height: 40, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-strong)',
  background: 'var(--bg-surface-1)', color: 'var(--txt-primary)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', width: '100%',
}

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--border-strong)' },
}

const plusIcon = (
  <span style={{ display: 'inline-flex', width: 14, height: 14 }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: '100%', height: '100%' }}>
      <path d="M5 12h14 M12 5v14" />
    </svg>
  </span>
)

export default function WorkspaceListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = getStoredUser()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '' })
  const [formError, setFormError] = useState('')

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  })

  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (ws) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      closeModal()
      navigate(`/${ws.slug}`)
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create workspace'),
  })

  const closeModal = () => {
    setShowCreate(false)
    setForm({ name: '', slug: '' })
    setFormError('')
  }

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
  }

  const handleCreate = () => {
    if (!form.name.trim() || !form.slug.trim()) { setFormError('Name and URL slug are required.'); return }
    setFormError('')
    createMutation.mutate({ name: form.name, slug: form.slug })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--txt-primary)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top bar — same as Login */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/plane-logo.png" alt="Plane" style={{ width: 26, height: 26, borderRadius: 6 }} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Plane</span>
        </div>
        <button
          onClick={handleLogout}
          style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--txt-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--txt-tertiary)' }}
        >
          Sign out
        </button>
      </div>

      {/* Body — same column rhythm as Login */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>Your workspaces</div>
              {user && (
                <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', lineHeight: 1.5 }}>{user.email}</div>
              )}
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="hov-layer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'var(--bg-surface-1)', color: 'var(--txt-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
            >
              {plusIcon} New workspace
            </button>
          </div>

          {/* List */}
          {isLoading ? (
            <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', textAlign: 'center', padding: '48px 0' }}>Loading...</div>
          ) : workspaces.length === 0 ? (
            /* Empty state — design's placeholder idiom */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg-layer-1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-placeholder)', marginBottom: 6 }}>
                <span style={{ display: 'inline-flex', width: 24, height: 24 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                    <path d="M16 21 V5 a2 2 0 0 0 -2 -2 h-4 a2 2 0 0 0 -2 2 v16 M2 9 a2 2 0 0 1 2 -2 h16 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 H4 a2 2 0 0 1 -2 -2 z" />
                  </svg>
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--txt-primary)' }}>No workspaces yet</div>
              <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', lineHeight: 1.5, maxWidth: 300 }}>
                Create a workspace to start managing your projects with your team.
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="hov-accent"
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 10 }}
              >
                {plusIcon} Create workspace
              </button>
            </div>
          ) : (
            /* Bordered list container — design's "Assigned to you" idiom */
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-surface-1)' }}>
              {workspaces.map((ws, i) => (
                <button
                  key={ws.id}
                  onClick={() => navigate(`/${ws.slug}`)}
                  className="hov-layer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', border: 'none', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, background: wsColor(ws.name), color: 'white', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                    {ws.name[0].toUpperCase()}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--txt-placeholder)', textTransform: 'capitalize' }}>{ws.role.toLowerCase()} · {ws.slug}</span>
                  </span>
                  <span style={{ display: 'inline-flex', width: 14, height: 14, color: 'var(--txt-placeholder)', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create workspace modal */}
      {showCreate && (
        <div
          style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, background: 'oklch(0.1482 0.0034 196.79 / 40%)' }}
          onClick={closeModal}
        >
          <div
            style={{ width: '100%', maxWidth: 400, borderRadius: 10, background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-overlay-200)', padding: 24, boxSizing: 'border-box' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--txt-primary)' }}>Create workspace</div>
              <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', lineHeight: 1.5 }}>
                A workspace is a shared space for your team's projects.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Workspace name</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm({ name, slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })
                    setFormError('')
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                  placeholder="e.g. Acme Inc."
                  autoFocus
                  style={inputStyle}
                  {...focusProps}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>URL slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => { setForm({ ...form, slug: e.target.value }); setFormError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                  placeholder="acme-inc"
                  style={inputStyle}
                  {...focusProps}
                />
              </div>

              {formError && (
                <div style={{ fontSize: 12, color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-flex', width: 13, height: 13 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: '100%', height: '100%' }}>
                      <path d="M12 3 a9 9 0 1 1 0 18 a9 9 0 0 1 0 -18 z M12 8v4 M12 16h.01" />
                    </svg>
                  </span>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button
                  onClick={closeModal}
                  className="hov-layer"
                  style={{ height: 36, padding: '0 14px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'var(--bg-surface-1)', color: 'var(--txt-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="hov-accent"
                  style={{ height: 36, padding: '0 14px', borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: createMutation.isPending ? 0.7 : 1 }}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create workspace'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
