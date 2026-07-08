import client from './client'
import type { Project, State, Label } from '../types'

export const getProjects = (slug: string) =>
  client.get<Project[]>(`/workspaces/${slug}/projects`).then((r) => r.data)

export const createProject = (slug: string, data: { name: string; identifier: string; network: string; description: string }) =>
  client.post<Project>(`/workspaces/${slug}/projects`, data).then((r) => r.data)

export const getStates = (slug: string, projectId: string) =>
  client.get<State[]>(`/workspaces/${slug}/projects/${projectId}/states`).then((r) => r.data)

export const getLabels = (slug: string, projectId: string) =>
  client.get<Label[]>(`/workspaces/${slug}/projects/${projectId}/labels`).then((r) => r.data)
