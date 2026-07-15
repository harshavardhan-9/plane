// Static data ported 1:1 from the Claude Design "Plane App" project.
// This is the faithful mock dataset; backend wiring comes as a follow-up.

export type StateKey = 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled'
export type PriorityKey = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type AssigneeKey = 'A' | 'S' | 'R'
export type LabelKey = 'design' | 'backend' | 'bug' | 'feature'

export interface Issue {
  id: number
  seq: number
  name: string
  state: StateKey
  priority: PriorityKey
  assignee: AssigneeKey
  due: string
  labels: LabelKey[]
  desc?: string
}

export interface Cycle {
  id: number
  name: string
  range: string
  progress: number
  group: 'active' | 'upcoming' | 'completed'
}

export interface Comment { who: AssigneeKey; text: string; time: string }

export interface Member {
  name: string
  email: string
  role: string
  initial: string
  bg: string
  roleBg: string
  roleColor: string
}

export interface RowLabel { name: string; bg: string; color: string }

export interface WorkRow {
  id: string
  key: string
  name: string
  stateLabel: string
  stateColor: string
  priorityColor: string
  priorityPath: string
  assigneeInitial: string
  assigneeName: string
  assigneeBg: string
  due: string
  labels: RowLabel[]
  dragOpacity: number
}

export interface WorkGroup {
  key: string
  label: string
  color: string
  count: number
  items: WorkRow[]
  isQuickAdd: boolean
  dropBg: string
}

export const STATES: { key: StateKey; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: '#d9d9d9' },
  { key: 'unstarted', label: 'Todo', color: '#3f76ff' },
  { key: 'started', label: 'In Progress', color: '#f59e0b' },
  { key: 'completed', label: 'Done', color: '#16a34a' },
  { key: 'cancelled', label: 'Cancelled', color: '#dc2626' },
]

export const PRIORITIES: Record<PriorityKey, { color: string; path: string }> = {
  urgent: { color: 'oklch(0.5798 0.1766 26.99)', path: 'M12 5v9 M12 17.5v.5' },
  high: { color: 'oklch(0.6802 0.1633 50.67)', path: 'M6 18v-3 M12 18v-8 M18 18V5' },
  medium: { color: 'oklch(0.72 0.1466 82.04)', path: 'M6 18v-3 M12 18v-8 M18 18v-1.5' },
  low: { color: 'oklch(0.579 0.1807 262.31)', path: 'M6 18v-3 M12 18v-4.5 M18 18v-1.5' },
  none: { color: 'oklch(0.6376 0.0129 231.77)', path: 'M7 12h10' },
}

export const PRIORITY_ORDER: PriorityKey[] = ['none', 'low', 'medium', 'high', 'urgent']

export const ASSIGNEES: Record<AssigneeKey, { name: string; bg: string }> = {
  A: { name: 'Aarav', bg: 'oklch(0.5527 0.1361 288.8)' },
  S: { name: 'Sana', bg: 'oklch(0.5704 0.1574 345.25)' },
  R: { name: 'Rohit', bg: 'oklch(0.5883 0.1413 149.06)' },
}

export const LABELS: Record<LabelKey, { name: string; bg: string; color: string }> = {
  design: { name: 'design', bg: 'var(--label-indigo-bg)', color: 'var(--label-indigo-text)' },
  backend: { name: 'backend', bg: 'var(--label-emerald-bg)', color: 'var(--label-emerald-text)' },
  bug: { name: 'bug', bg: 'var(--label-crimson-bg)', color: 'var(--label-crimson-text)' },
  feature: { name: 'feature', bg: 'var(--label-yellow-bg)', color: 'var(--label-yellow-text)' },
}

