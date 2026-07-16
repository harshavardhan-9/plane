import client from './client'
import type { ApiCycle, Issue, BurndownPoint } from '../types'

const base = (slug: string, projectId: string) => `/workspaces/${slug}/projects/${projectId}/cycles`

export const getCycles = (slug: string, projectId: string) =>
  client.get<ApiCycle[]>(base(slug, projectId)).then((r) => r.data)

export const createCycle = (slug: string, projectId: string, data: { name: string; description?: string; startDate?: string; endDate?: string }) =>
  client.post<ApiCycle>(base(slug, projectId), data).then((r) => r.data)

export const getCycleIssues = (slug: string, projectId: string, cycleId: string) =>
  client.get<Issue[]>(`${base(slug, projectId)}/${cycleId}/issues`).then((r) => r.data)

export const addIssueToCycle = (slug: string, projectId: string, cycleId: string, issueId: string) =>
  client.post(`${base(slug, projectId)}/${cycleId}/issues`, { issueId })

export const removeIssueFromCycle = (slug: string, projectId: string, cycleId: string, issueId: string) =>
  client.delete(`${base(slug, projectId)}/${cycleId}/issues/${issueId}`)

export const getBurndown = (slug: string, projectId: string, cycleId: string) =>
  client.get<BurndownPoint[]>(`/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/burndown`).then((r) => r.data)
