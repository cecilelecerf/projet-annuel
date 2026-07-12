# 🐾 Projet Annuel M2

Monorepo fullstack composé d'une application web (Vue), d'une API REST (Express + Prisma) et d'une application mobile.

---

## 📁 Structure du projet

```
projet-annuel/
├── apps/
│   ├── api/            # API REST — Express + Prisma + PostgreSQL
│   │   └── README.md
│   ├── web/             # Frontend — Vue.js
│   │   └── README.md
│   └── mobile/          # Application mobile
├── packages/
│   └── schemas/         # Schemas Zod partagés
│       └── README.md
├── nginx/                # Configuration nginx
├── compose.dev.yaml           # Docker Compose — développement
├── compose.prod.yaml      # Docker Compose — production
├── package.json           # Workspace racine
├── README.md               # Ce fichier
└── PRODUCTION.md
```

📎 Voir aussi : [`apps/api/README.md`](./apps/api/README.md) · [`apps/web/README.md`](./apps/web/README.md) · [`packages/schemas/README.md`](./packages/schemas/README.md) · [`PRODUCTION.md`](./PRODUCTION.md)

---

## 🚀 Prérequis

- [Node.js](https://nodejs.org/) **v22.12+**
- [pnpm](https://pnpm.io/) (géré via `corepack`, voir `packageManager` dans `package.json`)
- [Docker](https://www.docker.com/) & Docker Compose

---

## ⚙️ Installation

```bash
git clone <url-du-repo>
cd projet-annuel
pnpm install
```

`pnpm install` reste nécessaire sur l'host même si le développement se fait via Docker : c'est ce qui génère/mets à jour le `pnpm-lock.yaml` (voir section [Ajouter une dépendance](#-ajouter-une-dépendance)).

---

## 🔧 Configuration

### Développement

Crée `.env.dev` à la **racine du projet** (copie depuis `.env.dev.sample`) :

```env
# Base de données
DB_USER=user
DB_PASSWORD=password
DB_NAME=mydb

# JWT
JWT_ACCESS_SECRET=changeme_access_secret
JWT_REFRESH_SECRET=changeme_refresh_secret

# API
CORS_ORIGIN=http://localhost:5173

#STRIPE
STRIPE_SECRET_KEY=change-me
STRIPE_WEBHOOK_SECRET=change-me

# Email (ENABLE_EMAIL=false pour log console sans envoyer)
ENABLE_EMAIL=true
MAIL_USER=...
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_PASS=...

# Web / Vite (préfixe VITE_ obligatoire pour être exposé au navigateur)
VITE_API_URL=http://localhost:3001/api

# MINIO + S3
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
S3_BUCKET=armali-files
S3_ENDPOINT=http://minio:9000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
ASSETS_BASE_URL=http://localhost:9000/armali-files
S3_PUBLIC_ENDPOINT=http://localhost:9000
```

---

## 🐳 Développement (Docker)

Le développement se fait via Docker Compose — chaque service (`api`, `web`) tourne dans son propre conteneur avec hot-reload (bind mount du code source), et un service `devcontainer` sert d'environnement d'édition pour VSCode (voir [Devcontainer](#-devcontainer-édition)).

### Lancer la stack

```bash
pnpm docker:dev:up
```

Démarre en arrière-plan :

| Service      | URL                   |
| ------------ | --------------------- |
| API          | http://localhost:3001 |
| Web          | http://localhost:5173 |
| Mailhog (UI) | http://localhost:8025 |
| Minio (UI)   | http://localhost:9001 |
| Postgres     | —                     |
| Devcontainer | —                     |

### Autres commandes utiles

| Commande                | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `pnpm docker:dev:build` | Build les images sans démarrer les conteneurs             |
| `pnpm docker:dev:up`    | Démarre la stack en arrière-plan (avec rebuild)           |
| `pnpm docker:dev:down`  | Arrête et supprime les conteneurs                         |
| `pnpm docker:dev:reset` | Arrête tout, supprime les volumes `node_modules`, relance |
| `pnpm docker:dev:ps`    | Statut des conteneurs                                     |
| `pnpm log:api`          | Logs du service `api` en continu                          |
| `pnpm log:web`          | Logs du service `web` en continu                          |

> ⚠️ Utilise `pnpm docker:dev:reset` après tout changement de dépendances (ajout/suppression de package). Les `node_modules` vivent dans des volumes Docker nommés, isolés du code source, et ne se resynchronisent jamais automatiquement avec l'image.

### Hot-reload

- **Code source** (`.ts`, `.vue`, etc.) : pris en compte immédiatement, aucune action requise (bind mount + `tsx watch` côté API, HMR Vite côté web).
- **Dépendances** (`package.json` modifié) : nécessite `pnpm docker:dev:reset` (voir ci-dessus).

---

## 🧩 Devcontainer (édition)

Le service `devcontainer` n'exécute aucun code applicatif (`command: sleep infinity`) — il sert uniquement d'environnement d'édition cohérent avec le runtime Docker (même OS/arch Linux, même `node_modules`, même accès réseau à `postgres`/`mailhog`).

**Usage avec VSCode :**

1. Lance `pnpm docker:dev:up`
2. `Cmd/Ctrl+Shift+P` → _"Dev Containers: Attach to Running Container"_
3. Sélectionne `armali-dev-devcontainer-1`

Utile aussi pour lancer des commandes ponctuelles dans le même environnement que l'API (ex : `pnpm --filter api exec prisma studio` dans le contexte réseau Docker).

---

## 📦 Ajouter une dépendance

```bash
# Dépendance de prod
pnpm add:api <package>       # apps/api
pnpm add:web <package>       # apps/web
pnpm add:schemas <package>   # packages/schemas

# Dépendance de dev
pnpm add:api:dev <package>
pnpm add:web:dev <package>
pnpm add:schemas:dev <package>
```

Puis synchronise le conteneur concerné avant de continuer à dev :

```bash
pnpm sync:api   # ou sync:web
```

> ⚠️ `@armali/schemas` doit rester en `dependencies` (pas `devDependencies`) dans `api`/`web` : il est importé à l'exécution, et le build de prod fait `pnpm install --prod` qui exclut les `devDependencies`.

---

## 🖥️ Lancer un service hors Docker

Si tu préfères lancer un service directement sur l'host (nécessite `pnpm install` fait localement, et une base Postgres accessible) :

```bash
pnpm dev:api      # API en mode watch
pnpm dev:web      # Frontend Vue
pnpm dev:schemas  # Watch build du package schemas
```

Le flux recommandé reste Docker (`pnpm docker:dev:up`) pour garantir la cohérence de l'environnement entre les développeurs.

---

## 📜 Scripts disponibles (racine)

| Commande                              | Description                                        |
| ------------------------------------- | -------------------------------------------------- |
| `docker:dev:build`                    | Build les images Docker                            |
| `docker:dev:up`                       | Démarre la stack Docker (détaché, avec build)      |
| `docker:dev:down`                     | Arrête la stack Docker                             |
| `docker:dev:reset`                    | Reset complet (volumes `node_modules` + rebuild)   |
| `docker:dev:ps`                       | Statut des conteneurs                              |
| `docker:dev:logs`                     | Logs génériques (`pnpm docker:dev:logs <service>`) |
| `log:api` / `log:web`                 | Logs ciblés `api` / `web`                          |
| `dev:api` / `dev:web` / `dev:schemas` | Lancement direct hors Docker                       |
| `add:*` / `add:*:dev`                 | Ajout de dépendance par workspace                  |
| `sync:api` / `sync:web`               | Réinstalle dans le conteneur après un `add:*`      |
| `db:init` / `db:seed` / `db:view`     | Commandes base de données                          |
| `build`                               | Build tous les workspaces (ordre topologique)      |

---

## 🛠️ Stack technique

| Couche   | Technologie                               |
| -------- | ----------------------------------------- |
| API      | Node.js, Express 5, TypeScript            |
| ORM      | Prisma 7 + PostgreSQL                     |
| Frontend | Vue.js + Element Plus                     |
| Monorepo | pnpm workspaces                           |
| Dev      | Docker Compose (hot-reload, devcontainer) |

---

## 🔒 Sécurité & CI/CD

### Pipeline CI/CD

- Branches protégées.
- Un merge sur `main` = une mise en production.
- 82 % du code de l'API doit être testé pour pouvoir merger sur `main`.

**Pour merger sur `dev` :**

- Tous les tests doivent passer.
- Les linters `api` et `web` doivent passer.
- Pas de dépendances trop récentes (non stabilisées).
- Tous les packages doivent build.

---

## 📌 Notes

- Node **24** à valider/documenter (cible future ?).
