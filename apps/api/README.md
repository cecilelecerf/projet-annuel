# 📂 API

API REST du projet, construite avec **Express 5**, **TypeScript** et **Prisma 7** (PostgreSQL). Organisation par feature, architecture en couches (route → controller → service → repository).

📎 Voir aussi : [README racine](../../README.md) · [`apps/web/README.md`](../web/README.md) · [`packages/schemas/README.md`](../../packages/schemas/README.md)

---

## 📁 Structure

```
apps/api/
├── src/
│   ├── index.ts                  # Point d'entrée Express
│   ├── app.ts                    # Définition des routes et du middleware global
│   ├── instances.ts              # Instanciation des controllers, services et repositories
│   ├── features/                 # Organisation par feature (feature-based)
│   │   └── <feature>/
│   │       ├── <feature>.router.ts       # Définition des routes
│   │       ├── <feature>.controller.ts  # Logique des endpoints (parsing req/res)
│   │       ├── <feature>.service.ts     # Logique métier
│   │       ├── <feature>.repository.ts  # Accès aux données (Prisma)
│   │       └── __tests__/
│   │           ├── <feature>.router.test.ts   # Tests des routes du router de la feature
│   │           └── <feature>.service.test.ts  # Tests des services de la feature
│   └── lib/
│       └── prisma.ts             # Instance Prisma
│       └── mailer.ts             # Instance Prisma
├── prisma/
│   ├── schemas/                  # Schémas Prisma (multi-fichiers)
│   ├── seeds/                  # Données de test
│   └── migrations/                # Migrations générées
├── prisma.config.ts               # Configuration Prisma
├── .env.dev                       # Variables d'environnement (dev)
└── package.json
```

---

## 🏗️ Architecture

Chaque feature suit un découpage en 4 couches, dans l'ordre d'appel :

