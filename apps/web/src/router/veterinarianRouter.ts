import type { RouteRecordRaw } from 'vue-router'
import { requireRole } from './utils'

export const veterinarianRouter: RouteRecordRaw[] = [
  {
    path: '/veterinarian',
    component: () => import('@/layouts/VetoLayout.vue'),
    beforeEnter: requireRole('VETERINARIAN'),
    children: [
      {
        path: '',
        name: 'VETERINARIAN.Home',
        component: () => import('@/features/users/views/veterinarian/VeterinarianHomeView.vue'),
      },
      // ── Agenda ───────────────────────────────────────────────
      {
        path: 'calendar',
        name: 'VETERINARIAN.Calendar',
        component: () => import('@/features/meetings/views/MeCalendarView.vue'),
      },

      {
        path: 'meetings/:id',
        name: 'VETERINARIAN.Meetings.Detail',
        component: () => import('@/features/meetings/views/MeetingView.vue'),
      },
      {
        path: 'availabilities',
        name: 'VETERINARIAN.Availability',
        component: () => import('@/features/availabilities/view/AvaibalitiesView.vue'),
      },
      {
        path: 'clients/:id',
        name: 'VETERINARIAN.Clients.Detail',
        component: () => import('@/features/users/views/client/ClientView.vue'),
      },
      {
        path: 'clients/:id/meetings',
        name: 'VETERINARIAN.Clients.Meetings.List',
        component: () => import('@/features/meetings/views/ListAnimalMeetingView.vue'),
      },
      {
        path: 'animals',
        name: 'VETERINARIAN.Animals.List',
        component: () => import('@/features/animals/views/AnimalsListView.vue'),
      },
      {
        path: 'animals/:id',
        name: 'VETERINARIAN.Animals.Detail',
        component: () => import('@/features/animals/views/AnimalDetailView.vue'),
      },
      {
        path: 'profil',
        name: 'VETERINARIAN.Profil',
        component: () => import('@/features/profile/views/ProfileView.vue'),
      },

      {
        path: 'pets',
        name: 'VETERINARIAN.Pets',
        component: () => import('@/features/pets/views/LinkPetsView.vue'),
      },

      {
        path: 'specialities',
        name: 'VETERINARIAN.Specialities',
        component: () => import('@/features/specialities/views/LinkSpecialitiesView.vue'),
      },
      // {
      //   path: 'agenda/rdv/:id',
      //   name: 'VETERINARIAN.Agenda.RDV.Detail',
      //   //        component: () => import('@/views/veto/agenda/DetailRDV.vue'),
      //   // Contient : Horaires, Infos résumé de l'animal (Nom, Type),
      //   //            Type de RDV (chirurgies, castration…)
      //   // Actions : Modification | Suppression | Création
      // },
      // {
      //   path: 'agenda/rdv/:id/fiche-animal',
      //   name: 'VETERINARIAN.Agenda.FicheAnimal',
      //   //        component: () => import('@/views/veto/agenda/FicheAnimal.vue'),
      //   // Propilo, Nom, Poids, Taille, Nourriture
      // },
      // {
      //   path: 'agenda/rdv/:id/carnet-sante',
      //   name: 'VETERINARIAN.Agenda.CarnetSante',
      //   //        component: () => import('@/views/veto/agenda/CarnetSante.vue'),
      //   // Graphique poids/taille, Vaccins (date), Chirurgie, actions lourdes
      // },
      // {
      //   path: 'agenda/rdv/:id/actions-carnet',
      //   name: 'VETERINARIAN.Agenda.ActionsCarnet',
      //   //        component: () => import('@/views/veto/agenda/ActionsCarnet.vue'),
      //   // Ajout réalisation de vaccins, Ajout médicaments administrés,
      //   // Ajout actions réalisées, Ajout informations en plus
      // },
      // {
      //   path: 'agenda/rdv/:id/rdv-list',
      //   name: 'VETERINARIAN.Agenda.RDVList',
      //   //        component: () => import('@/views/veto/agenda/RDVList.vue'),
      //   // Liste de tous les RDV avec infos sur véto, actions réalisées,
      //   // médicaments données, etc.
      // },
      // // ── Animaux ──────────────────────────────────────────────
      // {
      //   path: 'animaux',
      //   name: 'VETERINARIAN.Animaux',
      //   //        component: () => import('@/views/veto/animaux/Animaux.vue'),
      //   children: [
      //     {
      //       path: 'mes-animaux',
      //       name: 'VETERINARIAN.Animaux.MesAnimaux',
      //       //            component: () => import('@/views/veto/animaux/MesAnimaux.vue'),
      //       // Animaux dont il est le véto traitant
      //       // Infos : Nom, Photos, Taille, Poids
      //     },
      //     {
      //       path: 'derniers',
      //       name: 'VETERINARIAN.Animaux.Derniers',
      //       //            component: () => import('@/views/veto/animaux/DerniersAnimaux.vue'),
      //       // Les derniers animaux traités, les derniers RDVs
      //       // Infos : Nom, Photos, Taille, Poids
      //     },
      //   ],
      // },
      // {
      //   path: 'animaux/:id',
      //   name: 'VETERINARIAN.Animal.Fiche',
      //   //        component: () => import('@/views/veto/animaux/FicheAnimal.vue'),
      //   // Propilo, Nom, Poids, Taille, Nourriture
      // },
      // {
      //   path: 'animaux/:id/carnet-sante',
      //   name: 'VETERINARIAN.Animal.CarnetSante',
      //   //        component: () => import('@/views/veto/animaux/CarnetSante.vue'),
      //   // Graphique poids/taille, Vaccins (date), Chirurgie, actions lourdes
      // },
      // {
      //   path: 'animaux/:id/actions-carnet',
      //   name: 'VETERINARIAN.Animal.ActionsCarnet',
      //   //        component: () => import('@/views/veto/animaux/ActionsCarnet.vue'),
      //   // Ajout réalisation de vaccins, Ajout médicaments administrés,
      //   // Ajout actions réalisées, Ajout informations en plus
      // },
      // {
      //   path: 'animaux/:id/rdv',
      //   name: 'VETERINARIAN.Animal.RDV',
      //   //        component: () => import('@/views/veto/animaux/RDVAnimal.vue'),
      //   // Liste de tous les RDV avec infos sur véto, actions réalisées,
      //   // médicaments données, etc.
      // },
      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'VETERINARIAN.Messagerie',
        component: () => import('@/features/messaging/views/MessagingView.vue'),
      },
      // // ── Profil ───────────────────────────────────────────────
      // {
      //   path: 'profil',
      //   name: 'VETERINARIAN.Profil',
      //   //        component: () => import('@/views/veto/profil/Profil.vue'),
      //   children: [
      //     {
      //       path: 'parametres',
      //       name: 'VETERINARIAN.Profil.Parametres',
      //       //            component: () => import('@/views/veto/profil/Parametres.vue'),
      //       // Informations personnelles, Modification des infos,
      //       // Suppression du compte, Déconnexion
      //     },
      //     {
      //       path: 'fiche-veterinaire',
      //       name: 'VETERINARIAN.Profil.FicheVeterinaire',
      //       //            component: () => import('@/views/veto/profil/FicheVeterinaire.vue'),
      //       // Info métière
      //     },
      //     {
      //       path: 'rgpd',
      //       name: 'VETERINARIAN.Profil.RGPD',
      //       //            component: () => import('@/views/veto/profil/RGPD.vue'),
      //       // Utilisation des données perso, Suppressions des données perso
      //     },
      //   ],
      // },
    ],
  },
]
