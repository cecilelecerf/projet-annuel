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
        name: 'DIRECTOR.Home',
        component: () => import('@/features/users/views/director/DirectorHomeView.vue'),
      },
      {
        path: 'profil',
        name: 'DIRECTOR.Profil',
        component: () => import('@/features/users/views/director/ProfilView.vue'),
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
        component: () => import('@/features/users/views/director/Staff.vue'),
      },
      {
        path: 'clinique',
        name: 'DIRECTOR.Clinic',
        component: () => import('@/features/users/views/director/ClinicView.vue'),
      },
      // ── Administration & Configuration ────────────────────────
      // {
      //   path: 'administration',
      //   name: 'DIRECTOR.Administration',
      //   //        component: () => import('@/views/directeur/administration/Administration.vue'),
      //   children: [
      //     {
      //       path: 'etablissement',
      //       name: 'DIRECTOR.Admin.Etablissement',
      //       //            component: () => import('@/views/directeur/administration/GestionEtablissement.vue'),
      //       // Demandes de création d'une clinique, Modification de ses établissements
      //     },
      //     {
      //       path: 'personnel',
      //       name: 'DIRECTOR.Admin.Personnel',
      //       //            component: () => import('@/views/directeur/administration/GestionPersonnel.vue'),
      //       // CRUD des référents cliniques, CRUD des vétérinaires, CRUD des secrétaires
      //     },
      //   ],
      // },
      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'DIRECTOR.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
    ],
  },
]
