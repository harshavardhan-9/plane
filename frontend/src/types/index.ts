export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: User
}

export interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  role: string
  memberCount?: number
}

export interface Project {
  id: string
  workspaceId: string
  name: string
  identifier: string
  description: string | null
  network: 'PUBLIC' | 'SECRET'
  emoji: string | null
  coverImage: string | null
  role?: string
  memberCount?: number
}

export interface State {
  id: string
  projectId: string
  name: string
  color: string
  group: 'BACKLOG' | 'UNSTARTED' | 'STARTED' | 'COMPLETED' | 'CANCELLED'
  defaultState: boolean
  sequence: number
}

export interface Issue {
  id: string
  projectId: string
  workspaceId: string
  title: string
  description: string | null
  stateId: string | null
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  sequence: number
  parentId: string | null
  dueDate: string | null
  completedAt: string | null
  assigneeIds: string[]
  labelIds: string[]
  identifier: string
  createdAt: string
  updatedAt: string
}

export interface ApiError {
  status: number
  error: string
  message: string
}

export interface WorkspaceMember {
  memberId: string
  userId: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: string
}

export interface DashboardStats {
  myOpenIssues: number
  overdueIssues: number
  activeCycles: number
  totalIssues: number
  completedIssues: number
  completionPercentage: number
}

export interface IssueComment {
  id: string
  issueId: string
  authorId: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface IssueActivity {
  id: string
  issueId: string
  actorId: string
  verb: string
  field: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

export interface CycleProgress {
  total: number
  completed: number
  percentage: number
}

export interface ApiCycle {
  id: string
  projectId: string
  workspaceId: string
  name: string
  description: string | null
  status: string
  startDate: string | null
  endDate: string | null
  progress: CycleProgress
}

export interface BurndownPoint {
  date: string
  total: number
  completed: number
  remaining: number
}

export interface SearchResult {
  id: string
  projectId: string
  workspaceId: string
  title: string
  description: string | null
  priority: string
  sequence: number
}

export interface Label {
  id: string
  projectId: string
  name: string
  color: string
}
