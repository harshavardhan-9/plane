import client from './client'
import type { Workspace } from '../types'

export const getWorkspaces = () =>
  client.get<Workspace[]>('/workspaces').then((r) => r.data)

export const createWorkspace = (data: { name: string; slug: string; description?: string }) =>
  client.post<Workspace>('/workspaces', data).then((r) => r.data)

export const getWorkspace = (slug: string) =>
  client.get<Workspace>(`/workspaces/${slug}`).then((r) => r.data)
