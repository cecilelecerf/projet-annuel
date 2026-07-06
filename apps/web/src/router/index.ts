import { useAuthStore, type UserStore } from '@/stores/authStore'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { clientRouter } from './clientRouter'
import { veterinarianRouter } from './veterinarianRouter'
import { directorRouter } from './directorRouter'
import { secretaryRouter } from './secretaryRouter'
import { referentRouter } from './referentRouter'
import { adminRouter } from './adminRouter'

export const roleHomeMap: Record<UserStore['role'], string> = {
  DIRECTOR: '/director',
  VETERINARIAN: '/veterinarian',
  SECRETARY: '/secretary',
  REFERENT: '/referent',
  CLIENT: '/mon-espace',
  ADMIN: '/admin',
} as const

// Routes accessibles uniquement si non connecté (redirection si déjà connecté)
const AUTH_ONLY_ROUTES = ['Login', 'Register', 'Landing']

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingPageView.vue'),
    meta: { public: true },
  },
  {
    path: '/design-system',
    name: 'DesignSystem',
    component: () => import('@/views/DesignSystem.vue'),
    meta: { public: true },
  },
  ...clientRouter,
  ...veterinarianRouter,
  ...directorRouter,
  ...secretaryRouter,
  ...referentRouter,
  ...adminRouter,
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/features/auth/views/RegisterView.vue'),
    meta: { public: true },
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/features/auth/views/UnauthorizedView.vue'),
    meta: { public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

let authInitialized = false

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Initialise l'auth une seule fois (garde défensive en plus de main.ts)
  if (!authInitialized) {
    authInitialized = true
    await authStore.init()
  }

  const role = authStore.user?.role

  // Connecté → ne peut plus accéder à landing / login / register
  if (role && AUTH_ONLY_ROUTES.includes(to.name as string)) {
    return roleHomeMap[role]
  }

  // Routes toujours accessibles (peu importe l'état d'auth)
  if (to.name === 'Unauthorized' || to.name === 'NotFound') return true

  // Route publique (non interceptée ci-dessus)
  if (to.meta?.public) return true

  // Route privée sans auth → login
  if (!role) return { name: 'Login' }

  return true
})

export default router
