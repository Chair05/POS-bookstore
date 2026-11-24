import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL || '/api'
const API_BASE_URL = (
  import.meta.env.PROD && /\.trycloudflare\.com/i.test(rawApiUrl)
    ? '/api'
    : rawApiUrl
).replace(/\/+$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** Resolves stored upload paths against an absolute VITE_API_URL when configured. */
export function resolveImageUrl(image) {
  if (!image) return '/placeholder-book.svg'
  if (/^https?:\/\//i.test(image)) return image
  if (image.startsWith('/uploads') && /^https?:\/\//i.test(API_BASE_URL)) {
    const origin = API_BASE_URL.replace(/\/api$/i, '')
    return `${origin}${image}`
  }
  return image
}

export function formatCurrency(amount) {
  const num = Number(amount || 0)
  return `₱${num.toLocaleString('en-PH')}`
}

export function formatCategoryLabel(name) {
  return String(name || '')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

export function maskEmail(email) {
  const [name = '', domain = ''] = String(email || '').split('@')
  if (name.length <= 2) return `${name[0] || ''}***@${domain}`
  return `${name.slice(0, 2)}***@${domain}`
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
