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
        name: 'Admin.Home',
        component: () => import('@/features/users/views/admin/Home.vue'),
      },
      {
        path: 'clinic-requests',
        name: 'Admin.ClinicRequests',
        component: () => import('@/features/users/views/admin/ClinicRequests.vue'),
      },
      {
        path: 'clinics',
        name: 'Admin.Clinics',
        component: () => import('@/features/users/views/admin/Clinics.vue'),
      },
      {
        path: 'specialities',
        name: 'Admin.Specialities',
        component: () => import('@/features/users/views/admin/Specialities.vue'),
      },
      {
        path: 'profil',
        name: 'Admin.Profil',
        component: () => import('@/features/users/views/admin/Profil.vue'),
      },
    ],
  },
]
