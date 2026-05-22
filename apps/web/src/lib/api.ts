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

export const api = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
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

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, data.message ?? 'Erreur serveur', data.errors)
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

  delete: <T>(endpoint: string) => api<T>(endpoint, { method: 'DELETE' }),
}
