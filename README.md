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


Ce projet démontre la mise en place d'une infrastructure hautement disponible, résiliente et sécurisée pour une application web (Front, Back, BDD) en utilisant Docker Swarm.

### 1. Architecture du Cluster

L'infrastructure repose sur un cluster Swarm composé de **3 nœuds** (1 Manager, 2 Workers) :

*   **Manager (Leader) :** `vps-738d9dba` (Héberge la BDD, Nginx, Traefik et orchestre le cluster)
*   **Worker 1 :** `vps-b282b15c` (Exécute des réplicas Web et API)
*   **Worker 2 :** `docker-desktop` (Exécute des réplicas Web en local)

#### Services déployés :
*   **Traefik (Reverse Proxy) :** Exposition HTTPS (Let's Encrypt), redirection 80 -> 443.
*   **Nginx (Load Balancer Front) :** Répartit la charge vers le frontend (3 réplicas).
*   **Web (Frontend SPA) :** Interface utilisateur (3 réplicas).
*   **API (Backend Node.js) :** Logique métier (2 réplicas isolés des workers locaux).
*   **PostgreSQL (Base de données) :** Isolée sur le Manager, avec volume persistant.

---

### 2. Guide de Déploiement

### Étape 2.1 : Initialisation du Cluster
Sur la machine Manager (`vps-738d9dba`) :
```
docker swarm init
```
Sur les deux nœuds Workers, exécutez la commande `docker swarm join <TOKEN>` fournie par le Manager.

Vérification :
```
docker node ls
```

#### Étape 2.2 : Sécurisation (Gestion des Secrets)
Création des secrets requis par la stack :
```
echo "postgres" | docker secret create db_user -
echo "VOTRE_MOT_DE_PASSE" | docker secret create db_password -
echo "mydb" | docker secret create db_name -
echo "SECRET_JWT_ACCESS" | docker secret create jwt_access_secret -
echo "SECRET_JWT_REFRESH" | docker secret create jwt_refresh_secret -
```

#### Étape 2.3 : Déploiement de la Stack
Sur le Manager, dans le répertoire contenant le `compose.prod.yaml` :
```
DOCKER_HUB_USERNAME=cecilelecerf docker stack deploy -c compose.prod.yaml cecoule --with-registry-auth
```

Vérification du démarrage :
```
docker service ls
```

---

### 3. Résilience et Tolérance aux Pannes

Le cluster est configuré pour résister aux défaillances matérielles et logicielles.

#### Test de "Kill Pod" (Auto-healing)
Si un conteneur crash, l'orchestrateur en redémarre instantanément un nouveau pour maintenir le nombre de réplicas défini.

*Commande de test :*
```
docker kill <CONTAINER_ID>
docker service ps <SERVICE_NAME>
```

#### Test de Scalabilité (Scale Up/Down)
La montée ou baisse en charge s'effectue sans interruption de service.

*Commande de test :*
```
docker service scale <SERVICE_NAME>=6
docker service ls
```

---

### 4. Fonctionnalités Avancées (Bonus Implémentés)

Notre projet inclut la mise en place de plusieurs fonctionnalités avancées :

1.  **Gestion des Ressources (Requests & Limits) :** Chaque service possède des limites strictes (CPU/RAM) et des réservations définies via le bloc `resources` pour éviter la saturation d'un nœud.
2.  **Node Affinity & Contraintes :** La BDD et les services critiques sont restreints aux nœuds appropriés (ex: `placement: constraints: - node.role == manager` ou `node.hostname != docker-desktop`) pour optimiser les performances réseau.
3.  **Rolling Updates & Rollback Automatique :** Mise à jour progressive configurée (`update_config: parallelism: 1, delay: 5s`). En cas d'échec du healthcheck, le service revient automatiquement à la version précédente (`rollback_config`).
4.  **Sauvegarde (Backup) Automatisée :** Un script `backup.sh` permet de créer des archives compressées des volumes de la BDD et des certificats Traefik.

---

### 5. Sauvegarde et Restauration

Pour effectuer une sauvegarde manuelle de la base de données et des certificats HTTPS, exécutez le script dédié sur le Manager :

```
chmod +x backup.sh
./backup.sh
```
Les archives `.tar.gz` seront générées dans le dossier `/app/backups`.
