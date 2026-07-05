export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

let isRefreshing = false
let refreshQueue: ((token: string) => void)[] = []

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No refresh token')

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) throw new Error('Refresh failed')

  const data = await response.json()
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return data.accessToken
}
const api = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('accessToken')

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null as T
  if (response.status === 401 && !endpoint.includes('/auth/')) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          }
          resolve(api<T>(endpoint, options))
        })
      })
    }

    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()
      refreshQueue.forEach((cb) => cb(newToken))
      refreshQueue = []

      return api<T>(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      })
    } catch {
      refreshQueue = []
      const { useAuthStore } = await import('@/stores/authStore')
      useAuthStore().clearAuth()

      window.location.href = '/login'
      throw new ApiError(401, 'Session expirée')
    } finally {
      isRefreshing = false
    }
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    // Le middleware `validate` renvoie déjà { message, errors: Record<string,string[]> }
    // Le handler d'erreurs global renvoie { error, issues: ZodIssue[] } pour les ZodError non interceptées
    const fieldErrors: Record<string, string[]> | undefined =
      data?.errors && typeof data.errors === 'object'
        ? data.errors
        : Array.isArray(data?.issues)
          ? data.issues.reduce(
              (acc: Record<string, string[]>, issue: { path: (string | number)[]; message: string }) => {
                const key = issue.path.join('.') || '_'
                acc[key] = [...(acc[key] ?? []), issue.message]
                return acc
              },
              {},
            )
          : undefined

    const detail = fieldErrors ? Object.values(fieldErrors).flat().join(' — ') : undefined
    const baseMessage = data?.error ?? data?.message ?? 'Erreur serveur'
    const message = detail ? `${baseMessage} : ${detail}` : baseMessage

    throw new ApiError(response.status, message, fieldErrors)
  }

  return data as T
}

export const http = {
  get: <T>(endpoint: string) => api<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    api<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: unknown) =>
    api<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: unknown) =>
    api<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, { method: 'DELETE', body: JSON.stringify(body) }),
}
