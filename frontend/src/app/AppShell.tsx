import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoredUser, clearAuth } from '../store/auth'
import { logout } from '../api/auth'
import { getTheme, toggleTheme as applyToggleTheme } from '../store/theme'
import { getWorkspaces, getMembers, inviteMember } from '../api/workspaces'
import { getProjects, createProject, getStates, getLabels } from '../api/projects'
import { getIssues, createIssue, updateIssue, getComments, addComment, getActivity } from '../api/issues'
import { getCycles, getCycleIssues, getBurndown } from '../api/cycles'
import { searchIssues } from '../api/search'
import type { Issue, State, WorkspaceMember } from '../types'
import { ICONS, PRIORITIES, PRIORITY_ORDER, SEED_NOTIFICATIONS, type PriorityKey, type Notification, type Member } from './data'
import Icon from './Icon'
import PeekPanel, { type PeekData } from './PeekPanel'
import CreateProjectModal from './CreateProjectModal'
import CommandPalette, { type PaletteGroup } from './CommandPalette'
import HomeView from './views/HomeView'
import WorkItemsView from './views/WorkItemsView'
import CyclesView, { type CycleListGroup } from './views/CyclesView'
import CycleDetailView, { type CycleDetail } from './views/CycleDetailView'
import InboxView from './views/InboxView'
import SettingsView from './views/SettingsView'
import PlaceholderView from './views/PlaceholderView'

type View =
  | 'home' | 'inbox' | 'work-items' | 'cycles' | 'cycle-detail' | 'modules' | 'pages'
  | 'views-v' | 'analytics' | 'intake' | 'settings'

