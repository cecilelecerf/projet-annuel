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
        path: 'products',
        name: 'ADMIN.Products',
        component: () => import('@/features/products/views/ProductCatalog.vue'),
      },
      {
        path: 'product-requests',
        name: 'ADMIN.ProductRequests',
        component: () => import('@/features/products/views/ProductRequests.vue'),
      },
      {
        path: 'fournisseurs',
        name: 'ADMIN.Suppliers',
        component: () => import('@/features/suppliers/views/SupplierListView.vue'),
      },
      {
        path: 'users',
        name: 'Admin.Users',
        component: () => import('@/features/users/views/admin/Users.vue'),
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
      {
        path: 'vaccines',
        name: 'ADMIN.Vaccines',
        component: () => import('@/features/vaccines/views/VaccinesView.vue'),
      },
      {
        path: 'pets',
        name: 'ADMIN.Pets',
        component: () => import('@/features/pets/views/PetsRacesView.vue'),
      },
    ],
  },
]
