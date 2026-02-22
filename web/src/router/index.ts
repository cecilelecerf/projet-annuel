import { useAuthStore, type UserStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export const roleHomeMap: Record<UserStore['role'], string> = {
  director: '/directeur',
  veterinarian: '/veto',
  secretary: '/secretaire',
  referant: '/referent',
  client: '/',
} as const

const routes: RouteRecordRaw[] = [
  // ══════════════════════════════════════════════════════════════
  // 🌐 LANDING PAGE (public)
  // ══════════════════════════════════════════════════════════════
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/App.vue'),
    meta: { public: true },
  },

  // // ══════════════════════════════════════════════════════════════
  // // 🔓 AUTH (public)
  // // ══════════════════════════════════════════════════════════════
  // {
  //   path: '/login',
  //   name: 'Login',
  //   //  component: () => import('@/views/auth/Login.vue'),
  //   meta: { public: true },
  // },
  // {
  //   path: '/register',
  //   name: 'Register',
  //   //    component: () => import('@/views/auth/Register.vue'),
  //   meta: { public: true },
  // },
  // {
  //   path: '/unauthorized',
  //   name: 'Unauthorized',
  //   //    component: () => import('@/views/auth/Unauthorized.vue'),
  //   meta: { public: true },
  // },

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

  // Redirection si role non-client accède à '/' ou '/mon-espace'
  const clientlessRedirect = ['/', '/mon-espace']
  if (clientlessRedirect.includes(to.path) && role !== 'client' && roleHomeMap[role]) {
    return next(roleHomeMap[role])
  }
  next()
})

export default router
