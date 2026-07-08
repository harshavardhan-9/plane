import client from './client'
import type { Issue, IssueComment, IssueActivity } from '../types'

const base = (slug: string, projectId: string) => `/workspaces/${slug}/projects/${projectId}/issues`

export const getIssues = (slug: string, projectId: string) =>
  client.get<Issue[]>(base(slug, projectId)).then((r) => r.data)

export const createIssue = (slug: string, projectId: string, data: { title: string; stateId?: string; priority?: string; assigneeIds?: string[] }) =>
  client.post<Issue>(base(slug, projectId), data).then((r) => r.data)

export const updateIssue = (slug: string, projectId: string, issueId: string, patch: Partial<{ title: string; description: string; stateId: string; priority: string; assigneeIds: string[]; dueDate: string | null }>) =>
  client.patch<Issue>(`${base(slug, projectId)}/${issueId}`, patch).then((r) => r.data)

export const getActivity = (slug: string, projectId: string, issueId: string) =>
  client.get<IssueActivity[]>(`${base(slug, projectId)}/${issueId}/activity`).then((r) => r.data)

export const getComments = (slug: string, projectId: string, issueId: string) =>
  client.get<IssueComment[]>(`${base(slug, projectId)}/${issueId}/comments`).then((r) => r.data)

export const addComment = (slug: string, projectId: string, issueId: string, body: string) =>
  client.post<IssueComment>(`${base(slug, projectId)}/${issueId}/comments`, { body }).then((r) => r.data)
