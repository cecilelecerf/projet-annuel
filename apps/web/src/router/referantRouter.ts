import type { RouteRecordRaw } from 'vue-router'
import { requireRole } from './utils'

export const referantRouter: RouteRecordRaw[] = [
  {
    path: '/referent',
    component: () => import('@/layouts/ReferentLayout.vue'),
    beforeEnter: requireRole('REFERANT'),
    children: [
      {
        path: 'profil',
        name: 'Referent.Profil',
        component: () => import('@/features/users/views/referent/Profil.vue'),
      },
      {
        path: 'staff',
        name: 'Referent.Staff',
        component: () => import('@/features/users/views/referent/Staff.vue'),
      },
      {
        path: 'clinic',
        name: 'Referent.Clinic',
        component: () => import('@/features/users/views/referent/Clinic.vue'),
      },

      // ── Administration & Configuration ────────────────────────
      // {
      //   path: 'administration',
      //   name: 'Referent.Administration',
      //   //        component: () => import('@/views/referent/administration/Administration.vue'),
      //   children: [
      //     {
      //       path: 'etablissement',
      //       name: 'Referent.Admin.Etablissement',
      //       //            component: () => import('@/views/referent/administration/GestionEtablissement.vue'),
      //       // Modification adresse de l'établissement, horaires, email & tel
      //     },
      //     {
      //       path: 'personnel',
      //       name: 'Referent.Admin.Personnel',
      //       //            component: () => import('@/views/referent/administration/GestionPersonnel.vue'),
      //       // CRUD des vétérinaires, CRUD des secrétaires
      //     },
      //   ],
      // },

      // ── Boutique ─────────────────────────────────────────────
      // {
      //   path: 'boutique',
      //   name: 'Referent.Boutique',
      //   //        component: () => import('@/views/referent/boutique/Boutique.vue'),
      //   children: [
      //     {
      //       path: 'produits',
      //       name: 'Referent.Boutique.Produits',
      //       //            component: () => import('@/views/referent/boutique/Produits.vue'),
      //       // Ajout de nouveaux produits
      //     },
      //     {
      //       path: 'actions',
      //       name: 'Referent.Boutique.Actions',
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
      //   name: 'Referent.Statistiques',
      //   //        component: () => import('@/views/referent/statistiques/Statistiques.vue'),
      //   // (Pas de sous-pages définies dans l'arbo)
      // },

      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'Referent.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
    ],
  },
]
