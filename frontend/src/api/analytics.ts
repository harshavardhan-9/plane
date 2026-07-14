import client from './client'
import type { DashboardStats } from '../types'

export const getDashboard = (slug: string) =>
  client.get<DashboardStats>(`/workspaces/${slug}/dashboard`).then((r) => r.data)
