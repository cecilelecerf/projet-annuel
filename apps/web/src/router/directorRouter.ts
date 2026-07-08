import type { RouteRecordRaw } from 'vue-router'
import { requireRole } from './utils'

export const directorRouter: RouteRecordRaw[] = [
  {
    path: '/director',
    component: () => import('@/layouts/DirectorLayout.vue'),
    beforeEnter: [requireRole('DIRECTOR')],
    children: [
      {
        path: '',
        name: 'DIRECTOR.Home',
        component: () => import('@/features/users/views/director/DirectorHomeView.vue'),
      },
      {
        path: 'profil',
        name: 'DIRECTOR.Profil',
        component: () => import('@/features/profile/views/ProfileView.vue'),
      },
      {
        path: 'calendar',
        name: 'DIRECTOR.Calendar',
        component: () => import('@/features/meetings/views/MeCalendarView.vue'),
      },
      {
        path: 'meetings/:id',
        name: 'DIRECTOR.Meetings.Detail',
        component: () => import('@/features/meetings/views/MeetingView.vue'),
      },
      {
        path: 'staff',
        name: 'DIRECTOR.Staff',
        component: () => import('@/features/staffs/views/StaffListView.vue'),
      },
      {
        path: 'staff/new',
        name: 'DIRECTOR.Staff.Create',
        component: () => import('@/features/staffs/views/StaffCreateView.vue'),
      },
      {
        path: 'staff/:id',
        name: 'DIRECTOR.Staff.Detail',
        component: () => import('@/features/staffs/views/StaffDetailView.vue'),
      },
      {
        path: 'clinique',
        name: 'DIRECTOR.Clinic',
        component: () => import('@/features/clinics/views/ClinicView.vue'),
      },
      {
        path: 'shop',
        name: 'DIRECTOR.Boutique',
        component: () => import('@/features/products/views/ShopView.vue'),
      },
      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'DIRECTOR.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
      {
        path: 'sales',
        name: 'DIRECTOR.Sales',
        component: () => import('@/features/sales/views/SalesView.vue'),
      },
    ],
  },
]
