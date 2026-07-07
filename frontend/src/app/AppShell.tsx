import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser, clearAuth } from '../store/auth'
import { logout } from '../api/auth'
import { getTheme, toggleTheme as applyToggleTheme } from '../store/theme'
import {
  ICONS, STATES, PRIORITIES, PRIORITY_ORDER, ASSIGNEES, LABELS, SEED_ISSUES,
  type Issue, type StateKey,
} from './data'
import Icon from './Icon'
import HomeView from './views/HomeView'
import WorkItemsView from './views/WorkItemsView'
import CyclesView from './views/CyclesView'
import PlaceholderView from './views/PlaceholderView'

type View =
  | 'home' | 'inbox' | 'work-items' | 'cycles' | 'modules' | 'pages'
  | 'views-v' | 'analytics' | 'intake' | 'settings'

const PLACEHOLDERS: Record<string, { title: string; desc: string; icon: keyof typeof ICONS }> = {
  modules: { title: 'No modules yet', desc: 'Group work items into modules to track larger bodies of work across cycles.', icon: 'modules' },
  pages: { title: 'Write it down with Pages', desc: 'Capture specs, notes and ideas alongside your work items.', icon: 'pages' },
  'views-v': { title: 'No saved views', desc: 'Save filter combinations as views to get back to them in one click.', icon: 'views' },
  analytics: { title: 'Analytics', desc: 'Trends across your projects will appear here once there is enough activity.', icon: 'analytics' },
  inbox: { title: "You're all caught up", desc: 'Notifications about your subscribed work items will show up here.', icon: 'inbox' },
  settings: { title: 'Workspace settings', desc: 'Members, billing, integrations and project defaults live here.', icon: 'home' },
  intake: { title: 'Intake is quiet', desc: 'Requests from guests and forms land here for triage.', icon: 'intake' },
}

