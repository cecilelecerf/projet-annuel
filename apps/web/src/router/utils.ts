import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import type { roleHomeMap } from '.'

export const requireRole = (role: keyof typeof roleHomeMap) => {
  const guard = (
    _to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ): void => {
    const { user } = storeToRefs(useAuthStore())
    const userRole = user.value?.role
    if (!userRole) next({ name: 'Unauthorized' })
    else if (role === userRole) next()
    else next({ name: 'Unauthorized' })
  }
  return guard
}
