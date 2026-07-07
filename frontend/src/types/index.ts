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
