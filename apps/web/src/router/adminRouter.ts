import type { RouteRecordRaw } from 'vue-router'
import { requireRole } from './utils'

export const adminRouter: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: () => import('@/layouts/SuperAdminLayout.vue'),
    beforeEnter: requireRole('ADMIN'),
    children: [
      {
        path: '',
        name: 'ADMIN.Home',
        component: () => import('@/features/users/views/admin/HomeView.vue'),
      },
      {
        path: 'clinic-requests',
        name: 'ADMIN.ClinicRequests',
        component: () => import('@/features/clinics/views/ClinicRequests.vue'),
      },
      {
        path: 'clinics',
        name: 'ADMIN.Clinics',
        component: () => import('@/features/clinics/views/ClinicsView.vue'),
      },
      {
        path: 'profil',
        name: 'ADMIN.Profil',
        component: () => import('@/features/profile/views/ProfileView.vue'),
      },
      {
        path: 'acts',
        name: 'ADMIN.Acts',
        component: () => import('@/features/acts/views/ActsView.vue'),
      },
    ],
  },
]
