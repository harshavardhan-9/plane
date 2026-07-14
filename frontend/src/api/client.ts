import axios from 'axios'
import type { AuthResponse } from '../types'
import { saveAuth, clearAuth } from '../store/auth'

const client = axios.create({ baseURL: '/api/v1' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Single-flight refresh: concurrent 401s share one /refresh call instead of each
// spending the refresh token — our backend rotates it single-use, so a second
// concurrent call with the same token would trigger reuse detection and kill
// the whole session.
let refreshPromise: Promise<string> | null = null

const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<AuthResponse>('/api/v1/auth/refresh', { refreshToken: localStorage.getItem('refreshToken') })
      .then((res) => {
        saveAuth(res.data.accessToken, res.data.refreshToken, res.data.user)
        return res.data.accessToken
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config ?? {}
    const url: string = config.url ?? ''
    const isAuthCall = url.startsWith('/auth/')

    if (error.response?.status === 401 && !isAuthCall && !config._retry && localStorage.getItem('refreshToken')) {
      config._retry = true
      try {
        const newAccessToken = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${newAccessToken}`
        return client(config)
      } catch {
        clearAuth()
        if (window.location.pathname !== '/login') window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    if (error.response?.status === 401 && !isAuthCall) {
      clearAuth()
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
