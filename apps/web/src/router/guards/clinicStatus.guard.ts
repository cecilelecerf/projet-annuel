import { useAuthStore } from '@/stores/authStore'
import { useClinicStatusStore } from '@/stores/clinicStatusStore'
import { storeToRefs } from 'pinia'
import type { Router } from 'vue-router'

// Nom de la route de statut, jamais bloquée elle-même.
const CLINIC_STATUS_ROUTE = 'DIRECTOR.Clinic'
const PROFILE_ROUTE = 'DIRECTOR.Profil'

/**
 * Contrairement à `beforeEnter` sur une route (qui ne se redéclenche pas
 * quand on navigue entre deux enfants d'un même parent déjà "entré"),
 * `router.beforeEach` s'exécute sur CHAQUE navigation, quels que soient
 * les segments de route communs. C'est ce qu'il faut ici puisque le
 * statut de la clinique peut changer pendant la session (ex: passage
 * de PENDING à APPROVED) et doit être revérifié à chaque navigation.
 */
export function registerClinicStatusGuard(router: Router) {
  router.beforeEach(async (to) => {
    const { user } = storeToRefs(useAuthStore())

    // Ne concerne que les directeurs ; requireRole gère déjà les autres rôles.
    if (user.value?.role !== 'DIRECTOR') return true

    // La page de statut ne doit jamais être bloquée, sinon boucle infinie.
    if (to.name === CLINIC_STATUS_ROUTE || to.name === PROFILE_ROUTE) return true

    // Ne s'applique qu'aux routes sous /director (évite de fetch inutilement
    // si un directeur consulte une route hors de son espace).
    if (!to.path.startsWith('/director')) return true

    const clinicStatusStore = useClinicStatusStore()
    const status = await clinicStatusStore.fetchStatus()

    if (status !== 'APPROVED') {
      return { name: CLINIC_STATUS_ROUTE }
    }

    return true
  })
}
