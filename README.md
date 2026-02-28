# 🐾 Projet Annuel M2

Monorepo fullstack composé d'une application web (Vue), d'une API REST (Express + Prisma) et d'une application mobile.

---

## 📁 Structure du projet

```
projet-annuel/
├── apps/
│   ├── api/          # API REST — Express + Prisma + PostgreSQL
│   ├── web/          # Frontend — Vue.js
│   └── mobile/       # Application mobile
├── packages/
│   └── schemas/      # Schemas Zod partagés
├── nginx/            # Configuration nginx
├── compose.yaml      # Docker Compose développement
├── compose.prod.yaml # Docker Compose production
├── package.json      # Workspace racine
└── README.md
```

---

## 🚀 Prérequis

- [Node.js](https://nodejs.org/) **v22.12+**
- [pnpm](https://pnpm.io/) **v8+**
- [Docker](https://www.docker.com/) & Docker Compose

---

## ⚙️ Installation

```bash
git clone <url-du-repo>
cd projet-annuel
pnpm install
```

---

## 🔧 Configuration

### Développement

Crée `apps/api/.env.dev` (copie depuis `apps/api/.env.dev.sample`) :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_ACCESS_SECRET="changeme"
JWT_REFRESH_SECRET="changeme"
```

### Production

Crée `.env.prod` à la racine (copie depuis `.env.prod.sample`) :

```env
DB_USER=user
DB_PASSWORD=password
DB_NAME=mydb
JWT_ACCESS_SECRET=changeme
JWT_REFRESH_SECRET=changeme
```

---

## 🗄️ Base de données

```bash
# Appliquer les migrations
pnpm --filter api run migrate

# Peupler la base avec les données de test
pnpm --filter api run seed

# Voir la base dans Prisma Studio
pnpm --filter api run studio
```

---

## 💻 Développement

```bash
# Lancer l'API (http://localhost:3000)
pnpm --filter api dev

# Lancer le web (http://localhost:5173)
pnpm --filter web dev
```

---

## 📜 Scripts disponibles

| Commande                        | Description                       |
| ------------------------------- | --------------------------------- |
| `pnpm --filter api dev`         | Lance l'API en mode développement |
| `pnpm --filter web dev`         | Lance le frontend Vue             |
| `pnpm --filter api run studio`  | Ouvre Prisma Studio               |
| `pnpm --filter api run migrate` | Applique les migrations           |
| `pnpm --filter api run seed`    | Peuple la base de données         |

---

## 🛠️ Stack technique

| Couche       | Technologie                    |
| ------------ | ------------------------------ |
| **API**      | Node.js, Express 5, TypeScript |
| **ORM**      | Prisma 7 + PostgreSQL          |
| **Frontend** | Vue.js + Element Plus          |
| **Monorepo** | pnpm workspaces                |

---

## 📂 API — Structure

```
apps/api/
├── src/
│   ├── index.ts              # Point d'entrée Express
│   ├── routes/               # Définition des routes
│   ├── controllers/          # Logique des endpoints
│   ├── services/             # Logique métier
│   └── lib/
│       └── prisma.ts         # Instance Prisma
├── prisma/
│   ├── schemas/              # Schémas Prisma (multi-fichiers)
│   ├── migrations/           # Migrations générées
│   └── seed.ts               # Données de test
├── prisma.config.ts          # Configuration Prisma
├── .env.dev                  # Variables d'environnement (dev)
└── package.json
```

---

## 📂 Web — Structure

```
apps/web/
├── src/
│   ├── main.ts               # Point d'entrée Vue
│   ├── router/               # Vue Router
│   ├── stores/               # Pinia stores
│   ├── views/                # Pages
│   ├── layouts/              # Layouts par rôle
│   └── components/           # Composants réutilisables
├── nginx.conf                # Config nginx (prod)
└── package.json
```

---

## 📂 Commandes Prisma

```bash
# Formater les schemas
pnpm --filter api exec prisma format

# Créer une nouvelle migration
pnpm --filter api exec prisma migrate dev --name <nom>

```

---

## 🐳 Production (Docker)

```bash
# Build
docker compose -f compose.prod.yaml build

# Démarrer (migrations automatiques au démarrage de l'API)
docker compose -f compose.prod.yaml up -d

# Vérifier les logs
docker compose -f compose.prod.yaml logs -f api

# Seed — une seule fois après le premier déploiement
docker compose -f compose.prod.yaml run --rm api node /app/apps/api/dist/prisma/seed.js
```
