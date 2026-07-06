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
        component: () => import('@/features/users/views/referent/ProfilView.vue'),
      },
      {
        path: 'staff',
        name: 'REFERENT.Staff',
        component: () => import('@/features/staff/views/StaffListView.vue'),
      },
      {
        path: 'staff/nouveau',
        name: 'REFERENT.Staff.Create',
        component: () => import('@/features/staff/views/StaffCreateView.vue'),
      },
      {
        path: 'staff/:id',
        name: 'REFERENT.Staff.Detail',
        component: () => import('@/features/staff/views/StaffDetailView.vue'),
      },
      {
        path: 'clinic',
        name: 'REFERENT.Clinic',
        component: () => import('@/features/clinic/views/ClinicView.vue'),
      },
      {
        path: 'boutique',
        name: 'REFERENT.Boutique',
        component: () => import('@/features/products/views/ShopView.vue'),
      },

      // ── Administration & Configuration ────────────────────────
      // {
      //   path: 'administration',
      //   name: 'REFERENT.Administration',
      //   //        component: () => import('@/views/referent/administration/Administration.vue'),
      //   children: [
      //     {
      //       path: 'etablissement',
      //       name: 'REFERENT.Admin.Etablissement',
      //       //            component: () => import('@/views/referent/administration/GestionEtablissement.vue'),
      //       // Modification adresse de l'établissement, horaires, email & tel
      //     },
      //     {
      //       path: 'personnel',
      //       name: 'REFERENT.Admin.Personnel',
      //       //            component: () => import('@/views/referent/administration/GestionPersonnel.vue'),
      //       // CRUD des vétérinaires, CRUD des secrétaires
      //     },
      //   ],
      // },

      // ── Boutique ─────────────────────────────────────────────
      // {
      //   path: 'boutique',
      //   name: 'REFERENT.Boutique',
      //   //        component: () => import('@/views/referent/boutique/Boutique.vue'),
      //   children: [
      //     {
      //       path: 'produits',
      //       name: 'REFERENT.Boutique.Produits',
      //       //            component: () => import('@/views/referent/boutique/Produits.vue'),
      //       // Ajout de nouveaux produits
      //     },
      //     {
      //       path: 'actions',
      //       name: 'REFERENT.Boutique.Actions',
      //       //            component: () => import('@/views/referent/boutique/Actions.vue'),
      //       // Indiquer un réapprovisionnement de produit,
      //       // Gestion des stocks et prix,
      //       // Définition du stocks minimum à avoir
      //     },
      //   ],
      // },

      // ── Analyse Statistique ───────────────────────────────────
      // {
      //   path: 'statistiques',
      //   name: 'REFERENT.Statistiques',
      //   //        component: () => import('@/views/referent/statistiques/Statistiques.vue'),
      //   // (Pas de sous-pages définies dans l'arbo)
      // },

      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'REFERENT.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
    ],
  },
]
