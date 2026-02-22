import { useAuthStore, type UserStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { clientRouter } from './clientRouter'
import { veterinarianRouter } from './veterinarianRouter'
import { directorRouter } from './directorRouter'

export const roleHomeMap: Record<UserStore['role'], string> = {
  DIRECTOR: '/directeur',
  VETERINARIAN: '/veto',
  SECRETARY: '/secretaire',
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
    component: () => import('@/views/LandingPage.vue'),
    meta: { public: true },
  },
  ...clientRouter,
  ...veterinarianRouter,
  ...directorRouter,

  // // ══════════════════════════════════════════════════════════════
  // // 🔓 AUTH (public)
  // // ══════════════════════════════════════════════════════════════
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { public: true },
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/views/auth/Unauthorized.vue'),
    meta: { public: true },
  },

  // ══════════════════════════════════════════════════════════════
  // 🔀 REDIRECTIONS
  // ══════════════════════════════════════════════════════════════
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
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
