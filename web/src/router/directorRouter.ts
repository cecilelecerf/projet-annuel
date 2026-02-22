import { requireRole } from './utils'

export const directorRouter = [
  {
    path: '/directeur',
    component: () => import('@/layouts/DirectorLayout.vue'),
    beforeEnter: requireRole('director'),
    children: [
      {
        path: '',
        name: 'Directeur.Home',
        //        component: () => import('@/views/directeur/Home.vue'),
      },
      // ── Administration & Configuration ────────────────────────
      {
        path: 'administration',
        name: 'Directeur.Administration',
        //        component: () => import('@/views/directeur/administration/Administration.vue'),
        children: [
          {
            path: 'etablissement',
            name: 'Directeur.Admin.Etablissement',
            //            component: () => import('@/views/directeur/administration/GestionEtablissement.vue'),
            // Demandes de création d'une clinique, Modification de ses établissements
          },
          {
            path: 'personnel',
            name: 'Directeur.Admin.Personnel',
            //            component: () => import('@/views/directeur/administration/GestionPersonnel.vue'),
            // CRUD des référents cliniques, CRUD des vétérinaires, CRUD des secrétaires
          },
        ],
      },
      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'Directeur.Messagerie',
        //        component: () => import('@/views/directeur/messagerie/Messagerie.vue'),
        children: [
          {
            path: 'groupe',
            name: 'Directeur.Messagerie.Groupe',
            //            component: () => import('@/views/directeur/messagerie/Groupe.vue'),
            // Création de nouveaux groupes
          },
          {
            path: 'privees',
            name: 'Directeur.Messagerie.Privees',
            //            component: () => import('@/views/directeur/messagerie/Privees.vue'),
            // Envois de messages privées (à 1 seule personne)
          },
          {
            path: 'privees/:id',
            name: 'Directeur.Messagerie.Conversation',
            //            component: () => import('@/views/directeur/messagerie/Conversation.vue'),
          },
        ],
      },
    ],
  },
]
