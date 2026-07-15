import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoredUser, clearAuth } from '../store/auth'
import { logout } from '../api/auth'
import { getTheme, toggleTheme as applyToggleTheme } from '../store/theme'
import { getWorkspaces, getMembers, inviteMember } from '../api/workspaces'
import { getProjects, createProject, getStates, getLabels } from '../api/projects'
import { getIssues, createIssue, updateIssue, getComments, addComment, getActivity } from '../api/issues'
import { getCycles, getCycleIssues, getBurndown, createCycle } from '../api/cycles'
import { searchIssues } from '../api/search'
import { getDashboard } from '../api/analytics'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications'
import type { Issue, State, WorkspaceMember } from '../types'
import { ICONS, PRIORITIES, PRIORITY_ORDER, type PriorityKey, type Member } from './data'
import Icon from './Icon'
import PeekPanel, { type PeekData } from './PeekPanel'
import CreateProjectModal from './CreateProjectModal'
import CreateCycleModal from './CreateCycleModal'
import HomeView from './views/HomeView'
import WorkItemsView from './views/WorkItemsView'
import CyclesView, { type CycleListGroup } from './views/CyclesView'
import CycleDetailView, { type CycleDetail } from './views/CycleDetailView'
import InboxView from './views/InboxView'
import SettingsView from './views/SettingsView'

type View = 'home' | 'inbox' | 'work-items' | 'cycles' | 'cycle-detail' | 'settings'

const GROUP_ORDER = ['BACKLOG', 'UNSTARTED', 'STARTED', 'COMPLETED', 'CANCELLED']
const MEMBER_COLORS = ['oklch(0.5527 0.1361 288.8)', 'oklch(0.5704 0.1574 345.25)', 'oklch(0.5883 0.1413 149.06)', 'oklch(0.6802 0.1633 50.67)', 'oklch(0.579 0.1807 262.31)']
const UNASSIGNED_BG = 'oklch(0.6376 0.0129 231.77)'

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

const priorityKey = (p: string): PriorityKey => (p ? (p.toLowerCase() as PriorityKey) : 'none')

