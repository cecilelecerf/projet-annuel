import { useAuthStore, type UserStore } from '@/stores/authStore'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { clientRouter } from './clientRouter'
import { veterinarianRouter } from './veterinarianRouter'
import { directorRouter } from './directorRouter'
import { secretaryRouter } from './secretaryRouter'
import { referentRouter } from './referentRouter'
import { adminRouter } from './adminRouter'
import { registerClinicStatusGuard } from './guards/clinicStatus.guard'
import { trackPageView } from '@/lib/matomo'

export const roleHomeMap: Record<UserStore['role'], string> = {
  DIRECTOR: '/director',
  VETERINARIAN: '/veterinarian',
  SECRETARY: '/secretary',
  REFERENT: '/referent',
  CLIENT: '/mon-espace',
  ADMIN: '/admin',
} as const

// Routes accessibles uniquement si non connecté (redirection si déjà connecté)
const AUTH_ONLY_ROUTES = ['Login', 'Register', 'Landing', 'ForgotPassword', 'ResetPassword']

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
  {
    path: '/urgence/:token',
    name: 'EmergencyCard',
    component: () => import('@/features/animals/views/EmergencyCardView.vue'),
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
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
    meta: { public: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/features/auth/views/ResetPasswordView.vue'),
    meta: { public: true },
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/features/auth/views/UnauthorizedView.vue'),
    meta: { public: true },
  },
  {
    path: '/mentions-legales',
    name: 'MentionsLegales',
    component: () => import('@/views/legal/MentionsLegalesView.vue'),
    meta: { public: true },
  },
  {
    path: '/confidentialite',
    name: 'PrivacyPolicy',
    component: () => import('@/views/legal/PrivacyPolicyView.vue'),
    meta: { public: true },
  },
  {
    path: '/cgu',
    name: 'Cgu',
    component: () => import('@/views/legal/CguView.vue'),
    meta: { public: true },
  },
  {
    path: '/cgv',
    name: 'Cgv',
    component: () => import('@/views/legal/CgvView.vue'),
    meta: { public: true },
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/views/legal/ContactView.vue'),
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
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})
registerClinicStatusGuard(router)

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

router.afterEach((to) => {
  trackPageView(to.fullPath, to.name ? String(to.name) : undefined)
})

export default router
