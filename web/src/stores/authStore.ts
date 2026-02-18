import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'

interface User {
  id: string
  email: string
  firstname: string
  lastname: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))

  const isAuthenticated = computed(() => !!accessToken.value)

  const login = async (email: string, password: string) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    user.value = data.user
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken

    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
  }

  const logout = async () => {
    await api('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshToken.value }),
    })

    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return { user, accessToken, isAuthenticated, login, logout }
})
