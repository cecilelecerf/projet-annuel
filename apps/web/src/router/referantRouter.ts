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
        name: 'REFERENT.Profil',
        component: () => import('@/features/users/views/referent/ProfilView.vue'),
      },
      {
        path: 'staff',
        name: 'REFERENT.Staff',
        component: () => import('@/features/users/views/referent/Staff.vue'),
      },
      {
        path: 'clinic',
        name: 'REFERENT.Clinic',
        component: () => import('@/features/users/views/referent/Clinic.vue'),
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