| Couche         | Rôle                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| **Route**      | Déclare les endpoints HTTP et branche le middleware (auth, validation, etc.)     |
| **Controller** | Extrait/valide les données de la requête, appelle le service, formate la réponse |
| **Service**    | Contient la logique métier (règles d'accès, transformations, orchestration)      |
| **Repository** | Seul point d'accès à la base de données via Prisma                               |

Les controllers/services/repositories sont instanciés une seule fois dans `src/instances.ts` puis injectés dans les routes (`app.ts`), ce qui facilite le mock en test.

> 💡 Règle à respecter : un service ne doit jamais appeler Prisma directement, il passe toujours par son repository. Ça garde les services testables indépendamment de la base.

### 📐 Convention repository : un repo = un domaine

Un repository est le seul point d'accès à **une entité/agrégat**. Règles à respecter :

- ✅ **Autorisé** : retourner l'entité elle-même (`findById`, `findMany`, `findFirst`), un `count`/`aggregate` sur cette entité, ou l'entité enrichie de ses **relations Prisma propres** (ex. `ClinicRepository.findById` qui `include` ses `veterinarians` ou son `director`, car ces relations sont définies dans le schéma `Clinic`).
- ❌ **Interdit** : requêter/joindre une table qui n'a pas de lien direct avec l'entité du repo juste par commodité (ex. `ClinicRepository` qui va chercher des `Meeting` d'un autre domaine sans relation Prisma vers `Clinic`). Si deux domaines doivent être combinés, c'est le **service** qui appelle les deux repositories concernés et compose le résultat.
- ❌ **Interdit** : mettre de la logique métier dans le repo (vérification de rôle, formatage de réponse, calcul dérivé) — le repo ne fait que traduire une intention en requête Prisma et retourner de la donnée brute/typée Prisma.
- 💡 Si un repo a besoin de plusieurs "vues" du même modèle (légère vs détaillée), préfère plusieurs méthodes explicites (`findByIdBasic`, `findByIdWithDetails`) plutôt qu'une seule méthode qui `include` systématiquement tout — ça évite le sur-fetch et rend l'usage explicite côté service.

Un `count` est donc parfaitement légitime dans `ClinicRepository` (ex. `countByCity`), tant que la donnée comptée reste des `Clinic`.

---

## 🔐 Authentification & autorisation

- Authentification par **JWT** (access token + refresh token), voir `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` dans `.env`.
- Autorisation basée sur les **rôles utilisateur** (`UserRole`), vérifiée au niveau service (ex. `isStaff(role)`) plutôt qu'au niveau route, pour permettre des règles fines (ex. un `CLIENT` ne peut accéder qu'à ses propres ressources).
- Erreurs métier typées (ex. `NotFoundError`, `ForbiddenError`) levées dans les services et catchées globalement pour produire les codes HTTP correspondants.

<!-- À compléter si besoin : middleware d'auth, endpoint de refresh, expiration des tokens -->

---

## 📦 Fichiers / stockage

Les fichiers (avatars, photos d'animaux, etc.) sont stockés sur un bucket **S3-compatible (MinIO)** en dev. Les entités exposent une URL signée/calculée (ex. `avatarUrl`) plutôt que l'ID brut du fichier, généralement via un helper (`withAvatarUrl`, `withUserAvatar`).

---

## ✅ Validation

La validation des entrées (et parfois des réponses) passe par **Zod**, via les schémas partagés dans [`packages/schemas`](../../packages/schemas/README.md). Toute modification de la forme d'une réponse API doit être répercutée à la fois côté service (construction de l'objet) et côté schéma Zod, sous peine d'erreur `invalid_type` en validation de sortie.

---

## 🧭 Convention : comment écrire une route

### Nommage REST des URLs

- **Parent avant enfant, toujours au pluriel** : une sous-ressource se déclare sous son parent, pas l'inverse.
  ```
  GET /clinics/:clinicId/veterinarians   ✅
  GET /referant/:clinicId/clinic          ❌ (ordre inversé : l'enfant passe avant le parent)
  ```
- **Ne pas dupliquer une route par sous-type** quand ce n'est qu'un filtre sur la même ressource. Si "référent" et "directeur" sont des rôles d'un même modèle `Veterinarian` (même forme de donnée, même repository), on filtre plutôt que de créer deux endpoints/controllers/services distincts :
  ```
  GET /clinics/:clinicId/veterinarians?role=director   ✅
  GET /clinics/:clinicId/directors                      ❌
  GET /clinics/:clinicId/referents                       ❌
  ```
  Dupliquer la route revient à dupliquer controller + service + repository pour une différence qui n'est qu'un paramètre — ça complique la maintenance sans bénéfice.
- **Exception légitime** : si le sous-type a un vrai cycle de vie métier distinct (champs propres, permissions différentes, CRUD spécifique) et pas juste un flag de filtrage, une sous-ressource dédiée est justifiée. Ex. une clinique a _un seul_ directeur avec des droits particuliers → `GET /clinics/:clinicId/director` (singulier, cardinalité 1) peut avoir son propre controller/service si sa logique diffère vraiment de celle des vétérinaires.
- **Pluriel pour les collections, singulier pour une ressource unique rattachée à un parent** (`/clinics/:clinicId/director` si une seule instance possible).
- **Pas de verbe dans l'URL** — le verbe HTTP porte déjà l'action (`GET`, `POST`, `PATCH`, `DELETE`). `POST /clinics/:clinicId/veterinarians` plutôt que `POST /clinics/:clinicId/addVeterinarian`.

Chaque endpoint traverse les 4 couches dans le même ordre. Voici le squelette à suivre pour ajouter une route à une feature existante (ou en créer une).

### 1. Route (`<feature>.route.ts`)

- Une route ne fait **que** déclarer le verbe HTTP, le chemin, et brancher les middlewares (auth, validation) avant le controller.
- Pas de logique ici — juste du câblage.

```typescript
router.get(
  "/:id",
  requireAuth, // middleware d'authentification
  animalController.getById, // controller
);
```

### 2. Controller (`<feature>.controller.ts`)

- Rôle : extraire/valider les données de la requête (`params`, `query`, `body`), appeler le service, renvoyer la réponse.
- **Aucune logique métier** ici — le controller ne fait que traduire HTTP ↔ service.
- Le typage/la validation de `req.body` ou `req.params` passe par les schémas Zod partagés.

```typescript
async getById(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { userId, role } = req.user; // injecté par le middleware d'auth

  const animal = await animalService.getById({ id, userId, role });

  res.status(200).json(animal);
}
```

### 3. Service (`<feature>.service.ts`)

- Rôle : logique métier — règles d'autorisation, orchestration entre plusieurs repositories, transformation de données avant réponse.
- Lève des erreurs typées (`NotFoundError`, `ForbiddenError`, etc.) plutôt que de retourner `null`/`undefined` en cas d'échec — c'est le handler d'erreur global qui traduit ça en code HTTP.
- N'appelle jamais Prisma directement : passe uniquement par son/ses repository(ies).

```typescript
async getById({ id, userId, role }: GetByIdParams) {
  const animal = await this.repository.findById(id);
  if (!animal) throw new NotFoundError("Animal");
  if (!isStaff(role) && animal.clientId !== userId) throw new ForbiddenError();

  return { ...animal, client: withUserAvatar(animal.client) };
}
```

### 4. Repository (`<feature>.repository.ts`)

- Rôle : traduire une intention en requête Prisma et retourner la donnée de son domaine (voir [convention repository](#-convention-repository--un-repo--un-domaine) ci-dessus).

```typescript
async findById(id: string) {
  return prisma.animal.findUnique({
    where: { id },
    include: { race: { include: { pet: true } }, client: { include: { user: true } } },
  });
}
```

### Check-list avant d'ouvrir une PR sur une nouvelle route

- [ ] Le controller ne contient aucune règle métier (permissions, calculs) — tout est dans le service.
- [ ] Le repository ne retourne que des données de son propre domaine (voir convention ci-dessus).
- [ ] Les entrées (`params`/`query`/`body`) sont validées par un schéma Zod partagé.
- [ ] La forme de la réponse correspond au schéma Zod de sortie attendu (sinon → erreur `invalid_type` en validation).
- [ ] Les erreurs métier (accès refusé, ressource introuvable) sont levées via des erreurs typées, pas des codes en dur dans le controller.
- [ ] Un test de route (`*.router.test.ts`) couvre au minimum : le cas nominal, un cas 403/404, et un cas par rôle si la permission dépend du rôle.

---

## 📜 Scripts

| Commande                        | Description                               |
| ------------------------------- | ----------------------------------------- |
| `pnpm --filter api run dev`     | Démarre l'API en mode watch (hors Docker) |
| `pnpm --filter api run build`   | Build l'API pour la production            |
| `pnpm --filter api run test`    | Lance les tests (vitest)                  |
| `pnpm --filter api run lint`    | Lint du code                              |
| `pnpm --filter api run migrate` | Génère et applique les migrations Prisma  |
| `pnpm --filter api run seed`    | Peuple la base avec les données de test   |
| `pnpm --filter api run studio`  | Ouvre Prisma Studio                       |

> Depuis la racine, privilégie les alias `pnpm dev:api`, `pnpm db:init`, `pnpm db:seed`, `pnpm db:view` (voir [README racine](../../README.md)).

---

## 🔧 Commandes Prisma

```bash
# Formater les schémas
pnpm --filter api exec prisma format

# Créer une nouvelle migration
pnpm --filter api exec prisma migrate dev --name <nom>
```

```bash
# Générer le client Prisma + appliquer les migrations
pnpm --filter api run migrate

# Peupler la base avec les données de test
pnpm --filter api run seed

# Voir la base dans Prisma Studio
pnpm --filter api run studio
```

---

## 🧪 Tests (Vitest)

Deux types de tests par feature, dans `__tests__/` :

### Tests de route (`*.router.test.ts`)

- Testent le comportement HTTP réel de bout en bout (route → controller → service → repository → DB).
- **Ne mockent jamais la donnée** : au lancement, les migrations sont générées et les fixtures sont appliquées sur une vraie base de test.
- Objectif : vérifier les codes de statut, les permissions par rôle, la forme exacte de la réponse (validée par les schémas Zod), et les effets de bord réels en base.

### Tests de service (`*.service.test.ts`)

- Testent la logique métier en isolation.
- **Peuvent mocker le repository** (et donc la donnée), pour tester des cas limites sans dépendre d'un état de base précis (erreurs, règles d'autorisation, edge cases).

### Bonnes pratiques

- Un test de route = un scénario métier nommé explicitement (ex. `"200 — CLIENT accède à son propre animal"`, `"403 — CLIENT accède à l'animal d'un autre client"`), pour que le rapport de test serve de documentation fonctionnelle.
- Ne pas dupliquer en test de service ce qui est déjà couvert en test de route : le test de service sert surtout à couvrir les branches difficiles à atteindre via HTTP (erreurs internes, cas limites).
- Réinitialiser/isoler l'état entre les tests de route (fixtures rejouées) pour éviter les tests dépendants les uns des autres.
- Viser la couverture minimale de **75 %** exigée par la CI pour merger sur `main` (voir [README racine](../../README.md#-sécurité--cicd)).

---

## 🌱 Variables d'environnement

| Variable             | Description                            |
| -------------------- | -------------------------------------- |
| `DATABASE_URL`       | URL de connexion PostgreSQL            |
| `JWT_ACCESS_SECRET`  | Secret de signature des access tokens  |
| `JWT_REFRESH_SECRET` | Secret de signature des refresh tokens |

<!-- Compléter avec les variables MinIO/S3, SMTP (Mailhog), et toute autre variable spécifique à l'API -->

<!-- Ajouter dans le readme la partie websocket avec io  -->
