import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, http } from '../lib/api'
import { type ClinicId, type User } from '@armali/schemas'
export type UserStore = Pick<User, 'id' | 'email' | 'firstname' | 'lastname' | 'role'> & {
  clinicId?: ClinicId
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserStore | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isAuthenticated = computed(() => !!accessToken.value)

  const init = async () => {
    if (!isAuthenticated.value) return
    try {
      const data = await http.get<UserStore>('/auth/me')
      const userData: UserStore = {
        id: data.id,
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        role: data.role,
        clinicId: data.clinicId,
      }
      user.value = userData
    } catch {
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  const login = async (email: string, password: string) => {
    const data = await http.post<{ user: UserStore; accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        email,
        password,
      },
    )
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

  return { user, accessToken, isAuthenticated, login, logout, init }
})