export default function AppShell() {
  const navigate = useNavigate()
  const { slug = '' } = useParams<{ slug: string }>()
  const qc = useQueryClient()
  const me = getStoredUser()
  const userName = me?.displayName?.trim() || 'there'
  const userInitial = (userName[0] || 'U').toUpperCase()

  const [theme, setThemeState] = useState(getTheme)
  const [view, setView] = useState<View>('work-items')
  const [projectExpanded, setProjectExpanded] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [quickAddGroup, setQuickAddGroup] = useState<string | null>(null)
  const [quickAddText, setQuickAddText] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [peekId, setPeekId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [cycleCreateOpen, setCycleCreateOpen] = useState(false)
  const [cycleName, setCycleName] = useState('')
  const [cycleStartDate, setCycleStartDate] = useState('')
  const [cycleEndDate, setCycleEndDate] = useState('')
  const [cycleDesc, setCycleDesc] = useState('')
  const [projName, setProjName] = useState('')
  const [projIdent, setProjIdent] = useState('')
  const [projDesc, setProjDesc] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null)
  const [inviteText, setInviteText] = useState('')
  const [pendingInvites, setPendingInvites] = useState<Member[]>([])

  // ─── Queries ───
  const { data: workspaces = [] } = useQuery({ queryKey: ['workspaces'], queryFn: getWorkspaces })
  const { data: projects = [], isLoading: projectsLoading } = useQuery({ queryKey: ['projects', slug], queryFn: () => getProjects(slug), enabled: !!slug })
  const { data: wsMembers = [] } = useQuery({ queryKey: ['members', slug], queryFn: () => getMembers(slug), enabled: !!slug })
  const { data: dashboard = null } = useQuery({ queryKey: ['dashboard', slug], queryFn: () => getDashboard(slug), enabled: !!slug })
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications', slug], queryFn: () => getNotifications(slug), enabled: !!slug })

  const projectId = selectedProjectId ?? projects[0]?.id ?? null
  const project = projects.find((p) => p.id === projectId) ?? null

  const { data: states = [] } = useQuery({ queryKey: ['states', slug, projectId], queryFn: () => getStates(slug, projectId!), enabled: !!projectId })
  const { data: issues = [] } = useQuery({ queryKey: ['issues', slug, projectId], queryFn: () => getIssues(slug, projectId!), enabled: !!projectId })
  const { data: labels = [] } = useQuery({ queryKey: ['labels', slug, projectId], queryFn: () => getLabels(slug, projectId!), enabled: !!projectId })
  const { data: cycles = [] } = useQuery({ queryKey: ['cycles', slug, projectId], queryFn: () => getCycles(slug, projectId!), enabled: !!projectId })

  const { data: peekComments = [] } = useQuery({
    queryKey: ['comments', slug, projectId, peekId],
    queryFn: () => getComments(slug, projectId!, peekId!),
    enabled: !!projectId && !!peekId,
  })
  const { data: peekActivityRaw = [] } = useQuery({
    queryKey: ['activity', slug, projectId, peekId],
    queryFn: () => getActivity(slug, projectId!, peekId!),
    enabled: !!projectId && !!peekId,
  })

  const sq = searchQuery.trim()
  const { data: searchResultsRaw = [] } = useQuery({
    queryKey: ['search', slug, sq],
    queryFn: () => searchIssues(slug, sq),
    enabled: !!slug && sq.length > 0,
  })
  const searchResults = searchResultsRaw.map((r) => ({ id: r.id, key: `${project?.identifier ?? ''}-${r.sequence}`, title: r.title }))

  const { data: cycleIssues = [] } = useQuery({
    queryKey: ['cycle-issues', slug, projectId, activeCycleId],
    queryFn: () => getCycleIssues(slug, projectId!, activeCycleId!),
    enabled: !!projectId && !!activeCycleId && view === 'cycle-detail',
  })
  const { data: burndown = [] } = useQuery({
    queryKey: ['burndown', slug, projectId, activeCycleId],
    queryFn: () => getBurndown(slug, projectId!, activeCycleId!),
    enabled: !!projectId && !!activeCycleId && view === 'cycle-detail',
  })

  // ─── Mutations ───
  const invalidateIssues = () => {
    qc.invalidateQueries({ queryKey: ['issues', slug, projectId] })
    qc.invalidateQueries({ queryKey: ['cycle-issues', slug, projectId] })
  }

  const updateIssueM = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateIssue>[3] }) =>
      updateIssue(slug, projectId!, id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ['issues', slug, projectId] })
      qc.setQueryData<Issue[]>(['issues', slug, projectId], (old) =>
        old?.map((it) => (it.id === id ? { ...it, ...patch } as Issue : it)))
    },
    onSettled: invalidateIssues,
  })

  const createIssueM = useMutation({
    mutationFn: (data: { title: string; stateId?: string }) => createIssue(slug, projectId!, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['issues', slug, projectId] })
      const tempSeq = (qc.getQueryData<Issue[]>(['issues', slug, projectId]) ?? [])
        .reduce((mx, it) => Math.max(mx, it.sequence), 0) + 1
      const temp: Issue = {
        id: `temp-${Date.now()}`,
        projectId: projectId!,
        workspaceId: '',
        title: data.title,
        description: null,
        stateId: data.stateId ?? null,
        priority: 'NONE',
        sequence: tempSeq,
        parentId: null,
        dueDate: null,
        completedAt: null,
        assigneeIds: [],
        labelIds: [],
        identifier: `${project?.identifier ?? '…'}-${tempSeq}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      qc.setQueryData<Issue[]>(['issues', slug, projectId], (old) => [...(old ?? []), temp])
    },
    onSettled: invalidateIssues,
  })

  const createProjectM = useMutation({
    mutationFn: () => createProject(slug, { name: projName.trim(), identifier: (projIdent || identAuto || 'PROJ').toUpperCase(), network: 'PUBLIC', description: projDesc }),
    onSuccess: (proj) => {
      qc.invalidateQueries({ queryKey: ['projects', slug] })
      setCreateOpen(false)
      setSelectedProjectId(proj.id)
      setView('work-items')
    },
  })

  const createCycleM = useMutation({
    mutationFn: () => createCycle(slug, projectId!, {
      name: cycleName.trim(),
      description: cycleDesc || undefined,
      startDate: cycleStartDate || undefined,
      endDate: cycleEndDate || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles', slug, projectId] })
      setCycleCreateOpen(false)
    },
  })

  const addCommentM = useMutation({
    mutationFn: (body: string) => addComment(slug, projectId!, peekId!, body),
    onSuccess: () => {
      setCommentText('')
      qc.invalidateQueries({ queryKey: ['comments', slug, projectId, peekId] })
      qc.invalidateQueries({ queryKey: ['activity', slug, projectId, peekId] })
    },
  })

  const markNotifReadM = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(slug, notificationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', slug] }),
  })

  const markAllNotifsReadM = useMutation({
    mutationFn: () => markAllNotificationsRead(slug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', slug] }),
  })

  const inviteM = useMutation({
    mutationFn: (email: string) => inviteMember(slug, email),
    onSuccess: (_d, email) => {
      const nm = email.split('@')[0]
      setPendingInvites((xs) => [...xs, {
        name: nm.charAt(0).toUpperCase() + nm.slice(1), email, role: 'Pending invite',
        initial: nm.charAt(0).toUpperCase(), bg: UNASSIGNED_BG,
        roleBg: 'var(--warning-subtle)', roleColor: 'var(--warning-text)',
      }])
      setInviteText('')
    },
  })

  // Debounced title/description PATCH from peek edits
  const editTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedPatch = (id: string, patch: { title?: string; description?: string }) => {
    qc.setQueryData<Issue[]>(['issues', slug, projectId], (old) =>
      old?.map((it) => (it.id === id ? { ...it, ...patch } as Issue : it)))
    if (editTimer.current) clearTimeout(editTimer.current)
    editTimer.current = setTimeout(() => updateIssueM.mutate({ id, patch }), 600)
  }

  const changeView = (v: View) => {
    setView(v); setQuickAddGroup(null); setPeekId(null); setCreateOpen(false)
  }

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
  }

  const toggleTheme = () => { applyToggleTheme(); setThemeState(getTheme()) }

  // ─── Member helpers ───
  const memberOf = (userId: string | undefined): { name: string; initial: string; bg: string } => {
    const idx = wsMembers.findIndex((m) => m.userId === userId)
    if (idx < 0) return { name: 'Unassigned', initial: '·', bg: UNASSIGNED_BG }
    const m = wsMembers[idx]
    return { name: m.displayName, initial: (m.displayName[0] || '?').toUpperCase(), bg: MEMBER_COLORS[idx % MEMBER_COLORS.length] }
  }

  // ─── Issue action helpers ───
  const orderedStates: State[] = [...states].sort(
    (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.sequence - b.sequence)

  const cycleStateOf = (id: string) => {
    const it = issues.find((i) => i.id === id)
    if (!it) return
    const idx = orderedStates.findIndex((s) => s.id === it.stateId)
    const next = orderedStates[(idx + 1) % orderedStates.length]
    updateIssueM.mutate({ id, patch: { stateId: next.id } })
  }

  const cyclePriorityOf = (id: string) => {
    const it = issues.find((i) => i.id === id)
    if (!it) return
    const key = priorityKey(it.priority)
    const next = PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(key) + 1) % PRIORITY_ORDER.length]
    updateIssueM.mutate({ id, patch: { priority: next.toUpperCase() } })
  }

  const cycleAssigneeOf = (id: string) => {
    const it = issues.find((i) => i.id === id)
    if (!it || wsMembers.length === 0) return
    const cur = wsMembers.findIndex((m) => m.userId === it.assigneeIds[0])
    const next = wsMembers[(cur + 1) % wsMembers.length]
    updateIssueM.mutate({ id, patch: { assigneeIds: [next.userId] } })
  }

  const defaultStateId = states.find((s) => s.defaultState)?.id ?? orderedStates[1]?.id ?? orderedStates[0]?.id

  const openQuickAdd = (stateId: string) => { setQuickAddGroup(stateId); setQuickAddText('') }

  const commitQuickAdd = () => {
    const title = quickAddText.trim()
    if (!title || !quickAddGroup) { setQuickAddGroup(null); setQuickAddText(''); return }
    createIssueM.mutate({ title, stateId: quickAddGroup })
    setQuickAddText('')
  }

  const onQuickAddKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitQuickAdd()
    if (e.key === 'Escape') { setQuickAddGroup(null); setQuickAddText('') }
  }

  const onColDrop = (stateId: string) => {
    if (dragId != null) updateIssueM.mutate({ id: dragId, patch: { stateId } })
    setDragId(null); setDragOverGroup(null)
  }

  const identAuto = projName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
  const openCreate = () => { setCreateOpen(true); setProjName(''); setProjIdent(''); setProjDesc('') }
  const openCycleCreate = () => { setCycleCreateOpen(true); setCycleName(''); setCycleStartDate(''); setCycleEndDate(''); setCycleDesc('') }

  const openQuickAddTodo = () => {
    if (!defaultStateId) return
    setView('work-items'); setQuickAddGroup(defaultStateId); setQuickAddText('')
  }

  // ─── Row mapping ───
  const labelChips = (ids: string[]) =>
    ids.map((lid) => labels.find((l) => l.id === lid)).filter(Boolean)
      .map((l) => ({ name: l!.name, bg: `color-mix(in srgb, ${l!.color} 18%, transparent)`, color: l!.color }))

  const rowOf = (it: Issue) => {
    const st = states.find((s) => s.id === it.stateId)
    const pr = PRIORITIES[priorityKey(it.priority)]
    const asg = memberOf(it.assigneeIds[0])
    return {
      id: it.id,
      key: it.identifier,
      name: it.title,
      stateLabel: st?.name ?? '—',
      stateColor: st?.color ?? '#d9d9d9',
      priorityColor: pr.color,
      priorityPath: pr.path,
      assigneeInitial: asg.initial,
      assigneeName: asg.name,
      assigneeBg: asg.bg,
      due: fmtDate(it.dueDate),
      labels: labelChips(it.labelIds),
      dragOpacity: dragId === it.id ? 0.4 : 1,
    }
  }

  const groups = orderedStates.map((st) => {
    const items = issues.filter((it) => it.stateId === st.id).map(rowOf)
    return {
      key: st.id,
      label: st.name,
      color: st.color,
      count: items.length,
      items,
      isQuickAdd: quickAddGroup === st.id,
      dropBg: dragOverGroup === st.id ? 'var(--layer-transparent-active)' : 'transparent',
    }
  })

  const nextSeq = issues.reduce((mx, it) => Math.max(mx, it.sequence), 0) + 1
  const nextKey = `${project?.identifier ?? 'ITEM'}-${nextSeq}`

  // ─── Peek ───
  const pk = issues.find((i) => i.id === peekId)
  let peek: PeekData | null = null
  if (pk) {
    const st = states.find((s) => s.id === pk.stateId)
    const pr = PRIORITIES[priorityKey(pk.priority)]
    const asg = memberOf(pk.assigneeIds[0])
    const pkKey = priorityKey(pk.priority)
    peek = {
      key: pk.identifier,
      name: pk.title,
      desc: pk.description ?? '',
      stateLabel: st?.name ?? '—',
      stateColor: st?.color ?? '#d9d9d9',
      priorityLabel: pkKey.charAt(0).toUpperCase() + pkKey.slice(1),
      priorityColor: pr.color,
      priorityPath: pr.path,
      assigneeName: asg.name,
      assigneeInitial: asg.initial,
      assigneeBg: asg.bg,
      due: fmtDate(pk.dueDate),
      cycleName: 'No cycle',
      labels: labelChips(pk.labelIds),
    }
  }

  const peekCommentRows = peekComments.map((c) => {
    const author = memberOf(c.authorId)
    return { text: c.body, time: fmtDate(c.createdAt), initial: author.initial, name: author.name, bg: author.bg }
  })

  const peekActivity = peekActivityRaw.map((a) => {
    const actor = memberOf(a.actorId)
    const text = a.verb === 'CREATED'
      ? `${actor.name} created this work item`
      : `${actor.name} changed ${(a.field ?? a.verb).toLowerCase()}${a.newValue ? ' to ' + a.newValue : ''}`
    return { text, time: fmtDate(a.createdAt) }
  })

  const onSelectSearchResult = (id: string) => {
    setSearchQuery('')
    const result = searchResultsRaw.find((r) => r.id === id)
    if (result && result.projectId !== projectId) setSelectedProjectId(result.projectId)
    setView('work-items')
    setPeekId(id)
  }

  // ─── Inbox ───
  const NOTIF_ACTION: Record<string, string> = {
    ISSUE_CREATED: 'created',
    ISSUE_UPDATED: 'updated',
    COMMENT_ADDED: 'commented on',
  }
  const unread = notifications.filter((n) => !n.read).length
  const notifRows = notifications.map((n) => {
    const actor = memberOf(n.actorId)
    return {
      id: n.id, initial: actor.initial, bg: actor.bg, name: actor.name,
      action: NOTIF_ACTION[n.verb] ?? n.verb.toLowerCase(),
      target: `${n.issueIdentifier} · ${n.issueTitle}`,
      snippet: '', time: fmtDate(n.createdAt), read: n.read,
    }
  })

  // ─── Cycles ───
  const today = new Date().toISOString().slice(0, 10)
  const cycleGroupOf = (c: { startDate: string | null; endDate: string | null }) => {
    if (c.startDate && c.startDate > today) return 'upcoming'
    if (c.endDate && c.endDate < today) return 'completed'
    return 'active'
  }
  const badgeFor = (g: string) =>
    g === 'active'
      ? { badge: 'In progress', badgeBg: 'var(--warning-subtle)', badgeColor: 'var(--warning-text)' }
      : g === 'upcoming'
        ? { badge: 'Upcoming', badgeBg: 'var(--bg-layer-1)', badgeColor: 'var(--txt-tertiary)' }
        : { badge: 'Completed', badgeBg: 'var(--success-subtle)', badgeColor: 'var(--success-text)' }

  const cycleListGroups: CycleListGroup[] = [
    { key: 'active', label: 'Active cycle' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
  ].map((cg) => {
    const items = cycles.filter((c) => cycleGroupOf(c) === cg.key).map((c) => ({
      id: c.id,
      name: c.name,
      range: `${fmtDate(c.startDate)} – ${fmtDate(c.endDate)}`,
      progressLabel: `${c.progress.percentage}%`,
      dashOffset: (75.4 * (100 - c.progress.percentage)) / 100,
      ...badgeFor(cg.key),
    }))
    return { label: cg.label, count: items.length, items }
  })

  const activeCycle = cycles.find((c) => c.id === activeCycleId)
  let cd: CycleDetail | null = null
  if (activeCycle && view === 'cycle-detail') {
    const rows = cycleIssues.map(rowOf)
    const grp = cycleGroupOf(activeCycle)
    const W = 520, H = 120, P = 10
    const maxRemaining = Math.max(1, ...burndown.map((b) => b.remaining), activeCycle.progress.total)
    const pts = burndown.length >= 2 ? burndown.map((b) => b.remaining / maxRemaining) : [1, 1]
    const actualPoints = pts.map((f, i) =>
      (P + (W - 2 * P) * (i / (pts.length - 1))).toFixed(1) + ',' + (P + (H - 2 * P) * (1 - f)).toFixed(1)).join(' ')
    cd = {
      name: activeCycle.name,
      range: `${fmtDate(activeCycle.startDate)} – ${fmtDate(activeCycle.endDate)}`,
      progressLabel: `${activeCycle.progress.percentage}%`,
      dashOffset: (75.4 * (100 - activeCycle.progress.percentage)) / 100,
      total: activeCycle.progress.total,
      done: activeCycle.progress.completed,
      inProgress: cycleIssues.filter((it) => states.find((s) => s.id === it.stateId)?.group === 'STARTED').length,
      rows, actualPoints, ...badgeFor(grp),
    }
  }

  // ─── Home ───
  const assigned = issues
    .filter((it) => it.assigneeIds.includes(me?.id ?? '') &&
      ['UNSTARTED', 'STARTED'].includes(states.find((s) => s.id === it.stateId)?.group ?? ''))
    .map((it) => ({
      id: it.id, key: it.identifier, name: it.title, due: fmtDate(it.dueDate),
      stateColor: states.find((s) => s.id === it.stateId)?.color ?? '#d9d9d9',
    }))
  const recents = [
    ...(cycles.length > 0 ? [{ name: cycles[0].name, meta: 'Cycle', iconPath: ICONS.cycles, go: () => { setActiveCycleId(cycles[0].id); setView('cycle-detail') } }] : []),
    ...(issues.length > 0 ? [{ name: issues[0].title, meta: `Work item · ${issues[0].identifier}`, iconPath: ICONS.workItems, go: () => { setView('work-items'); setPeekId(issues[0].id) } }] : []),
    ...(project ? [{ name: project.name, meta: 'Project', iconPath: ICONS.projects, go: () => setView('work-items') }] : []),
  ]

  // ─── Settings members ───
  const settingsMembers: Member[] = [
    ...wsMembers.map((m: WorkspaceMember, idx: number) => ({
      name: m.displayName, email: m.email,
      role: m.role.charAt(0) + m.role.slice(1).toLowerCase(),
      initial: (m.displayName[0] || '?').toUpperCase(),
      bg: MEMBER_COLORS[idx % MEMBER_COLORS.length],
      roleBg: m.role === 'OWNER' || m.role === 'ADMIN' ? 'var(--accent-subtle)' : 'var(--bg-layer-1)',
      roleColor: m.role === 'OWNER' || m.role === 'ADMIN' ? 'var(--accent-primary)' : 'var(--txt-tertiary)',
    })),
    ...pendingInvites,
  ]

  const railItems: { key: View; label: string; icon: keyof typeof ICONS }[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'inbox', label: 'Inbox', icon: 'inbox' },
    { key: 'work-items', label: 'Projects', icon: 'projects' },
  ]
  const workspaceNav: { key: View; label: string; icon: keyof typeof ICONS }[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'inbox', label: 'Inbox', icon: 'inbox' },
  ]
  const projectNav: { key: View; label: string; icon: keyof typeof ICONS }[] = [
    { key: 'work-items', label: 'Work items', icon: 'workItems' },
    { key: 'cycles', label: 'Cycles', icon: 'cycles' },
  ]
  const tabDefs: { key: View; label: string }[] = [
    { key: 'work-items', label: 'Work items' },
    { key: 'cycles', label: 'Cycles' },
  ]

  const tabActive = (key: View) => view === key || (key === 'cycles' && view === 'cycle-detail')

  const projBadge = (name: string, active: boolean) => (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, background: active ? 'var(--accent-subtle)' : 'var(--bg-layer-1)', color: active ? 'var(--accent-primary)' : 'var(--txt-tertiary)', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
      {(name[0] || 'P').toUpperCase()}
    </span>
  )

  return (
    <div data-theme={theme} style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-canvas)', color: 'var(--txt-primary)', fontSize: 13 }}>

      {/* ============ APP RAIL ============ */}
      <div style={{ width: 60, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 8px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 2 }}>
            <img src="/plane-logo.png" alt="Plane" style={{ width: 26, height: 26, borderRadius: 6, cursor: 'pointer' }} onClick={() => navigate('/')} />
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
          <button onClick={() => changeView('settings')} title="Settings"
            style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--txt-tertiary)' }}>
            <span className="hov-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6 }}>
              <Icon path={ICONS.settings} size={20} />
            </span>
            <span style={{ fontSize: 11, fontWeight: 500 }}>Settings</span>
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={handleLogout} title="Sign out"
            style={{ width: 30, height: 30, borderRadius: '50%', background: MEMBER_COLORS[0], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            {userInitial}
          </button>
        </div>
      </div>

      {/* ============ PROJECT SIDEBAR ============ */}
      <div style={{ width: 234, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '12px 0 0 0', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--txt-primary)' }}>Projects</span>
          </div>
          <button onClick={openQuickAddTodo} title="New work item" className="hov-accent"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 30, borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <Icon path={ICONS.plus} size={16} sw={2} /> New work item
          </button>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-placeholder)' }}>Your projects</span>
              <button onClick={openCreate} title="Create project" className="hov-layer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', cursor: 'pointer' }}>
                <Icon path={ICONS.plus} size={13} sw={2} />
              </button>
            </div>
            {projects.map((pr) => {
              const isSel = pr.id === projectId
              return (
                <div key={pr.id}>
                  <button
                    onClick={() => {
                      if (isSel) { setProjectExpanded((o) => !o) } else { setSelectedProjectId(pr.id); setProjectExpanded(true); changeView('work-items') }
                    }}
                    className="hov-layer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                    {projBadge(pr.name, isSel)}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.name}</span>
                    {isSel ? (
                      <span style={{ color: 'var(--txt-placeholder)', transform: projectExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-flex' }}><Icon path={ICONS.chevronRight} size={14} sw={2} /></span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--txt-placeholder)' }}>{pr.identifier}</span>
                    )}
                  </button>
                  {isSel && projectExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 14, paddingTop: 2 }}>
                      {projectNav.map((pn) => {
                        const active = tabActive(pn.key)
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
              )
            })}
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
            <button onClick={() => navigate('/')} title="Switch workspace" className="hov-layer" style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--txt-primary)', fontSize: 13, fontWeight: 500 }}>
              {projBadge(project?.name ?? slug, true)} {project?.name ?? slug}
            </button>
            <div style={{ width: 1, height: 18, background: 'var(--border-strong)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, overflow: 'hidden' }}>
              {tabDefs.map((tab) => {
                const active = tabActive(tab.key)
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
            <button onClick={openQuickAddTodo} className="hov-accent" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <Icon path={ICONS.plus} size={14} sw={2} /> New work item
            </button>
          </div>
        </div>

        {/* Views */}
        {projectsLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--txt-placeholder)' }}>Loading…</div>
        ) : !project && view !== 'settings' && view !== 'inbox' && view !== 'home' ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: 360, textAlign: 'center', padding: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg-layer-1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-placeholder)', marginBottom: 6 }}>
                <Icon path={ICONS.projects} size={24} sw={1.5} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--txt-primary)' }}>No projects yet</div>
              <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', lineHeight: 1.5 }}>Create your first project to start tracking work items.</div>
              <button onClick={openCreate} className="hov-accent" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                <Icon path={ICONS.plus} size={13} sw={2} /> Create project
              </button>
            </div>
          </div>
        ) : (
          <>
            {view === 'home' && <HomeView userName={userName} stats={dashboard} assigned={assigned} recents={recents} onOpenPeek={(id) => { setView('work-items'); setPeekId(id) }} />}
            {view === 'work-items' && (
              <WorkItemsView
                groups={groups}
                nextKey={nextKey} quickAddText={quickAddText}
                onOpenQuickAdd={openQuickAdd} onQuickAddInput={setQuickAddText} onQuickAddKey={onQuickAddKey}
                onCycleState={cycleStateOf} onCyclePriority={cyclePriorityOf} onOpenPeek={setPeekId}
                onCardDragStart={setDragId} onCardDragEnd={() => { setDragId(null); setDragOverGroup(null) }}
                onColDragOver={(g) => { if (dragOverGroup !== g) setDragOverGroup(g) }}
                onColDragLeave={() => setDragOverGroup(null)} onColDrop={onColDrop}
                searchQuery={searchQuery} onSearchInput={setSearchQuery}
                searchResults={searchResults} onSelectSearchResult={onSelectSearchResult}
              />
            )}
            {view === 'cycles' && <CyclesView groups={cycleListGroups} userInitial={userInitial} onOpen={(id) => { setActiveCycleId(id); setView('cycle-detail') }} onCreate={openCycleCreate} />}
            {view === 'cycle-detail' && cd && (
              <CycleDetailView cd={cd} onBack={() => { setView('cycles'); setActiveCycleId(null) }} onOpenPeek={setPeekId} />
            )}
            {view === 'inbox' && (
              <InboxView
                rows={notifRows}
                unreadLabel={unread === 0 ? 'All caught up' : unread + ' unread'}
                onMarkRead={(id) => markNotifReadM.mutate(id)}
                onMarkAllRead={() => markAllNotifsReadM.mutate()}
              />
            )}
            {view === 'settings' && (
              <SettingsView
                workspaceName={workspaces.find((w) => w.slug === slug)?.name ?? slug}
                workspaceUrl={`plane.local/${slug}`}
                members={settingsMembers} inviteText={inviteText}
                onInviteInput={setInviteText}
                onInvite={() => { const email = inviteText.trim(); if (email.includes('@')) inviteM.mutate(email) }}
              />
            )}
          </>
        )}
      </div>

      {/* ============ OVERLAYS ============ */}
      {peek && pk && (
        <PeekPanel
          projectName={project?.name ?? ''}
          peek={peek} comments={peekCommentRows} activity={peekActivity} commentText={commentText}
          onClose={() => setPeekId(null)}
          onName={(v) => debouncedPatch(pk.id, { title: v })}
          onDesc={(v) => debouncedPatch(pk.id, { description: v })}
          onCycleState={() => cycleStateOf(pk.id)}
          onCyclePriority={() => cyclePriorityOf(pk.id)}
          onCycleAssignee={() => cycleAssigneeOf(pk.id)}
          onCommentInput={setCommentText}
          onAddComment={() => { const body = commentText.trim(); if (body) addCommentM.mutate(body) }}
        />
      )}
      {createOpen && (
        <CreateProjectModal
          name={projName} ident={projIdent === '' ? identAuto : projIdent} desc={projDesc}
          pending={createProjectM.isPending}
          error={createProjectM.isError ? ((createProjectM.error as any)?.response?.data?.message ?? 'Failed to create project') : undefined}
          onName={setProjName} onIdent={(v) => setProjIdent(v.toUpperCase().slice(0, 5))} onDesc={setProjDesc}
          onClose={() => setCreateOpen(false)} onCreate={() => { if (projName.trim()) createProjectM.mutate() }}
        />
      )}
      {cycleCreateOpen && (
        <CreateCycleModal
          name={cycleName} startDate={cycleStartDate} endDate={cycleEndDate} desc={cycleDesc}
          pending={createCycleM.isPending}
          error={createCycleM.isError ? ((createCycleM.error as any)?.response?.data?.message ?? 'Failed to create cycle') : undefined}
          onName={setCycleName} onStartDate={setCycleStartDate} onEndDate={setCycleEndDate} onDesc={setCycleDesc}
          onClose={() => setCycleCreateOpen(false)} onCreate={() => { if (cycleName.trim()) createCycleM.mutate() }}
        />
      )}
    </div>
  )
}
