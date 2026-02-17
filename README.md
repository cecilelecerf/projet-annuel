# 🐾 Projet Annuel M2

Monorepo fullstack composé d'une application web (Vue), d'une API REST (Express + Prisma) et d'une application mobile.

---

## 📁 Structure du projet

```
projet-annuel/
├── api/          # API REST — Express + Prisma + PostgreSQL
├── web/          # Frontend — Vue.js
├── mobile/       # Application mobile
├── package.json  # Workspace racine
└── README.md
```

---

## 🚀 Prérequis

- [Node.js](https://nodejs.org/) **v22.12+** (requis par Prisma 7)
- [pnpm](https://pnpm.io/) **v8+**
- [PostgreSQL](https://www.postgresql.org/) en local ou via Docker

---

## ⚙️ Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd projet-annuel

# Installer toutes les dépendances
pnpm install
```

---

## 🔧 Configuration

Crée un fichier `.env` dans le dossier `api/` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

---

## 🗄️ Base de données

```bash
# Appliquer les migrations
cd api && npx prisma migrate dev

# Peupler la base avec les données de test
cd api && npx prisma db seed

# Voir la base dans Prisma Studio
pnpm db:view
```

---

## 💻 Lancer le projet

```bash
# Lancer l'API (http://localhost:3000)
pnpm dev:api

# Lancer le web (http://localhost:5173)
pnpm dev:web

# Lancer Prisma Studio (http://localhost:5555)
pnpm db:view
```

---

## 📜 Scripts disponibles

| Commande       | Description                                   |
| -------------- | --------------------------------------------- |
| `pnpm dev:api` | Lance l'API Express en mode développement     |
| `pnpm dev:web` | Lance l'application Vue en mode développement |
| `pnpm db:view` | Ouvre Prisma Studio                           |
| `pnpm dev`     | Lance l'API Express, l'app Vue, Prisma Studio |

---

## 🛠️ Stack technique

| Couche       | Technologie                         |
| ------------ | ----------------------------------- |
| **API**      | Node.js, Express 5, TypeScript, tsx |
| **ORM**      | Prisma 7 + PostgreSQL               |
| **Frontend** | Vue.js                              |
| **Monorepo** | pnpm workspaces                     |

---

## 📂 API — Structure

```
api/
├── src/
│   ├── index.ts          # Point d'entrée Express
├── prisma/
│   ├── schema/           # Schémas Prisma (multi-fichiers)
│   ├── migrations/       # Migrations générées
│   └── seed.ts           # Données de test
├── prisma.config.ts      # Configuration Prisma
├── .env                  # Variables d'environnement
└── package.json
```
