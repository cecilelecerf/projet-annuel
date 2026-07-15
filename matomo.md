# Tracking Matomo

Listing de tout ce qui est actuellement remonté à Matomo depuis le frontend web (`apps/web`).

Le tracker est initialisé dans [apps/web/src/lib/matomo.ts](apps/web/src/lib/matomo.ts) via `initMatomo()` (appelé dans `main.ts`), à partir des variables d'env `VITE_MATOMO_URL` et `VITE_MATOMO_SITE_ID`. Si ces variables ne sont pas définies, le tracker est un no-op silencieux (rien n'est envoyé).

## Pages vues

Chaque changement de route Vue Router déclenche une vue de page Matomo, via `router.afterEach` dans [apps/web/src/router/index.ts](apps/web/src/router/index.ts).

- URL trackée : `to.fullPath` (chemin complet, avec params/query)
- Titre : nom de la route Vue Router (`to.name`)

Aucune route n'est exclue — toutes les navigations SPA (y compris les routes privées par rôle) génèrent une vue de page.

## Événements custom (`trackEvent`)

Format Matomo : **Catégorie / Action / Nom (optionnel)**. Déclenchés via `trackEvent(category, action, name?, value?)` ([apps/web/src/lib/matomo.ts](apps/web/src/lib/matomo.ts)).

### Authentification

| Catégorie | Action | Nom | Déclenché quand | Fichier |
|---|---|---|---|---|
| `auth` | `login_success` | — (ou `2fa` si vérification à 2 facteurs) | Connexion réussie | [LoginView.vue](apps/web/src/features/auth/views/LoginView.vue) |
| `auth` | `login_failure` | — (ou `2fa`) | Échec de connexion / code 2FA invalide | [LoginView.vue](apps/web/src/features/auth/views/LoginView.vue) |
| `auth` | `register_success` | `CLIENT` ou `DIRECTOR` | Inscription réussie (compte client ou directeur+clinique) | [RegisterView.vue](apps/web/src/features/auth/views/RegisterView.vue) |
| `auth` | `register_failure` | `CLIENT` ou `DIRECTOR` | Échec de l'inscription | [RegisterView.vue](apps/web/src/features/auth/views/RegisterView.vue) |
| `auth` | `logout` | — | Déconnexion (toujours trackée, même si l'appel API de logout échoue côté serveur) | [authStore.ts](apps/web/src/stores/authStore.ts) |

### Rendez-vous (meetings)

| Catégorie | Action | Nom | Déclenché quand | Fichier |
|---|---|---|---|---|
| `meeting` | `create_success` | `INTERNAL` ou `ANIMAL` | Création d'un RDV réussie via le formulaire staff (drawer) | [useMeetingDrawerForm.ts](apps/web/src/features/meetings/composables/useMeetingDrawerForm.ts) |
| `meeting` | `create_failure` | `INTERNAL` ou `ANIMAL` | Échec de création via le drawer | [useMeetingDrawerForm.ts](apps/web/src/features/meetings/composables/useMeetingDrawerForm.ts) |
| `meeting` | `booking_confirmed` | — | Prise de RDV confirmée côté parcours client (booking) | [BookingStepConfirm.vue](apps/web/src/features/meetings/components/bookings/BookingStepConfirm.vue) |
| `meeting` | `booking_failure` | — | Échec de la confirmation de RDV côté client | [BookingStepConfirm.vue](apps/web/src/features/meetings/components/bookings/BookingStepConfirm.vue) |
| `meeting` | `reschedule_success` | `single` ou `all` (portée de la récurrence) | Reprogrammation d'un RDV réussie | [useMeetingActions.ts](apps/web/src/features/meetings/composables/useMeetingActions.ts) |
| `meeting` | `reschedule_failure` | `single` ou `all` | Échec de reprogrammation | [useMeetingActions.ts](apps/web/src/features/meetings/composables/useMeetingActions.ts) |
| `meeting` | `cancel_success` | `INTERNAL` ou `ANIMAL` | Annulation/suppression d'un RDV réussie | [useMeetingActions.ts](apps/web/src/features/meetings/composables/useMeetingActions.ts) |
| `meeting` | `cancel_failure` | `INTERNAL` ou `ANIMAL` | Échec de l'annulation | [useMeetingActions.ts](apps/web/src/features/meetings/composables/useMeetingActions.ts) |

### Animaux

| Catégorie | Action | Nom | Déclenché quand | Fichier |
|---|---|---|---|---|
| `animal` | `create_success` | — | Ajout d'un animal réussi | [AnimalCreateView.vue](apps/web/src/features/animals/views/AnimalCreateView.vue) |
| `animal` | `create_failure` | — | Échec de l'ajout d'un animal | [AnimalCreateView.vue](apps/web/src/features/animals/views/AnimalCreateView.vue) |


## Où voir les données

- **Local (dev)** : `http://localhost:8090`
- **Prod** : `https://matomo.armali.online`
- Menu **Visiteurs → Visites en temps réel** pour les pages vues, **Comportement → Événements** pour les événements custom ci-dessus.
