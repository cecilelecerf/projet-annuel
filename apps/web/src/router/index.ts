import { useAuthStore, type UserStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { clientRouter } from './clientRouter'
import { veterinarianRouter } from './veterinarianRouter'
import { directorRouter } from './directorRouter'
import { secretaryRouter } from './secretaryRouter'

export const roleHomeMap: Record<UserStore['role'], string> = {
  DIRECTOR: '/director',
  VETERINARIAN: '/veterinarian',
  SECRETARY: '/secretary',
  REFERANT: '/referent',
  CLIENT: '/',
} as const

const routes: RouteRecordRaw[] = [
  // ══════════════════════════════════════════════════════════════
  // 🌐 LANDING PAGE (public)
  // ══════════════════════════════════════════════════════════════
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingPageView.vue'),
    meta: { public: true },
  },
  ...clientRouter,
  ...veterinarianRouter,
  ...directorRouter,
  ...secretaryRouter,

  // // ══════════════════════════════════════════════════════════════
  // // 🔓 AUTH (public)
  // // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  // 🔀 REDIRECTIONS
  // ══════════════════════════════════════════════════════════════
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

// ─────────────────────────────────────────────────────────────────────────────
// Global guard : redirige chaque rôle vers son espace si besoin
// ─────────────────────────────────────────────────────────────────────────────
router.beforeEach((to, from, next) => {
  const { user } = storeToRefs(useAuthStore())
  const role = user.value?.role
  const publicRoutes = ['Login', 'Register', 'Unauthorized', 'NotFound']
  if (publicRoutes.includes(to.name as string) || to.meta?.public) return next()
  if (!role) return next({ name: 'Login' })

  next()
})

export default router
