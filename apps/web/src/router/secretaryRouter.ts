import type { RouteRecordRaw } from 'vue-router'
import { requireRole } from './utils'

export const secretaryRouter: RouteRecordRaw[] = [
  {
    path: '/secretary',
    component: () => import('@/layouts/SecretaryLayout.vue'),
    beforeEnter: requireRole('SECRETARY'),
    children: [
      {
        path: '',
        name: 'SECRETARY.Home',
        component: () => import('@/features/users/views/secretary/SecretaryHomeView.vue'),
        // Widget : Prévision du nb de visites
      },
      // ── Calendar ───────────────────────────────────────────────
      {
        path: 'calendar',
        name: 'SECRETARY.Calendar',
        component: () => import('@/features/meetings/views/MeCalendarView.vue'),
      },
      {
        path: 'profil',
        name: 'SECRETARY.Avaibality',
        component: () => import('@/features/availabilities/view/AvaibalitiesView.vue'),
      },
      {
        path: 'profil',
        name: 'SECRETARY.Profil',
        component: () => import('@/features/users/views/secretary/ProfilView.vue'),
      },
      {
        path: 'veterinarian',
        name: 'SECRETARY.Veto.List',
        component: () => import('@/features/users/views/UserListView.vue'),
      },
      {
        path: 'veterinarian/calendar/:id',
        name: 'SECRETARY.Veto.Calendar',
        component: () => import('@/features/meetings/views/UserCalendarView.vue'),
      },
      {
        path: 'meetings/:id',
        name: 'SECRETARY.Meetings.Detail',
        component: () => import('@/features/meetings/views/MeetingView.vue'),
        // Horaires, Infos résumé de l'animal (Nom, Type),
        // Type de RDV (chirurgies, castration…)
        // Actions : Modification | Suppression | Création
      },

      {
        path: 'users/:id',
        name: 'SECRETARY.Clients.Detail',
        component: () => import('@/features/users/views/client/UserView.vue'),
      },
      {
        path: 'animals/:id',
        name: 'SECRETARY.Animals.Detail',
        component: () => import('@/features/animals/views/AnimalView/AnimalView.vue'),
      },

      // // ── Boutique ─────────────────────────────────────────────
      // {
      //   path: 'boutique',
      //   name: 'SECRETARY.Boutique',
      //   //        component: () => import('@/views/secretary/boutique/Boutique.vue'),
      //   children: [
      //     {
      //       path: 'vente',
      //       name: 'SECRETARY.Boutique.Vente',
      //       //            component: () => import('@/views/secretary/boutique/VenteProduit.vue'),
      //       // Scan QR Code de la facture pour indiquer la récupération des produits
      //     },
      //   ],
      // },
      // ── Animaux ──────────────────────────────────────────────
      // {
      //   path: 'animals',
      //   name: 'SECRETARY.Animaux',
      //          component: () => import('@/views/secretary/animaux/Animaux.vue'),
      //   children: [
      //     {
      //       path: '',
      //       name: 'SECRETARY.Animaux.Tous',
      //       //            component: () => import('@/views/secretary/animaux/Tous.vue'),
      //       // Infos : Nom, Photos, Taille, Poids
      //       // Recherche par nom | Filtrage par type animaux…
      //     },
      //     {
      //       path: ':id',
      //       name: 'SECRETARY.Animal.Fiche',
      //       //            component: () => import('@/views/secretary/animaux/FicheAnimal.vue'),
      //       // Propilo, Nom, Poids, Taille, Nourriture
      //       // Action : Modification infos
      //     },
      //     {
      //       path: ':id/rdv',
      //       name: 'SECRETARY.Animal.RDV',
      //       //            component: () => import('@/views/secretary/animaux/RDVAnimal.vue'),
      //       // Liste de tous les RDV avec infos sur véto, actions réalisées,
      //       // médicaments données, etc.
      //     },
      //     {
      //       path: ':id/carnet-sante',
      //       name: 'SECRETARY.Animal.CarnetSante',
      //       //            component: () => import('@/views/secretary/animaux/CarnetSante.vue'),
      //       // Graphique poids/taille, Vaccins (date), Chirurgie, actions lourdes
      //       // Action : Transfert vers une autre clinique
      //     },
      //   ],
      // },
      // // ── Messagerie ────────────────────────────────────────────
      // {
      //   path: 'messagerie',
      //   name: 'SECRETARY.Messagerie',
      //   //        component: () => import('@/views/secretary/messagerie/Messagerie.vue'),
      //   children: [
      //     {
      //       path: 'default-group',
      //       name: 'SECRETARY.Messagerie.DefaultGroup',
      //       //            component: () => import('@/views/secretary/messagerie/DefaultGroup.vue'),
      //       // Groupe par défaut avec tous le personnel de la clinique (sauf directeur)
      //     },
      //     {
      //       path: 'groupe',
      //       name: 'SECRETARY.Messagerie.Groupe',
      //       //            component: () => import('@/views/secretary/messagerie/Groupe.vue'),
      //       // Création de nouveaux groupes
      //     },
      //     {
      //       path: 'privees',
      //       name: 'SECRETARY.Messagerie.Privees',
      //       //            component: () => import('@/views/secretary/messagerie/Privees.vue'),
      //       // Envois de messages privées (à 1 seule personne)
      //     },
      //     {
      //       path: 'privees/:id',
      //       name: 'SECRETARY.Messagerie.Conversation',
      //       //            component: () => import('@/views/secretary/messagerie/Conversation.vue'),
      //     },
      //   ],
      // },
      // // ── Profil ───────────────────────────────────────────────
      // {
      //   path: 'profil',
      //   name: 'SECRETARY.Profil',
      //   //        component: () => import('@/views/secretary/profil/Profil.vue'),
      //   children: [
      //     {
      //       path: 'parametres',
      //       name: 'SECRETARY.Profil.Parametres',
      //       //            component: () => import('@/views/secretary/profil/Parametres.vue'),
      //       // Informations personnelles, Modification des infos,
      //       // Suppression du compte, Déconnexion
      //     },
      //     {
      //       path: 'rgpd',
      //       name: 'SECRETARY.Profil.RGPD',
      //       //            component: () => import('@/views/secretary/profil/RGPD.vue'),
      //       // Utilisation des données perso, Suppressions des données perso
      //     },
      //   ],
      // },
    ],
  },
]
