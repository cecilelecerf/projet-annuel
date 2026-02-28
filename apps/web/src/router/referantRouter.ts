import { requireRole } from './utils'

const referantRouter = [
  {
    path: '/referent',
    component: () => import('@/layouts/ReferentLayout.vue'),
    beforeEnter: requireRole('REFERANT'),
    children: [
      {
        path: '',
        name: 'Referent.Home',
        //        component: () => import('@/views/referent/Home.vue'),
      },

      // ── Administration & Configuration ────────────────────────
      {
        path: 'administration',
        name: 'Referent.Administration',
        //        component: () => import('@/views/referent/administration/Administration.vue'),
        children: [
          {
            path: 'etablissement',
            name: 'Referent.Admin.Etablissement',
            //            component: () => import('@/views/referent/administration/GestionEtablissement.vue'),
            // Modification adresse de l'établissement, horaires, email & tel
          },
          {
            path: 'personnel',
            name: 'Referent.Admin.Personnel',
            //            component: () => import('@/views/referent/administration/GestionPersonnel.vue'),
            // CRUD des vétérinaires, CRUD des secrétaires
          },
        ],
      },

      // ── Boutique ─────────────────────────────────────────────
      {
        path: 'boutique',
        name: 'Referent.Boutique',
        //        component: () => import('@/views/referent/boutique/Boutique.vue'),
        children: [
          {
            path: 'produits',
            name: 'Referent.Boutique.Produits',
            //            component: () => import('@/views/referent/boutique/Produits.vue'),
            // Ajout de nouveaux produits
          },
          {
            path: 'actions',
            name: 'Referent.Boutique.Actions',
            //            component: () => import('@/views/referent/boutique/Actions.vue'),
            // Indiquer un réapprovisionnement de produit,
            // Gestion des stocks et prix,
            // Définition du stocks minimum à avoir
          },
        ],
      },

      // ── Analyse Statistique ───────────────────────────────────
      {
        path: 'statistiques',
        name: 'Referent.Statistiques',
        //        component: () => import('@/views/referent/statistiques/Statistiques.vue'),
        // (Pas de sous-pages définies dans l'arbo)
      },

      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'Referent.Messagerie',
        //        component: () => import('@/views/referent/messagerie/Messagerie.vue'),
        children: [
          {
            path: 'default-group',
            name: 'Referent.Messagerie.DefaultGroup',
            //            component: () => import('@/views/referent/messagerie/DefaultGroup.vue'),
            // Groupe par défaut avec tous le personnel de la clinique (sauf directeur)
          },
          {
            path: 'groupe',
            name: 'Referent.Messagerie.Groupe',
            //            component: () => import('@/views/referent/messagerie/Groupe.vue'),
            // Création de nouveaux groupes
          },
          {
            path: 'privees',
            name: 'Referent.Messagerie.Privees',
            //            component: () => import('@/views/referent/messagerie/Privees.vue'),
            // Envois de messages privées (à 1 seule personne)
          },
          {
            path: 'privees/:id',
            name: 'Referent.Messagerie.Conversation',
            //            component: () => import('@/views/referent/messagerie/Conversation.vue'),
          },
        ],
      },
    ],
  },
]