export default function AppShell() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()
  const userName = storedUser?.displayName?.trim() || 'Aarav'
  const userInitial = (userName[0] || 'A').toUpperCase()

  const [theme, setThemeState] = useState(getTheme)
  const [view, setView] = useState<View>('work-items')
  const [layout, setLayout] = useState<'list' | 'board'>('list')
  const [projectOpen, setProjectOpen] = useState(true)
  const [quickAddGroup, setQuickAddGroup] = useState<StateKey | null>(null)
  const [quickAddText, setQuickAddText] = useState('')
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<StateKey | null>(null)
  const [seq, setSeq] = useState(25)
  const [issues, setIssues] = useState<Issue[]>(SEED_ISSUES)

  const changeView = (v: View) => { setView(v); setQuickAddGroup(null) }

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
  }

  const toggleTheme = () => { applyToggleTheme(); setThemeState(getTheme()) }

  const cycleState = (id: number) => {
    const order = STATES.map((s) => s.key)
    setIssues((list) => list.map((it) =>
      it.id === id ? { ...it, state: order[(order.indexOf(it.state) + 1) % order.length] } : it))
  }

  const cyclePriority = (id: number) => {
    setIssues((list) => list.map((it) =>
      it.id === id ? { ...it, priority: PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(it.priority) + 1) % PRIORITY_ORDER.length] } : it))
  }

  const openQuickAdd = (group: StateKey) => { setQuickAddGroup(group); setQuickAddText('') }

  const commitQuickAdd = () => {
    const name = quickAddText.trim()
    if (!name || !quickAddGroup) { setQuickAddGroup(null); setQuickAddText(''); return }
    setIssues((list) => [...list, { id: Date.now(), seq, name, state: quickAddGroup, priority: 'none', assignee: 'A', due: 'Jul 20', labels: [] }])
    setSeq((s) => s + 1)
    setQuickAddText('')
  }

  const onQuickAddKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitQuickAdd()
    if (e.key === 'Escape') { setQuickAddGroup(null); setQuickAddText('') }
  }

  const onColDrop = (group: StateKey) => {
    if (dragId != null) {
      setIssues((list) => list.map((it) => (it.id === dragId ? { ...it, state: group } : it)))
    }
    setDragId(null); setDragOverGroup(null)
  }

  // ─── Derived: grouped issues for list + board ───
  const groups = STATES.map((st) => {
    const items = issues.filter((it) => it.state === st.key).map((it) => {
      const pr = PRIORITIES[it.priority]
      const asg = ASSIGNEES[it.assignee]
      return {
        id: it.id,
        key: 'PERS-' + it.seq,
        name: it.name,
        stateLabel: st.label,
        stateColor: st.color,
        priorityColor: pr.color,
        priorityPath: pr.path,
        assigneeInitial: it.assignee,
        assigneeName: asg.name,
        assigneeBg: asg.bg,
        due: it.due,
        labels: it.labels.map((l) => LABELS[l]),
        dragOpacity: dragId === it.id ? 0.4 : 1,
      }
    })
    return {
      key: st.key,
      label: st.label,
      color: st.color,
      count: items.length,
      items,
      isQuickAdd: quickAddGroup === st.key,
      dropBg: dragOverGroup === st.key ? 'var(--layer-transparent-active)' : 'transparent',
    }
  })

  const railItems: { key: View; label: string; icon: keyof typeof ICONS }[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'inbox', label: 'Inbox', icon: 'inbox' },
    { key: 'work-items', label: 'Projects', icon: 'projects' },
    { key: 'views-v', label: 'Views', icon: 'views' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics' },
  ]
  const workspaceNav: { key: View; label: string; icon: keyof typeof ICONS }[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'inbox', label: 'Inbox', icon: 'inbox' },
    { key: 'views-v', label: 'Views', icon: 'views' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics' },
  ]
  const projectNav: { key: View; label: string; icon: keyof typeof ICONS }[] = [
    { key: 'work-items', label: 'Work items', icon: 'workItems' },
    { key: 'cycles', label: 'Cycles', icon: 'cycles' },
    { key: 'modules', label: 'Modules', icon: 'modules' },
    { key: 'pages', label: 'Pages', icon: 'pages' },
    { key: 'intake', label: 'Intake', icon: 'intake' },
  ]
  const tabDefs: { key: View; label: string }[] = [
    { key: 'work-items', label: 'Work items' },
    { key: 'cycles', label: 'Cycles' },
    { key: 'modules', label: 'Modules' },
    { key: 'pages', label: 'Pages' },
    { key: 'intake', label: 'Intake' },
  ]

  const ph = PLACEHOLDERS[view]
  const openQuickAddTodo = () => { setView('work-items'); setLayout('list'); setQuickAddGroup('unstarted'); setQuickAddText('') }

  const projectBadge = (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, background: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>P</span>
  )

  return (
    <div data-theme={theme} style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-canvas)', color: 'var(--txt-primary)', fontSize: 13 }}>

      {/* ============ APP RAIL ============ */}
      <div style={{ width: 60, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 8px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 2 }}>
            <img src="/plane-logo.png" alt="Plane" style={{ width: 26, height: 26, borderRadius: 6 }} />
          </div>
          {railItems.map((ri) => {
            const active = view === ri.key
            return (
              <button key={ri.key} onClick={() => changeView(ri.key)} title={ri.label}
                style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--txt-tertiary)' }}>
                <span className={active ? '' : 'hov-layer'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, background: active ? 'var(--layer-transparent-selected)' : 'transparent', color: active ? 'var(--txt-primary)' : 'var(--txt-tertiary)' }}>
                  <Icon path={ICONS[ri.icon]} size={20} />
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, color: active ? 'var(--txt-secondary)' : 'var(--txt-tertiary)' }}>{ri.label}</span>
              </button>
            )
          })}
          <div style={{ borderTop: '1px solid var(--border-strong)', margin: '0 8px' }} />
          <button onClick={() => setView('settings')} title="Settings"
            style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--txt-tertiary)' }}>
            <span className="hov-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6 }}>
              <Icon path={ICONS.settings} size={20} />
            </span>
            <span style={{ fontSize: 11, fontWeight: 500 }}>Settings</span>
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={handleLogout} title="Sign out"
            style={{ width: 30, height: 30, borderRadius: '50%', background: 'oklch(0.5527 0.1361 288.8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            {userInitial}
          </button>
        </div>
      </div>

      {/* ============ PROJECT SIDEBAR ============ */}
      <div style={{ width: 234, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '12px 0 0 0', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--txt-primary)' }}>Projects</span>
            <span style={{ color: 'var(--txt-tertiary)', cursor: 'pointer', display: 'inline-flex' }}><Icon path={ICONS.hamburger} size={16} /></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="hov-border" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'var(--bg-surface-1)', color: 'var(--txt-placeholder)', fontSize: 13, cursor: 'pointer', boxSizing: 'border-box' }}>
              <Icon path={ICONS.search} size={14} sw={2} /> Search
            </button>
            <button onClick={openQuickAddTodo} title="New work item" className="hov-accent"
              style={{ width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', cursor: 'pointer' }}>
              <Icon path={ICONS.plus} size={16} sw={2} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Workspace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600, color: 'var(--txt-placeholder)' }}>Workspace</div>
            {workspaceNav.map((wn) => {
              const active = view === wn.key
              return (
                <button key={wn.key} onClick={() => changeView(wn.key)} className={active ? '' : 'hov-layer'}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px', borderRadius: 6, border: 'none', background: active ? 'var(--layer-transparent-active)' : 'transparent', color: active ? 'var(--txt-primary)' : 'var(--txt-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                  <Icon path={ICONS[wn.icon]} size={16} /> {wn.label}
                </button>
              )
            })}
          </div>

          {/* Projects */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600, color: 'var(--txt-placeholder)' }}>Your projects</div>
            <button onClick={() => setProjectOpen((o) => !o)} className="hov-layer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
              {projectBadge}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Personal</span>
              <span style={{ color: 'var(--txt-placeholder)', transform: projectOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-flex' }}><Icon path={ICONS.chevronRight} size={14} sw={2} /></span>
            </button>
            {projectOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 14 }}>
                {projectNav.map((pn) => {
                  const active = view === pn.key
                  return (
                    <button key={pn.key} onClick={() => changeView(pn.key)} className={active ? '' : 'hov-layer'}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px', borderRadius: 6, border: 'none', background: active ? 'var(--layer-transparent-active)' : 'transparent', color: active ? 'var(--txt-primary)' : 'var(--txt-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                      <Icon path={ICONS[pn.icon]} size={15} /> {pn.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Help footer */}
        <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', padding: '0 12px' }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--txt-tertiary)', background: 'var(--bg-layer-1)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '3px 8px' }}>Free plan</span>
          <button onClick={toggleTheme} title="Toggle theme" className="hov-layer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', cursor: 'pointer' }}>
            <Icon path={theme === 'dark' ? ICONS.moon : ICONS.sun} size={15} />
          </button>
        </div>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, margin: '8px 8px 8px 0', border: '1px solid var(--border-subtle)', borderRadius: 10, background: 'var(--bg-surface-1)', overflow: 'hidden', boxShadow: 'var(--shadow-raised-100)' }}>

        {/* Header */}
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 21px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
            <button className="hov-layer" style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--txt-primary)', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
              {projectBadge} Personal
              <span style={{ color: 'var(--txt-placeholder)', display: 'inline-flex' }}><Icon path={ICONS.chevronDown} size={13} sw={2} /></span>
            </button>
            <div style={{ width: 1, height: 18, background: 'var(--border-strong)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, overflow: 'hidden' }}>
              {tabDefs.map((tab) => {
                const active = view === tab.key
                return (
                  <button key={tab.key} onClick={() => changeView(tab.key)} className={active ? '' : 'hov-layer'}
                    style={{ border: 'none', background: active ? 'var(--layer-transparent-active)' : 'transparent', color: active ? 'var(--txt-primary)' : 'var(--txt-tertiary)', fontSize: 13, fontWeight: 500, padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button title="Search" className="hov-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', cursor: 'pointer' }}>
              <Icon path={ICONS.search} size={16} />
            </button>
            <button onClick={openQuickAddTodo} className="hov-accent" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <Icon path={ICONS.plus} size={14} sw={2} /> New work item
            </button>
          </div>
        </div>

        {/* Views */}
        {view === 'home' && <HomeView userName={userName} issues={issues} onGoWorkItems={() => setView('work-items')} onGoCycles={() => setView('cycles')} />}
        {view === 'work-items' && (
          <WorkItemsView
            layout={layout} setLayout={setLayout} groups={groups}
            nextKey={'PERS-' + seq} quickAddText={quickAddText}
            onOpenQuickAdd={openQuickAdd} onQuickAddInput={setQuickAddText} onQuickAddKey={onQuickAddKey}
            onCycleState={cycleState} onCyclePriority={cyclePriority}
            onCardDragStart={setDragId} onCardDragEnd={() => { setDragId(null); setDragOverGroup(null) }}
            onColDragOver={(g) => { if (dragOverGroup !== g) setDragOverGroup(g) }}
            onColDragLeave={() => setDragOverGroup(null)} onColDrop={onColDrop}
          />
        )}
        {view === 'cycles' && <CyclesView userInitial={userInitial} />}
        {ph && <PlaceholderView title={ph.title} desc={ph.desc} iconPath={ICONS[ph.icon]} />}
      </div>
    </div>
  )
}
