import client from './client'
import type { Project } from '../types'

export const getProjects = (slug: string) =>
  client.get<Project[]>(`/workspaces/${slug}/projects`).then((r) => r.data)

export const createProject = (slug: string, data: { name: string; identifier: string; network: string; description: string }) =>
  client.post<Project>(`/workspaces/${slug}/projects`, data).then((r) => r.data)
