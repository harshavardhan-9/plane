import axios from 'axios'

const client = axios.create({ baseURL: '/api/v1' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url: string = error.config?.url ?? ''
    const isAuthCall = url.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
