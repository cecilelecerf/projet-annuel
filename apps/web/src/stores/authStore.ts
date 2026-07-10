import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { http } from '../lib/api'
import { type ClinicId, type User } from '@armali/schemas'
export type UserStore = Pick<
  User,
  'id' | 'email' | 'firstname' | 'lastname' | 'role' | 'avatarUrl'
> & {
  clinicId?: ClinicId
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserStore | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isAuthenticated = computed(() => !!accessToken.value)
  const clearAuth = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

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
      const data = await http.get<UserStore>('/auth/me').then()
      user.value = {
        id: data.id,
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        role: data.role,
        avatarUrl: data.avatarUrl,
        clinicId: data.clinicId,
      }
    } catch {
      clearAuth()
    }
  }

  type LoginResponse =
    | { twoFactorRequired: true; email: string }
    | { user: UserStore; accessToken: string; refreshToken: string }

  const login = async (
    email: string,
    password: string,
  ): Promise<{ twoFactorRequired: true; email: string } | { twoFactorRequired: false }> => {
    const data = await http.post<LoginResponse>('/auth/login', { email, password })

    if ('twoFactorRequired' in data) {
      return { twoFactorRequired: true, email: data.email }
    }

    setAuth(data.user, data.accessToken, data.refreshToken)
    return { twoFactorRequired: false }
  }

  const verifyTwoFactor = async (email: string, code: string) => {
    const data = await http.post<{ user: UserStore; accessToken: string; refreshToken: string }>(
      '/auth/login/verify-2fa',
      { email, code },
    )
    setAuth(data.user, data.accessToken, data.refreshToken)
  }

  const logout = async () => {
    await http.post('/auth/logout', { refreshToken: refreshToken.value })
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    clearAuth()
  }

  const forgotPassword = async (email: string) => {
    await http.post<{ message: string }>('/auth/forgot-password', { email })
  }

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await http.post('/auth/reset-password', { email, code, newPassword })
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    login,
    verifyTwoFactor,
    logout,
    init,
    clearAuth,
    setAuth,
    forgotPassword,
    resetPassword,
  }
})
