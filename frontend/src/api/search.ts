import client from './client'
import type { SearchResult } from '../types'

export const searchIssues = (slug: string, q: string) =>
  client.get<SearchResult[]>(`/workspaces/${slug}/search/issues`, { params: { q } }).then((r) => r.data)
