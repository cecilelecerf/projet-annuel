import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { http } from '../lib/api'
import { trackEvent } from '../lib/matomo'
import { type ClinicId, type User } from '@armali/schemas'
import { match } from 'ts-pattern'
type StaffRole = Exclude<User['role'], 'CLIENT' | 'ADMIN' | 'VETERINARIAN'>

type ClientStore = Pick<User, 'id' | 'email' | 'firstname' | 'lastname' | 'avatarUrl'> & {
  role: 'CLIENT'
}

type StaffStore = Pick<User, 'id' | 'email' | 'firstname' | 'lastname' | 'avatarUrl'> & {
  clinicId: ClinicId
  role: StaffRole
}

type VeterinarianStore = Pick<User, 'id' | 'email' | 'firstname' | 'lastname' | 'avatarUrl'> & {
  role: 'VETERINARIAN'
  clinicIds: ClinicId[]
}

type AdminStore = Pick<User, 'id' | 'email' | 'firstname' | 'lastname' | 'avatarUrl'> & {
  role: 'ADMIN'
}

export type UserStore = ClientStore | StaffStore | AdminStore | VeterinarianStore

function toUserStore(data: UserStore): UserStore {
  return match(data)
    .with({ role: 'CLIENT' }, (d) => ({
      id: d.id,
      email: d.email,
      firstname: d.firstname,
      lastname: d.lastname,
      role: d.role,
      avatarUrl: d.avatarUrl,
    }))
    .with({ role: 'ADMIN' }, (d) => ({
      id: d.id,
      email: d.email,
      firstname: d.firstname,
      lastname: d.lastname,
      role: d.role,
      avatarUrl: d.avatarUrl,
    }))
    .with({ role: 'VETERINARIAN' }, (d) => ({
      id: d.id,
      email: d.email,
      firstname: d.firstname,
      lastname: d.lastname,
      role: d.role,
      avatarUrl: d.avatarUrl,
      clinicIds: d.clinicIds,
    }))
    .otherwise((d) => ({
      id: d.id,
      email: d.email,
      firstname: d.firstname,
      lastname: d.lastname,
      role: d.role,
      avatarUrl: d.avatarUrl,
      clinicId: d.clinicId,
    }))
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
      const data = await http.get<UserStore>('/auth/me')
      user.value = toUserStore(data)
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
    try {
      await http.post('/auth/logout', { refreshToken: refreshToken.value })
    } finally {
      trackEvent('auth', 'logout')
      clearAuth()
    }
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
    refreshToken,
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
