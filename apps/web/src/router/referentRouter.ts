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
        component: () => import('@/features/users/views/referent/ReferentHomeView.vue'),
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
        path: 'clinics/:id/acts',
        name: 'REFERENT.Acts',
        component: () => import('@/features/clinic-acts/view/ClinicActView.vue'),
      },
      {
        path: 'clinics/:id/pets',
        name: 'REFERENT.Pets',
        component: () => import('@/features/pets/views/LinkPetsView.vue'),
      },
      {
        path: 'clinics/:id/specialities',
        name: 'REFERENT.Specialities',
        component: () => import('@/features/specialities/views/LinkSpecialitiesView.vue'),
      },
      {
        path: 'previsions',
        name: 'REFERENT.VisitsForecast',
        component: () => import('@/features/dashboard/views/VisitsForecastView.vue'),
      },

      // ── Messagerie ────────────────────────────────────────────

      {
        path: 'messagerie',
        name: 'REFERENT.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
      {
        path: 'sales',
        name: 'REFERENT.Sales',
        component: () => import('@/features/sales/views/SalesView.vue'),
      },
      {
        path: 'budget',
        name: 'REFERENT.Budget',
        component: () => import('@/features/budget/views/BudgetView.vue'),
      },
      {
        path: 'fournisseurs',
        name: 'REFERENT.Suppliers',
        component: () => import('@/features/suppliers/views/SupplierListView.vue'),
      },
      {
        path: 'commandes-fournisseurs',
        name: 'REFERENT.SupplierOrders',
        component: () => import('@/features/supplier-orders/views/SupplierOrderListView.vue'),
      },
    ],
  },
]
