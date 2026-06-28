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
        name: 'Client.Home',
        component: () => import('@/features/users/views/client/MySpaceView.vue'),
      },
      {
        path: 'profil',
        name: 'Client.Profil',
        component: () => import('@/views/client/Profil.vue'),
      },
      {
        path: 'veterinaires',
        name: 'Client.Reviews',
        component: () => import('@/views/client/Reviews.vue'),
      },

      // // ── Animal ───────────────────────────────────────────────
      // {
      //   path: 'animaux',
      //   name: 'Client.Animaux',
      //   //        component: () => import('@/views/client/animal/Animaux.vue'),
      // },
      // {
      //   path: 'animaux/nouveau',
      //   name: 'Client.Animal.Nouveau',
      //   //        component: () => import('@/views/client/animal/NouvelAnimal.vue'),
      //   // Champs : Nom, Photo, Description
      // },
      // {
      //   path: 'animaux/:id',
      //   name: 'Client.Animal.Vue',
      //   //        component: () => import('@/views/client/animal/VueAnimal.vue'),
      //   // Contient : Description, Graphique évolution poids/taille,
      //   //            Liste de tous les RDV, Nom du véto, Nouveau RDV,
      //   //            Supprimer l'animal, Modifier les infos,
      //   //            Voir les vaccins, Alerter si info anormales (prise de poids)
      // },
      // {
      //   path: 'animaux/:id/regime-alimentaire',
      //   name: 'Client.Animal.RegimeAlimentaire',
      //   //        component: () => import('@/views/client/animal/RegimeAlimentaire.vue'),
      //   // Contient : Enregistrer le régime alimentaire,
      //   //            Enregistrer la marque de nourriture avec algo pour proposer un dosage,
      //   //            Listes des produits pertinents en fonction des infos de santé
      // },

      // // ── RDV ──────────────────────────────────────────────────
      // {
      //   path: 'rdv',
      //   name: 'Client.RDV',
      //   //        component: () => import('@/views/client/rdv/RDV.vue'),
      // },
      // {
      //   path: 'rdv/prendre',
      //   name: 'Client.RDV.Prendre',
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
      //   name: 'Client.RDV.RechercheVeto',
      //   //        component: () => import('@/views/client/rdv/RechercheVeto.vue'),
      //   // Recherche par nom du vétérinaire, Choix de l'animal, Dispos du véto (choix de la date)
      // },

      // // ── Map ──────────────────────────────────────────────────
      // {
      //   path: 'map',
      //   name: 'Client.Map',
      //   //        component: () => import('@/views/client/map/Map.vue'),
      //   children: [
      //     {
      //       path: 'cliniques',
      //       name: 'Client.Map.Cliniques',
      //       //            component: () => import('@/views/client/map/MapCliniques.vue'),
      //       // Input avec adresse, Possibilité de filtrer sur les vétos d'urgence
      //     },
      //     {
      //       path: 'cliniques/:id',
      //       name: 'Client.Map.Clinique.Detail',
      //       //            component: () => import('@/views/client/map/DetailClinique.vue'),
      //       // Contient : Adresse, Horaire d'ouverture, Liste des vétos (avec spécialité),
      //       //            Image, Description, Note globale de tous les vétos (?),
      //       //            Stats (temps moyen avant un rdv?)
      //     },
      //     {
      //       path: 'vetos/:id',
      //       name: 'Client.Map.Veto.Detail',
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
      //   name: 'Client.Boutique',
      //   //        component: () => import('@/views/client/boutique/Boutique.vue'),
      //   children: [
      //     {
      //       path: '',
      //       name: 'Client.Boutique.Produits',
      //       //            component: () => import('@/views/client/boutique/TousLesProduits.vue'),
      //       // Vue de tous les produits, Filtre : marque, type animal, prix…
      //       // + Recherche d'un produit
      //     },
      //     {
      //       path: 'produits/:id',
      //       name: 'Client.Boutique.Produit.Detail',
      //       //            component: () => import('@/views/client/boutique/FicheProduit.vue'),
      //       // Contient : Image, Description, Notes et avis d'autres clients, Prix
      //       // Action : Ajout au panier
      //     },
      //   ],
      // },

      // // ── Panier ───────────────────────────────────────────────
      // {
      //   path: 'panier',
      //   name: 'Client.Panier',
      //   //        component: () => import('@/views/client/panier/Panier.vue'),
      //   children: [
      //     {
      //       path: '',
      //       name: 'Client.Panier.Recap',
      //       //            component: () => import('@/views/client/panier/RecapProduits.vue'),
      //     },
      //     {
      //       path: 'paiement',
      //       name: 'Client.Panier.Paiement',
      //       //            component: () => import('@/views/client/panier/Paiement.vue'),
      //     },
      //   ],
      // },

      // // ── Profil ───────────────────────────────────────────────
      // {
      //   path: 'profil',
      //   name: 'Client.Profil',
      //   //        component: () => import('@/views/client/profil/Profil.vue'),
      //   children: [
      //     {
      //       path: 'parametres',
      //       name: 'Client.Profil.Parametres',
      //       //            component: () => import('@/views/client/profil/Parametres.vue'),
      //       // Informations personnelles, Modification des infos,
      //       // Suppression du compte, Déconnexion
      //     },
      //     {
      //       path: 'historique',
      //       name: 'Client.Profil.Historique',
      //       //            component: () => import('@/views/client/profil/Historique.vue'),
      //       // Commandes et paiements
      //     },
      //     {
      //       path: 'rgpd',
      //       name: 'Client.Profil.RGPD',
      //       //            component: () => import('@/views/client/profil/RGPD.vue'),
      //       // Utilisation des données perso, Suppressions des données perso
      //     },
      //   ],
      // },
    ],
  },
]
