import client from './client'
import type { Workspace, WorkspaceMember } from '../types'

export const getWorkspaces = () =>
  client.get<Workspace[]>('/workspaces').then((r) => r.data)

export const createWorkspace = (data: { name: string; slug: string; description?: string }) =>
  client.post<Workspace>('/workspaces', data).then((r) => r.data)

export const getWorkspace = (slug: string) =>
  client.get<Workspace>(`/workspaces/${slug}`).then((r) => r.data)

export const getMembers = (slug: string) =>
  client.get<WorkspaceMember[]>(`/workspaces/${slug}/members`).then((r) => r.data)

export const inviteMember = (slug: string, email: string) =>
  client.post(`/workspaces/${slug}/invites`, { email, role: 'MEMBER' }).then((r) => r.data)
