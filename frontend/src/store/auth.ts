import type { User } from '../types'

export const saveAuth = (accessToken: string, refreshToken: string, user: User) => {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

export const getStoredUser = (): User | null => {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export const isAuthenticated = () => !!localStorage.getItem('accessToken')
