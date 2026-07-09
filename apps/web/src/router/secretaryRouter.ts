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
        path: 'avaibalities',
        name: 'SECRETARY.Avaibality',
        component: () => import('@/features/availabilities/view/AvaibalitiesView.vue'),
      },
      {
        path: 'profil',
        name: 'SECRETARY.Profil',
        component: () => import('@/features/profile/views/ProfileView.vue'),
      },
      {
        path: 'veterinarian',
        name: 'SECRETARY.Veto.List',
        component: () => import('@/features/staffs/views/StaffListView.vue'),
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
        component: () => import('@/features/users/views/client/ClientView.vue'),
      },
      {
        path: 'animals/:id',
        name: 'SECRETARY.Animals.Detail',
        component: () => import('@/features/animals/views/AnimalView/AnimalView.vue'),
      },

      // // ── Boutique ─────────────────────────────────────────────
      {
        path: 'orders',
        name: 'SECRETARY.Orders',
        component: () => import('@/features/shop/views/SecretaryOrdersView.vue'),
      },

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
      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'SECRETARY.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
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
