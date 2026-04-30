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
        name: 'Veto.Home',
        component: () => import('@/views/veterinarian/Home.vue'),
      },
      // ── Agenda ───────────────────────────────────────────────
      {
        path: 'calendar',
        name: 'Veto.Calendar',
        component: () => import('@/views/calendar/CalendarView.vue'),
      },
      // {
      //   path: 'agenda/rdv/:id',
      //   name: 'Veto.Agenda.RDV.Detail',
      //   //        component: () => import('@/views/veto/agenda/DetailRDV.vue'),
      //   // Contient : Horaires, Infos résumé de l'animal (Nom, Type),
      //   //            Type de RDV (chirurgies, castration…)
      //   // Actions : Modification | Suppression | Création
      // },
      // {
      //   path: 'agenda/rdv/:id/fiche-animal',
      //   name: 'Veto.Agenda.FicheAnimal',
      //   //        component: () => import('@/views/veto/agenda/FicheAnimal.vue'),
      //   // Propilo, Nom, Poids, Taille, Nourriture
      // },
      // {
      //   path: 'agenda/rdv/:id/carnet-sante',
      //   name: 'Veto.Agenda.CarnetSante',
      //   //        component: () => import('@/views/veto/agenda/CarnetSante.vue'),
      //   // Graphique poids/taille, Vaccins (date), Chirurgie, actions lourdes
      // },
      // {
      //   path: 'agenda/rdv/:id/actions-carnet',
      //   name: 'Veto.Agenda.ActionsCarnet',
      //   //        component: () => import('@/views/veto/agenda/ActionsCarnet.vue'),
      //   // Ajout réalisation de vaccins, Ajout médicaments administrés,
      //   // Ajout actions réalisées, Ajout informations en plus
      // },
      // {
      //   path: 'agenda/rdv/:id/rdv-list',
      //   name: 'Veto.Agenda.RDVList',
      //   //        component: () => import('@/views/veto/agenda/RDVList.vue'),
      //   // Liste de tous les RDV avec infos sur véto, actions réalisées,
      //   // médicaments données, etc.
      // },
      // // ── Animaux ──────────────────────────────────────────────
      // {
      //   path: 'animaux',
      //   name: 'Veto.Animaux',
      //   //        component: () => import('@/views/veto/animaux/Animaux.vue'),
      //   children: [
      //     {
      //       path: 'mes-animaux',
      //       name: 'Veto.Animaux.MesAnimaux',
      //       //            component: () => import('@/views/veto/animaux/MesAnimaux.vue'),
      //       // Animaux dont il est le véto traitant
      //       // Infos : Nom, Photos, Taille, Poids
      //     },
      //     {
      //       path: 'derniers',
      //       name: 'Veto.Animaux.Derniers',
      //       //            component: () => import('@/views/veto/animaux/DerniersAnimaux.vue'),
      //       // Les derniers animaux traités, les derniers RDVs
      //       // Infos : Nom, Photos, Taille, Poids
      //     },
      //   ],
      // },
      // {
      //   path: 'animaux/:id',
      //   name: 'Veto.Animal.Fiche',
      //   //        component: () => import('@/views/veto/animaux/FicheAnimal.vue'),
      //   // Propilo, Nom, Poids, Taille, Nourriture
      // },
      // {
      //   path: 'animaux/:id/carnet-sante',
      //   name: 'Veto.Animal.CarnetSante',
      //   //        component: () => import('@/views/veto/animaux/CarnetSante.vue'),
      //   // Graphique poids/taille, Vaccins (date), Chirurgie, actions lourdes
      // },
      // {
      //   path: 'animaux/:id/actions-carnet',
      //   name: 'Veto.Animal.ActionsCarnet',
      //   //        component: () => import('@/views/veto/animaux/ActionsCarnet.vue'),
      //   // Ajout réalisation de vaccins, Ajout médicaments administrés,
      //   // Ajout actions réalisées, Ajout informations en plus
      // },
      // {
      //   path: 'animaux/:id/rdv',
      //   name: 'Veto.Animal.RDV',
      //   //        component: () => import('@/views/veto/animaux/RDVAnimal.vue'),
      //   // Liste de tous les RDV avec infos sur véto, actions réalisées,
      //   // médicaments données, etc.
      // },
      // // ── Messagerie ────────────────────────────────────────────
      // {
      //   path: 'messagerie',
      //   name: 'Veto.Messagerie',
      //   //        component: () => import('@/views/veto/messagerie/Messagerie.vue'),
      //   children: [
      //     {
      //       path: 'default-group',
      //       name: 'Veto.Messagerie.DefaultGroup',
      //       //            component: () => import('@/views/veto/messagerie/DefaultGroup.vue'),
      //       // Groupe par défaut avec tous le personnel de la clinique (sauf directeur)
      //     },
      //     {
      //       path: 'groupe',
      //       name: 'Veto.Messagerie.Groupe',
      //       //            component: () => import('@/views/veto/messagerie/Groupe.vue'),
      //       // Création de nouveaux groupes
      //     },
      //     {
      //       path: 'privees',
      //       name: 'Veto.Messagerie.Privees',
      //       //            component: () => import('@/views/veto/messagerie/Privees.vue'),
      //       // Envois de messages privées (à 1 seule personne)
      //     },
      //     {
      //       path: 'privees/:id',
      //       name: 'Veto.Messagerie.Conversation',
      //       //            component: () => import('@/views/veto/messagerie/Conversation.vue'),
      //     },
      //   ],
      // },
      // // ── Profil ───────────────────────────────────────────────
      // {
      //   path: 'profil',
      //   name: 'Veto.Profil',
      //   //        component: () => import('@/views/veto/profil/Profil.vue'),
      //   children: [
      //     {
      //       path: 'parametres',
      //       name: 'Veto.Profil.Parametres',
      //       //            component: () => import('@/views/veto/profil/Parametres.vue'),
      //       // Informations personnelles, Modification des infos,
      //       // Suppression du compte, Déconnexion
      //     },
      //     {
      //       path: 'fiche-veterinaire',
      //       name: 'Veto.Profil.FicheVeterinaire',
      //       //            component: () => import('@/views/veto/profil/FicheVeterinaire.vue'),
      //       // Info métière
      //     },
      //     {
      //       path: 'rgpd',
      //       name: 'Veto.Profil.RGPD',
      //       //            component: () => import('@/views/veto/profil/RGPD.vue'),
      //       // Utilisation des données perso, Suppressions des données perso
      //     },
      //   ],
      // },
    ],
  },
]
