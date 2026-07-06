import type { RouteRecordRaw } from 'vue-router'
import { requireRole } from './utils'

export const referentRouter: RouteRecordRaw[] = [
  {
    path: '/referent',
    component: () => import('@/layouts/ReferentLayout.vue'),
    beforeEnter: requireRole('REFERENT'),
    children: [
      {
        path: '',
        name: 'REFERENT.Home',
        component: () => import('@/features/dashboard/views/HomeView.vue'),
      },
      {
        path: 'profil',
        name: 'REFERENT.Profil',
        component: () => import('@/features/profile/views/ProfileView.vue'),
      },
      {
        path: 'staff',
        name: 'REFERENT.Staff',
        component: () => import('@/features/staffs/views/StaffListView.vue'),
      },
      {
        path: 'staff/new',
        name: 'REFERENT.Staff.Create',
        component: () => import('@/features/staffs/views/StaffCreateView.vue'),
      },
      {
        path: 'staff/:id',
        name: 'REFERENT.Staff.Detail',
        component: () => import('@/features/staffs/views/StaffDetailView.vue'),
      },
      {
        path: 'clinic',
        name: 'REFERENT.Clinic',
        component: () => import('@/features/clinics/views/ClinicView.vue'),
      },
      {
        path: 'shop',
        name: 'REFERENT.Boutique',
        component: () => import('@/features/products/views/ShopView.vue'),
      },
      {
        path: 'messagerie',
        name: 'REFERENT.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
    ],
  },
]