export const ICONS = {
  home: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22 V12 h6 v10',
  inbox: 'M22 12 h-6 l-2 3 h-4 l-2 -3 H2 M5.45 5.11 2 12 v6 a2 2 0 0 0 2 2 h16 a2 2 0 0 0 2 -2 v-6 l-3.45 -6.89 A2 2 0 0 0 16.76 4 H7.24 a2 2 0 0 0 -1.79 1.11 z',
  projects: 'M16 21 V5 a2 2 0 0 0 -2 -2 h-4 a2 2 0 0 0 -2 2 v16 M2 9 a2 2 0 0 1 2 -2 h16 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 H4 a2 2 0 0 1 -2 -2 z',
  views: 'M12 2 20.5 6.5 12 11 3.5 6.5 z M3.5 12 12 16.5 20.5 12 M3.5 17.5 12 22 20.5 17.5',
  analytics: 'M12 20v-9 M18 20V4 M6 20v-4',
  cycles: 'M21 12 a9 9 0 1 1 -9 -9 M21 3 v6 h-6',
  modules: 'M12 2 20 7 v10 l-8 5 -8 -5 V7 z M12 12 20 7 M12 12 v10 M12 12 4 7',
  pages: 'M14 2 H6 a2 2 0 0 0 -2 2 v16 a2 2 0 0 0 2 2 h12 a2 2 0 0 0 2 -2 V8 z M14 2 v6 h6 M9 13 h6 M9 17 h4',
  workItems: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  intake: 'M12 3v12 M8 11l4 4 4-4 M4 17 v2 a2 2 0 0 0 2 2 h12 a2 2 0 0 0 2 -2 v-2',
  settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M15 12 a3 3 0 1 1 -6 0 a3 3 0 1 1 6 0',
  search: 'M11 19 a8 8 0 1 1 0 -16 a8 8 0 0 1 0 16 z m10 2 -4.3 -4.3',
  plus: 'M5 12h14 M12 5v14',
  chevronRight: 'm9 18 6-6-6-6',
  chevronDown: 'm6 9 6 6 6-6',
  hamburger: 'M3 5 h18 M3 12 h18 M3 19 h18',
  filters: 'M21 4h-7 M10 4H3 M21 12h-9 M8 12H3 M21 20h-5 M12 20H3 M14 2v4 M8 10v4 M16 18v4',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  board: 'M5 3 h4 a1 1 0 0 1 1 1 v16 a1 1 0 0 1 -1 1 h-4 a1 1 0 0 1 -1 -1 v-16 a1 1 0 0 1 1 -1 z M15 3 h4 a1 1 0 0 1 1 1 v8 a1 1 0 0 1 -1 1 h-4 a1 1 0 0 1 -1 -1 v-8 a1 1 0 0 1 1 -1 z',
  calendar: 'M8 2v4 M16 2v4 M3 10h18 M5 4 h14 a2 2 0 0 1 2 2 v14 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 V6 a2 2 0 0 1 2 -2 z',
  sun: 'M12 8 a4 4 0 1 1 0 8 a4 4 0 0 1 0 -8 z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  chevronLeft: 'm15 18-6-6 6-6',
  close: 'M18 6 6 18 M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  alert: 'M12 3 a9 9 0 1 1 0 18 a9 9 0 0 1 0 -18 z M12 8v4 M12 16h.01',
}

export const CYCLES: Cycle[] = [
  { id: 3, name: 'Cycle 3 — Polish & launch', range: 'Jul 21 – Aug 3', progress: 0, group: 'upcoming' },
  { id: 2, name: 'Cycle 2 — Core features', range: 'Jul 7 – Jul 20', progress: 45, group: 'active' },
  { id: 1, name: 'Cycle 1 — Foundation', range: 'Jun 23 – Jul 6', progress: 100, group: 'completed' },
]

export const cycleOf = (it: Issue): number => {
  if (it.state === 'completed' || it.state === 'cancelled') return 1
  if (it.state === 'started' || it.state === 'unstarted') return 2
  return 3
}

export const SEED_COMMENTS: Record<number, Comment[]> = {
  7: [{ who: 'S', text: 'Blocked on the drop-target refactor — see branch feat/dnd.', time: '2h ago' }],
}

export const SEED_ISSUES: Issue[] = [
  { id: 1, seq: 4, name: 'Design workspace switcher dropdown', state: 'backlog', priority: 'low', assignee: 'S', due: 'Jul 18', labels: ['design'] },
  { id: 2, seq: 7, name: 'Rate-limit public API endpoints', state: 'backlog', priority: 'none', assignee: 'A', due: 'Jul 24', labels: [] },
  { id: 3, seq: 21, name: 'Add keyboard shortcuts for layout switching', state: 'backlog', priority: 'medium', assignee: 'R', due: 'Jul 30', labels: ['feature'] },
  { id: 4, seq: 9, name: 'Implement JWT refresh-token rotation', state: 'unstarted', priority: 'urgent', assignee: 'A', due: 'Jul 10', labels: ['backend'] },
  { id: 5, seq: 14, name: 'Cycle burndown chart endpoint', state: 'unstarted', priority: 'high', assignee: 'A', due: 'Jul 12', labels: ['backend'] },
  { id: 6, seq: 17, name: 'Empty states for Modules and Pages', state: 'unstarted', priority: 'low', assignee: 'S', due: 'Jul 15', labels: ['design'] },
  { id: 7, seq: 11, name: 'Drag-and-drop ordering in board view', state: 'started', priority: 'urgent', assignee: 'R', due: 'Jul 8', labels: ['feature'] },
  { id: 8, seq: 13, name: 'Work item peek overview panel', state: 'started', priority: 'high', assignee: 'S', due: 'Jul 9', labels: ['feature'] },
  { id: 9, seq: 6, name: 'Dark theme token audit', state: 'started', priority: 'medium', assignee: 'A', due: 'Jul 11', labels: ['design', 'bug'] },
  { id: 10, seq: 2, name: 'Project CRUD with role permissions', state: 'completed', priority: 'high', assignee: 'A', due: 'Jun 28', labels: ['backend'] },
  { id: 11, seq: 3, name: 'Auth screens — email and password flow', state: 'completed', priority: 'urgent', assignee: 'S', due: 'Jun 25', labels: [] },
  { id: 12, seq: 5, name: 'Set up CI pipeline with preview deploys', state: 'completed', priority: 'medium', assignee: 'R', due: 'Jun 30', labels: [] },
  { id: 13, seq: 8, name: 'Spike: realtime sync via websockets', state: 'cancelled', priority: 'none', assignee: 'R', due: 'Jun 20', labels: [] },
]
