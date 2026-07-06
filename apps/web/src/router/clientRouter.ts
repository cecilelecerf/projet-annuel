import type { RouteRecordRaw } from 'vue-router'
import { requireRole } from './utils'

export const clientRouter: RouteRecordRaw[] = [
  {
    path: '/mon-espace',
    component: () => import('@/layouts/ClientLayout.vue'),
    beforeEnter: requireRole('CLIENT'),
    children: [
      {
        path: '',
        name: 'CLIENT.Home',
        component: () => import('@/features/users/views/client/MySpaceView.vue'),
      },
      {
        path: 'profil',
        name: 'CLIENT.Profil',
        component: () => import('@/features/profile/views/ProfileView.vue'),
      },
      {
        path: 'booking',
        name: 'CLIENT.Booking',
        component: () => import('@/features/meetings/views/BookingView.vue'),
      },
      {
        path: 'veterinaires',
        name: 'CLIENT.Reviews',
        component: () => import('@/features/users/views/client/Reviews.vue'),
      },

      // ── Animal ───────────────────────────────────────────────
      // {
      //   path: 'animaux',
      //   name: 'CLIENT.Animaux',
      //   component: () => import('@/features/animals/views/AnimalView/'),
      // },
      // {
      //   path: 'animaux/nouveau',
      //   name: 'CLIENT.Animal.Nouveau',
      //   //        component: () => import('@/views/client/animal/NouvelAnimal.vue'),
      //   // Champs : Nom, Photo, Description
      // },
      {
        path: 'animal/:id',
        name: 'CLIENT.Animals.Detail',
        component: () => import('@/features/animals/views/AnimalView/AnimalView.vue'),
      },
      // {
      //   path: 'animaux/:id/regime-alimentaire',
      //   name: 'CLIENT.Animal.RegimeAlimentaire',
      //   //        component: () => import('@/views/client/animal/RegimeAlimentaire.vue'),
      //   // Contient : Enregistrer le régime alimentaire,
      //   //            Enregistrer la marque de nourriture avec algo pour proposer un dosage,
      //   //            Listes des produits pertinents en fonction des infos de santé
      // },

      // // ── RDV ──────────────────────────────────────────────────
      {
        path: 'meetings',
        name: 'CLIENT.Meetings',
        component: () => import('@/features/meetings/views/ListAnimalMeetingView.vue'),
      },
      {
        path: 'meetings/:id',
        name: 'CLIENT.Meetings.Detail',
        component: () => import('@/features/meetings/views/MeetingView.vue'),
      },
      // {
      //   path: 'rdv/prendre',
      //   name: 'CLIENT.RDV.Prendre',
      //   //        component: () => import('@/views/client/rdv/PrendreRDV.vue'),
      //   // Formulaire étape par étape :
      //   //   1. Choix de l'animal (possibilité d'en créer un nouveau)
      //   //   2. Nom du véto
      //   //   3. Nouveau RDV
      //   //   4. Choix du cabinet
      //   //   5. Choix de la date (possibilité de voir les dispos d'un véto précis du cabinet)
      //   //   6. Choix du véto (si pas déjà sélectionné durant le choix de la date)
      // },
      // {
      //   path: 'rdv/recherche-veto',
      //   name: 'CLIENT.RDV.RechercheVeto',
      //   //        component: () => import('@/views/client/rdv/RechercheVeto.vue'),
      //   // Recherche par nom du vétérinaire, Choix de l'animal, Dispos du véto (choix de la date)
      // },

      // // ── Map ──────────────────────────────────────────────────
      // {
      //   path: 'map',
      //   name: 'CLIENT.Map',
      //   //        component: () => import('@/views/client/map/Map.vue'),
      //   children: [
      //     {
      //       path: 'cliniques',
      //       name: 'CLIENT.Map.Cliniques',
      //       //            component: () => import('@/views/client/map/MapCliniques.vue'),
      //       // Input avec adresse, Possibilité de filtrer sur les vétos d'urgence
      //     },
      //     {
      //       path: 'cliniques/:id',
      //       name: 'CLIENT.Map.Clinique.Detail',
      //       //            component: () => import('@/views/client/map/DetailClinique.vue'),
      //       // Contient : Adresse, Horaire d'ouverture, Liste des vétos (avec spécialité),
      //       //            Image, Description, Note globale de tous les vétos (?),
      //       //            Stats (temps moyen avant un rdv?)
      //     },
      //     {
      //       path: 'vetos/:id',
      //       name: 'CLIENT.Map.Veto.Detail',
      //       //            component: () => import('@/views/client/map/DetailVeto.vue'),
      //       // Contient : Clinique.s associée.s, Image, Description,
      //       //            Notes et avis du véto, Spécialité.s,
      //       //            Stats (temps moyen avant un rdv?)
      //       // Action : Laisser un avis sur le véto
      //     },
      //   ],
      // },

      // // ── Boutique ─────────────────────────────────────────────
      // {
      //   path: 'boutique',
      //   name: 'CLIENT.Boutique',
      //   //        component: () => import('@/views/client/boutique/Boutique.vue'),
      //   children: [
      //     {
      //       path: '',
      //       name: 'CLIENT.Boutique.Produits',
      //       //            component: () => import('@/views/client/boutique/TousLesProduits.vue'),
      //       // Vue de tous les produits, Filtre : marque, type animal, prix…
      //       // + Recherche d'un produit
      //     },
      //     {
      //       path: 'produits/:id',
      //       name: 'CLIENT.Boutique.Produit.Detail',
      //       //            component: () => import('@/views/client/boutique/FicheProduit.vue'),
      //       // Contient : Image, Description, Notes et avis d'autres clients, Prix
      //       // Action : Ajout au panier
      //     },
      //   ],
      // },

      // // ── Panier ───────────────────────────────────────────────
      // {
      //   path: 'panier',
      //   name: 'CLIENT.Panier',
      //   //        component: () => import('@/views/client/panier/Panier.vue'),
      //   children: [
      //     {
      //       path: '',
      //       name: 'CLIENT.Panier.Recap',
      //       //            component: () => import('@/views/client/panier/RecapProduits.vue'),
      //     },
      //     {
      //       path: 'paiement',
      //       name: 'CLIENT.Panier.Paiement',
      //       //            component: () => import('@/views/client/panier/Paiement.vue'),
      //     },
      //   ],
      // },

      // // ── Profil ───────────────────────────────────────────────

      //   children: [
      //     {
      //       path: 'parametres',
      //       name: 'CLIENT.Profil.Parametres',
      //       //            component: () => import('@/views/client/profil/Parametres.vue'),
      //       // Informations personnelles, Modification des infos,
      //       // Suppression du compte, Déconnexion
      //     },
      //     {
      //       path: 'historique',
      //       name: 'CLIENT.Profil.Historique',
      //       //            component: () => import('@/views/client/profil/Historique.vue'),
      //       // Commandes et paiements
      //     },
      //     {
      //       path: 'rgpd',
      //       name: 'CLIENT.Profil.RGPD',
      //       //            component: () => import('@/views/client/profil/RGPD.vue'),
      //       // Utilisation des données perso, Suppressions des données perso
      //     },
      //   ],
      // },
    ],
  },
]
