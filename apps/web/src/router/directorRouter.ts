import type { RouteRecordRaw } from 'vue-router'
import { requireRole } from './utils'

export const directorRouter: RouteRecordRaw[] = [
  {
    path: '/director',
    component: () => import('@/layouts/DirectorLayout.vue'),
    beforeEnter: requireRole('DIRECTOR'),
    children: [
      {
        path: '',
        name: 'Director.Home',
        component: () => import('@/features/users/views/director/DirectorHomeView.vue'),
      },
      {
        path: 'profil',
        name: 'Director.Profil',
        component: () => import('@/features/users/views/director/Profil.vue'),
      },
      {
        path: 'staff',
        name: 'Director.Staff',
        component: () => import('@/features/users/views/director/Staff.vue'),
      },
      {
        path: 'clinique',
        name: 'Director.Clinic',
        component: () => import('@/features/users/views/director/Clinic.vue'),
      },
      // ── Administration & Configuration ────────────────────────
      // {
      //   path: 'administration',
      //   name: 'Director.Administration',
      //   //        component: () => import('@/views/directeur/administration/Administration.vue'),
      //   children: [
      //     {
      //       path: 'etablissement',
      //       name: 'Director.Admin.Etablissement',
      //       //            component: () => import('@/views/directeur/administration/GestionEtablissement.vue'),
      //       // Demandes de création d'une clinique, Modification de ses établissements
      //     },
      //     {
      //       path: 'personnel',
      //       name: 'Director.Admin.Personnel',
      //       //            component: () => import('@/views/directeur/administration/GestionPersonnel.vue'),
      //       // CRUD des référents cliniques, CRUD des vétérinaires, CRUD des secrétaires
      //     },
      //   ],
      // },
      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'Director.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
    ],
  },
]
