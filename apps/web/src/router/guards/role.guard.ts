import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export const requireRole = (role: string) => {
  const guard = (
    _to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ): void => {
    const { user } = storeToRefs(useAuthStore())
    const userRole = user.value?.role

    if (!userRole) {
      // Pas authentifié → le beforeEach global aurait dû rediriger, mais par sécurité
      next({ name: 'Login' })
    } else if (userRole === role) {
      next()
    } else {
      // Authentifié mais mauvais rôle → accès refusé
      next({ name: 'Unauthorized' })
    }
  }
  return guard
}
