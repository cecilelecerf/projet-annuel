import { requireRole } from './utils'

export const secretaryRouter = [
  {
    path: '/secretaire',
    component: () => import('@/layouts/SecretaryLayout.vue'),
    beforeEnter: requireRole('secretary'),
    children: [
      {
        path: '',
        name: 'Secretaire.Home',
        //        component: () => import('@/views/secretaire/Home.vue'),
        // Widget : Prévision du nb de visites
      },
      // ── Agenda ───────────────────────────────────────────────
      {
        path: 'agenda',
        name: 'Secretaire.Agenda',
        //        component: () => import('@/views/secretaire/agenda/Agenda.vue'),
        children: [
          {
            path: 'journalier',
            name: 'Secretaire.Agenda.Journalier',
            //            component: () => import('@/views/secretaire/agenda/VueJournaliere.vue'),
          },
          {
            path: 'hebdomadaire',
            name: 'Secretaire.Agenda.Hebdomadaire',
            //            component: () => import('@/views/secretaire/agenda/VueHebdomadaire.vue'),
          },
          {
            path: 'mensuel',
            name: 'Secretaire.Agenda.Mensuel',
            //            component: () => import('@/views/secretaire/agenda/VueMensuelle.vue'),
          },
        ],
      },
      {
        path: 'agenda/tous',
        name: 'Secretaire.Agenda.Tous',
        //        component: () => import('@/views/secretaire/agenda/TousAgendas.vue'),
        // Voir les agendas de tous les vétos — Filtre sur un véto
      },
      {
        path: 'agenda/jour',
        name: 'Secretaire.Agenda.Jour',
        //        component: () => import('@/views/secretaire/agenda/VueJour.vue'),
        // Voir tous les RDV du jour (n'importe quel véto)
      },
      {
        path: 'agenda/rdv/:id',
        name: 'Secretaire.Agenda.RDV.Detail',
        //        component: () => import('@/views/secretaire/agenda/DetailRDV.vue'),
        // Horaires, Infos résumé de l'animal (Nom, Type),
        // Type de RDV (chirurgies, castration…)
        // Actions : Modification | Suppression | Création
      },
      // ── Boutique ─────────────────────────────────────────────
      {
        path: 'boutique',
        name: 'Secretaire.Boutique',
        //        component: () => import('@/views/secretaire/boutique/Boutique.vue'),
        children: [
          {
            path: 'vente',
            name: 'Secretaire.Boutique.Vente',
            //            component: () => import('@/views/secretaire/boutique/VenteProduit.vue'),
            // Scan QR Code de la facture pour indiquer la récupération des produits
          },
        ],
      },
      // ── Animaux ──────────────────────────────────────────────
      {
        path: 'animaux',
        name: 'Secretaire.Animaux',
        //        component: () => import('@/views/secretaire/animaux/Animaux.vue'),
        children: [
          {
            path: '',
            name: 'Secretaire.Animaux.Tous',
            //            component: () => import('@/views/secretaire/animaux/Tous.vue'),
            // Infos : Nom, Photos, Taille, Poids
            // Recherche par nom | Filtrage par type animaux…
          },
          {
            path: ':id',
            name: 'Secretaire.Animal.Fiche',
            //            component: () => import('@/views/secretaire/animaux/FicheAnimal.vue'),
            // Propilo, Nom, Poids, Taille, Nourriture
            // Action : Modification infos
          },
          {
            path: ':id/rdv',
            name: 'Secretaire.Animal.RDV',
            //            component: () => import('@/views/secretaire/animaux/RDVAnimal.vue'),
            // Liste de tous les RDV avec infos sur véto, actions réalisées,
            // médicaments données, etc.
          },
          {
            path: ':id/carnet-sante',
            name: 'Secretaire.Animal.CarnetSante',
            //            component: () => import('@/views/secretaire/animaux/CarnetSante.vue'),
            // Graphique poids/taille, Vaccins (date), Chirurgie, actions lourdes
            // Action : Transfert vers une autre clinique
          },
        ],
      },
      // ── Messagerie ────────────────────────────────────────────
      {
        path: 'messagerie',
        name: 'Secretaire.Messagerie',
        //        component: () => import('@/views/secretaire/messagerie/Messagerie.vue'),
        children: [
          {
            path: 'default-group',
            name: 'Secretaire.Messagerie.DefaultGroup',
            //            component: () => import('@/views/secretaire/messagerie/DefaultGroup.vue'),
            // Groupe par défaut avec tous le personnel de la clinique (sauf directeur)
          },
          {
            path: 'groupe',
            name: 'Secretaire.Messagerie.Groupe',
            //            component: () => import('@/views/secretaire/messagerie/Groupe.vue'),
            // Création de nouveaux groupes
          },
          {
            path: 'privees',
            name: 'Secretaire.Messagerie.Privees',
            //            component: () => import('@/views/secretaire/messagerie/Privees.vue'),
            // Envois de messages privées (à 1 seule personne)
          },
          {
            path: 'privees/:id',
            name: 'Secretaire.Messagerie.Conversation',
            //            component: () => import('@/views/secretaire/messagerie/Conversation.vue'),
          },
        ],
      },
      // ── Profil ───────────────────────────────────────────────
      {
        path: 'profil',
        name: 'Secretaire.Profil',
        //        component: () => import('@/views/secretaire/profil/Profil.vue'),
        children: [
          {
            path: 'parametres',
            name: 'Secretaire.Profil.Parametres',
            //            component: () => import('@/views/secretaire/profil/Parametres.vue'),
            // Informations personnelles, Modification des infos,
            // Suppression du compte, Déconnexion
          },
          {
            path: 'rgpd',
            name: 'Secretaire.Profil.RGPD',
            //            component: () => import('@/views/secretaire/profil/RGPD.vue'),
            // Utilisation des données perso, Suppressions des données perso
          },
        ],
      },
    ],
  },
]
