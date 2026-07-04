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
        component: () => import('@/features/users/views/admin/ClinicRequests.vue'),
      },
    ],
  },
]
