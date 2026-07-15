import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import type { Router } from 'vue-router'

const CHANGE_PASSWORD_ROUTE = 'ChangePasswordExpired'

/**
 * Bloque toute navigation tant que le mot de passe a expiré (60 jours),
 * quel que soit le rôle. Le compte n'est débloqué qu'après la mise à jour
 * du mot de passe (authStore.completePasswordChange()).
 */
export function registerPasswordExpiredGuard(router: Router) {
  router.beforeEach((to) => {
    const { passwordExpired, isAuthenticated } = storeToRefs(useAuthStore())

    if (!isAuthenticated.value || !passwordExpired.value) return true
    if (to.name === CHANGE_PASSWORD_ROUTE) return true

    return { name: CHANGE_PASSWORD_ROUTE }
  })
}
