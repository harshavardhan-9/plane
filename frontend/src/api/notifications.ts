import client from './client'
import type { ApiNotification } from '../types'

export const getNotifications = (slug: string) =>
  client.get<ApiNotification[]>(`/workspaces/${slug}/notifications`).then((r) => r.data)

export const markNotificationRead = (slug: string, notificationId: string) =>
  client.patch(`/workspaces/${slug}/notifications/${notificationId}/read`)

export const markAllNotificationsRead = (slug: string) =>
  client.patch(`/workspaces/${slug}/notifications/read-all`)