const PLACEHOLDERS: Record<string, { title: string; desc: string; icon: keyof typeof ICONS }> = {
  modules: { title: 'No modules yet', desc: 'Group work items into modules to track larger bodies of work across cycles.', icon: 'modules' },
  pages: { title: 'Write it down with Pages', desc: 'Capture specs, notes and ideas alongside your work items.', icon: 'pages' },
  'views-v': { title: 'No saved views', desc: 'Save filter combinations as views to get back to them in one click.', icon: 'views' },
  analytics: { title: 'Analytics', desc: 'Trends across your projects will appear here once there is enough activity.', icon: 'analytics' },
  intake: { title: 'Intake is quiet', desc: 'Requests from guests and forms land here for triage.', icon: 'intake' },
}

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
  const [layout, setLayout] = useState<'list' | 'board'>('list')
  const [projectExpanded, setProjectExpanded] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [quickAddGroup, setQuickAddGroup] = useState<string | null>(null)
  const [quickAddText, setQuickAddText] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [peekId, setPeekId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [projName, setProjName] = useState('')
  const [projIdent, setProjIdent] = useState('')
  const [projDesc, setProjDesc] = useState('')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null)
  const [wsOpen, setWsOpen] = useState(false)
  const [inviteText, setInviteText] = useState('')
  const [pendingInvites, setPendingInvites] = useState<Member[]>([])
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS)
  const [groupBy, setGroupBy] = useState<'state' | 'priority' | 'assignee'>('state')
  const [priorityFilter, setPriorityFilter] = useState<Set<PriorityKey>>(new Set())
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set())

  // ─── Queries ───
  const { data: workspaces = [] } = useQuery({ queryKey: ['workspaces'], queryFn: getWorkspaces })
  const { data: projects = [], isLoading: projectsLoading } = useQuery({ queryKey: ['projects', slug], queryFn: () => getProjects(slug), enabled: !!slug })
  const { data: wsMembers = [] } = useQuery({ queryKey: ['members', slug], queryFn: () => getMembers(slug), enabled: !!slug })

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

  const q = paletteQuery.trim()
  const { data: searchResults = [] } = useQuery({
    queryKey: ['search', slug, q],
    queryFn: () => searchIssues(slug, q),
    enabled: !!slug && paletteOpen && q.length > 0,
  })

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
    mutationFn: (data: { title: string; stateId?: string; priority?: string; assigneeIds?: string[] }) =>
      createIssue(slug, projectId!, data),
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
        priority: (data.priority ?? 'NONE') as Issue['priority'],
        sequence: tempSeq,
        parentId: null,
        dueDate: null,
        completedAt: null,
        assigneeIds: data.assigneeIds ?? [],
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

  const addCommentM = useMutation({
    mutationFn: (body: string) => addComment(slug, projectId!, peekId!, body),
    onSuccess: () => {
      setCommentText('')
      qc.invalidateQueries({ queryKey: ['comments', slug, projectId, peekId] })
      qc.invalidateQueries({ queryKey: ['activity', slug, projectId, peekId] })
    },
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

  // ─── Global keys ───
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
        setPaletteQuery('')
      } else if (e.key === 'Escape') {
        setPaletteOpen(false); setPeekId(null); setCreateOpen(false); setWsOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const changeView = (v: View) => {
    setView(v); setQuickAddGroup(null); setPeekId(null); setPaletteOpen(false); setWsOpen(false); setCreateOpen(false)
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

  // Group key encodes which dimension is grouping: raw state id, "priority:xxx", or "assignee:xxx"|"assignee:unassigned"
  const patchForGroupKey = (key: string): { stateId?: string; priority?: string; assigneeIds?: string[] } => {
    if (groupBy === 'state') return { stateId: key }
    if (key.startsWith('priority:')) return { priority: key.slice('priority:'.length).toUpperCase() }
    if (key.startsWith('assignee:')) {
      const id = key.slice('assignee:'.length)
      return { assigneeIds: id === 'unassigned' ? [] : [id] }
    }
    return {}
  }

  const openQuickAdd = (group: string) => { setQuickAddGroup(group); setQuickAddText('') }

  const commitQuickAdd = () => {
    const title = quickAddText.trim()
    if (!title || !quickAddGroup) { setQuickAddGroup(null); setQuickAddText(''); return }
    const groupPatch = patchForGroupKey(quickAddGroup)
    createIssueM.mutate({ title, stateId: groupPatch.stateId ?? defaultStateId, priority: groupPatch.priority, assigneeIds: groupPatch.assigneeIds })
    setQuickAddText('')
  }

  const onQuickAddKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitQuickAdd()
    if (e.key === 'Escape') { setQuickAddGroup(null); setQuickAddText('') }
  }

  const onColDrop = (group: string) => {
    if (dragId != null) updateIssueM.mutate({ id: dragId, patch: patchForGroupKey(group) })
    setDragId(null); setDragOverGroup(null)
  }

  const identAuto = projName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
  const openCreate = () => { setCreateOpen(true); setProjName(''); setProjIdent(''); setProjDesc(''); setWsOpen(false); setPaletteOpen(false) }

  const toggleInSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (v: string) =>
    setter((s) => { const n = new Set(s); if (n.has(v)) n.delete(v); else n.add(v); return n })
  const togglePriorityFilter = (p: PriorityKey) =>
    setPriorityFilter((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n })
  const toggleAssigneeFilter = toggleInSet(setAssigneeFilter)
  const clearFilters = () => { setPriorityFilter(new Set()); setAssigneeFilter(new Set()) }

  const filteredIssues = issues.filter((it) => {
    if (priorityFilter.size > 0 && !priorityFilter.has(priorityKey(it.priority))) return false
    if (assigneeFilter.size > 0) {
      const ids = it.assigneeIds.length > 0 ? it.assigneeIds : ['unassigned']
      if (!ids.some((id) => assigneeFilter.has(id))) return false
    }
    return true
  })

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

  interface GroupDef { key: string; label: string; color: string; matches: (it: Issue) => boolean }

  let groupDefs: GroupDef[]
  if (groupBy === 'priority') {
    groupDefs = [...PRIORITY_ORDER].reverse().map((pk) => ({
      key: 'priority:' + pk,
      label: pk.charAt(0).toUpperCase() + pk.slice(1),
      color: PRIORITIES[pk].color,
      matches: (it) => priorityKey(it.priority) === pk,
    }))
  } else if (groupBy === 'assignee') {
    const opts = [...wsMembers.map((m, i) => ({ id: m.userId, name: m.displayName, color: MEMBER_COLORS[i % MEMBER_COLORS.length] })),
      { id: 'unassigned', name: 'Unassigned', color: UNASSIGNED_BG }]
    groupDefs = opts.map((o) => ({
      key: 'assignee:' + o.id,
      label: o.name,
      color: o.color,
      matches: (it) => (o.id === 'unassigned' ? it.assigneeIds.length === 0 : it.assigneeIds.includes(o.id)),
    }))
  } else {
    groupDefs = orderedStates.map((st) => ({ key: st.id, label: st.name, color: st.color, matches: (it) => it.stateId === st.id }))
  }

  const groups = groupDefs.map((gd) => {
    const items = filteredIssues.filter(gd.matches).map(rowOf)
    return {
      key: gd.key,
      label: gd.label,
      color: gd.color,
      count: items.length,
      items,
      isQuickAdd: quickAddGroup === gd.key,
      dropBg: dragOverGroup === gd.key ? 'var(--layer-transparent-active)' : 'transparent',
    }
  })

  const openQuickAddTodo = () => {
    const key = groupBy === 'state' ? defaultStateId : groups[0]?.key
    if (!key) return
    setView('work-items'); setLayout('list'); setQuickAddGroup(key); setQuickAddText('')
  }

  const assigneeOptions = [...wsMembers.map((m) => ({ id: m.userId, name: m.displayName })), { id: 'unassigned', name: 'Unassigned' }]
  const activeFilterCount = priorityFilter.size + assigneeFilter.size

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

  // ─── Palette ───
  const stColorOf = (issueId: string) => {
    const it = issues.find((i) => i.id === issueId)
    return states.find((s) => s.id === it?.stateId)?.color ?? '#d9d9d9'
  }
  const issueRows = (q.length > 0
    ? searchResults.map((r) => ({ id: r.id, key: `${project?.identifier ?? ''}-${r.sequence}`, title: r.title, projectId: r.projectId }))
    : issues.slice(0, 6).map((it) => ({ id: it.id, key: it.identifier, title: it.title, projectId: it.projectId }))
  ).map((r) => ({
    key: r.key,
    label: r.title,
    color: stColorOf(r.id),
    showDot: true,
    showKey: true,
    onClick: () => {
      setPaletteOpen(false)
      if (r.projectId !== projectId) setSelectedProjectId(r.projectId)
      setView('work-items')
      setPeekId(r.id)
    },
  }))
  const ql = q.toLowerCase()
  const navRows = ([['Home', 'home'], ['Work items', 'work-items'], ['Cycles', 'cycles'], ['Inbox', 'inbox'], ['Workspace settings', 'settings']] as [string, View][])
    .filter((d) => !ql || ('go to ' + d[0]).toLowerCase().includes(ql))
    .map((d) => ({ key: '', label: 'Go to ' + d[0], color: 'transparent', showDot: false, showKey: false, onClick: () => changeView(d[1]) }))
  const cmdRows = [
    { label: 'Create new work item', act: () => { setPaletteOpen(false); openQuickAddTodo() } },
    { label: 'Create new project', act: openCreate },
  ]
    .filter((c) => !ql || c.label.toLowerCase().includes(ql))
    .map((c) => ({ key: '', label: c.label, color: 'transparent', showDot: false, showKey: false, onClick: c.act }))
  const paletteGroups: PaletteGroup[] = [
    { label: 'Work items', rows: issueRows },
    { label: 'Navigation', rows: navRows },
    { label: 'Commands', rows: cmdRows },
  ].filter((g) => g.rows.length > 0)

  // ─── Inbox (mock until notifications backend lands) ───
  const MOCK_ACTORS: Record<string, { name: string; bg: string }> = {
    S: { name: 'Sana', bg: MEMBER_COLORS[1] }, R: { name: 'Rohit', bg: MEMBER_COLORS[2] },
  }
  const unread = notifications.filter((n) => !n.read).length
  const notifRows = notifications.map((n) => ({
    id: n.id, initial: n.who, bg: MOCK_ACTORS[n.who]?.bg ?? UNASSIGNED_BG, name: MOCK_ACTORS[n.who]?.name ?? n.who,
    action: n.action, target: n.target, snippet: n.snippet, time: n.time, read: n.read,
  }))

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
            <span style={{ color: 'var(--txt-tertiary)', cursor: 'pointer', display: 'inline-flex' }}><Icon path={ICONS.hamburger} size={16} /></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => { setPaletteOpen(true); setPaletteQuery('') }} className="hov-border" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'var(--bg-surface-1)', color: 'var(--txt-placeholder)', fontSize: 13, cursor: 'pointer', boxSizing: 'border-box' }}>
              <Icon path={ICONS.search} size={14} sw={2} /> Search
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 500, color: 'var(--txt-placeholder)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '1px 5px' }}>Ctrl K</span>
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
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setWsOpen((o) => !o)} className="hov-layer" style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--txt-primary)', fontSize: 13, fontWeight: 500 }}>
                {projBadge(project?.name ?? slug, true)} {project?.name ?? slug}
                <span style={{ color: 'var(--txt-placeholder)', display: 'inline-flex' }}><Icon path={ICONS.chevronDown} size={13} sw={2} /></span>
              </button>
              {wsOpen && (
                <>
                  <div onClick={() => setWsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 41, width: 260, background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, boxShadow: 'var(--shadow-overlay-200)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ padding: '6px 8px 4px 8px', fontSize: 11, fontWeight: 600, color: 'var(--txt-placeholder)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Workspaces</div>
                    {workspaces.map((ws) => {
                      const current = ws.slug === slug
                      return (
                        <button key={ws.id} onClick={() => { setWsOpen(false); if (!current) { setSelectedProjectId(null); navigate(`/${ws.slug}`) } }} className="hov-layer"
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{(ws.name[0] || 'W').toUpperCase()}</span>
                          <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)' }}>{ws.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--txt-placeholder)', textTransform: 'capitalize' }}>{ws.role.toLowerCase()}{ws.memberCount ? ` · ${ws.memberCount} member${ws.memberCount > 1 ? 's' : ''}` : ''}</span>
                          </span>
                          <span style={{ display: 'inline-flex', width: 14, height: 14, color: 'var(--accent-primary)', opacity: current ? 1 : 0 }}>
                            <Icon path={ICONS.check} size={14} sw={2.4} />
                          </span>
                        </button>
                      )
                    })}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                    <button onClick={openCreate} className="hov-layer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                      <Icon path={ICONS.plus} size={14} sw={2} /> Create project
                    </button>
                    <button onClick={() => changeView('settings')} className="hov-layer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--txt-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                      <Icon path={ICONS.settings} size={14} /> Workspace settings
                    </button>
                  </div>
                </>
              )}
            </div>
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
            <button title="Search" onClick={() => { setPaletteOpen(true); setPaletteQuery('') }} className="hov-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', cursor: 'pointer' }}>
              <Icon path={ICONS.search} size={16} />
            </button>
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
            {view === 'home' && <HomeView userName={userName} assigned={assigned} recents={recents} onOpenPeek={(id) => { setView('work-items'); setPeekId(id) }} />}
            {view === 'work-items' && (
              <WorkItemsView
                layout={layout} setLayout={setLayout} groups={groups}
                nextKey={nextKey} quickAddText={quickAddText}
                onOpenQuickAdd={openQuickAdd} onQuickAddInput={setQuickAddText} onQuickAddKey={onQuickAddKey}
                onCycleState={cycleStateOf} onCyclePriority={cyclePriorityOf} onOpenPeek={setPeekId}
                onCardDragStart={setDragId} onCardDragEnd={() => { setDragId(null); setDragOverGroup(null) }}
                onColDragOver={(g) => { if (dragOverGroup !== g) setDragOverGroup(g) }}
                onColDragLeave={() => setDragOverGroup(null)} onColDrop={onColDrop}
                groupBy={groupBy} onGroupByChange={setGroupBy}
                priorityFilter={priorityFilter} onTogglePriorityFilter={togglePriorityFilter}
                assigneeOptions={assigneeOptions} assigneeFilter={assigneeFilter} onToggleAssigneeFilter={toggleAssigneeFilter}
                onClearFilters={clearFilters} activeFilterCount={activeFilterCount}
              />
            )}
            {view === 'cycles' && <CyclesView groups={cycleListGroups} userInitial={userInitial} onOpen={(id) => { setActiveCycleId(id); setView('cycle-detail') }} />}
            {view === 'cycle-detail' && cd && (
              <CycleDetailView cd={cd} onBack={() => { setView('cycles'); setActiveCycleId(null) }} onOpenPeek={setPeekId} />
            )}
            {view === 'inbox' && (
              <InboxView
                rows={notifRows}
                unreadLabel={unread === 0 ? 'All caught up' : unread + ' unread'}
                onMarkRead={(id) => setNotifications((ns) => ns.map((x) => (x.id === id ? { ...x, read: true } : x)))}
                onMarkAllRead={() => setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))}
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
            {ph && <PlaceholderView title={ph.title} desc={ph.desc} iconPath={ICONS[ph.icon]} />}
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
      {paletteOpen && (
        <CommandPalette query={paletteQuery} groups={paletteGroups} onInput={setPaletteQuery} onClose={() => setPaletteOpen(false)} />
      )}
    </div>
  )
}
