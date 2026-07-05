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
        name: 'Secretary.Home',
        component: () => import('@/features/users/views/secretary/SecretaryHomeView.vue'),
        // Widget : Prévision du nb de visites
      },
      // ── Calendar ───────────────────────────────────────────────
      {
        path: 'calendar',
        name: 'Secretary.Calendar',
        component: () => import('@/features/meetings/views/MeCalendarView.vue'),
      },
      {
        path: 'profil',
        name: 'Secretary.Profil',
        component: () => import('@/features/users/views/secretary/Profil.vue'),
      },
      {
        path: 'veterinarian',
        name: 'Secretary.Veto.List',
        component: () => import('@/features/users/views/secretary/UserListView.vue'),
      },
      {
        path: 'veterinarian/calendar/:id',
        name: 'Secretary.Veto.Calendar',
        component: () => import('@/features/meetings/views/UserCalendarView.vue'),
      },
      {
        path: 'meetings/:id',
        name: 'Secretary.Calendar.Meeting.Detail',
        component: () => import('@/features/meetings/views/MeetingView.vue'),
        // Horaires, Infos résumé de l'animal (Nom, Type),
        // Type de RDV (chirurgies, castration…)
        // Actions : Modification | Suppression | Création
      },

      {
        path: 'users/:id',
        name: 'Secretary.Users.Detail',
        component: () => import('@/features/users/views/UserView.vue'),
      },
      {
        path: 'animals/:id',
        name: 'Secretary.Animals.Detail',
        component: () => import('@/features/animals/views/AnimalView/AnimalView.vue'),
      },

      // // ── Boutique ─────────────────────────────────────────────
      // {
      //   path: 'boutique',
      //   name: 'Secretary.Boutique',
      //   //        component: () => import('@/views/secretary/boutique/Boutique.vue'),
      //   children: [
      //     {
      //       path: 'vente',
      //       name: 'Secretary.Boutique.Vente',
      //       //            component: () => import('@/views/secretary/boutique/VenteProduit.vue'),
      //       // Scan QR Code de la facture pour indiquer la récupération des produits
      //     },
      //   ],
      // },
      // ── Animaux ──────────────────────────────────────────────
      // {
      //   path: 'animals',
      //   name: 'Secretary.Animaux',
      //          component: () => import('@/views/secretary/animaux/Animaux.vue'),
      //   children: [
      //     {
      //       path: '',
      //       name: 'Secretary.Animaux.Tous',
      //       //            component: () => import('@/views/secretary/animaux/Tous.vue'),
      //       // Infos : Nom, Photos, Taille, Poids
      //       // Recherche par nom | Filtrage par type animaux…
      //     },
      //     {
      //       path: ':id',
      //       name: 'Secretary.Animal.Fiche',
      //       //            component: () => import('@/views/secretary/animaux/FicheAnimal.vue'),
      //       // Propilo, Nom, Poids, Taille, Nourriture
      //       // Action : Modification infos
      //     },
      //     {
      //       path: ':id/rdv',
      //       name: 'Secretary.Animal.RDV',
      //       //            component: () => import('@/views/secretary/animaux/RDVAnimal.vue'),
      //       // Liste de tous les RDV avec infos sur véto, actions réalisées,
      //       // médicaments données, etc.
      //     },
      //     {
      //       path: ':id/carnet-sante',
      //       name: 'Secretary.Animal.CarnetSante',
      //       //            component: () => import('@/views/secretary/animaux/CarnetSante.vue'),
      //       // Graphique poids/taille, Vaccins (date), Chirurgie, actions lourdes
      //       // Action : Transfert vers une autre clinique
      //     },
      //   ],
      // },
      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'Secretary.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
      // // ── Profil ───────────────────────────────────────────────
      // {
      //   path: 'profil',
      //   name: 'Secretary.Profil',
      //   //        component: () => import('@/views/secretary/profil/Profil.vue'),
      //   children: [
      //     {
      //       path: 'parametres',
      //       name: 'Secretary.Profil.Parametres',
      //       //            component: () => import('@/views/secretary/profil/Parametres.vue'),
      //       // Informations personnelles, Modification des infos,
      //       // Suppression du compte, Déconnexion
      //     },
      //     {
      //       path: 'rgpd',
      //       name: 'Secretary.Profil.RGPD',
      //       //            component: () => import('@/views/secretary/profil/RGPD.vue'),
      //       // Utilisation des données perso, Suppressions des données perso
      //     },
      //   ],
      // },
    ],
  },
]
