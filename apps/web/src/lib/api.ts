const BASE_URL = 'http://localhost:3000'

export const api = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur serveur')
  }
  if (response.status === 204) return null

  return response.json()
}
