import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'
import { type User } from '@armali/schemas'
export type UserStore = Pick<User, 'id' | 'email' | 'firstname' | 'lastname' | 'role'>

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserStore | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isAuthenticated = computed(() => !!accessToken.value)

  const setAuth = (userData: UserStore, access: string, refresh: string) => {
    user.value = userData
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  const init = async () => {
    if (!isAuthenticated.value) return
    try {
      const data = await api('/auth/me')
      user.value = {
        id: data.id,
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        role: data.role,
      }
    } catch {
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  const login = async (email: string, password: string) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setAuth(data.user, data.accessToken, data.refreshToken)
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

  return { user, accessToken, isAuthenticated, login, logout, init, setAuth }
})
