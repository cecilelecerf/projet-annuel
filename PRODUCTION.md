# 🐳 Production (Docker)

Ce projet démontre la mise en place d'une infrastructure hautement disponible, résiliente et sécurisée pour une application web (Front, Back, BDD) en utilisant Docker Swarm.

## 1. Architecture du Cluster

L'infrastructure repose sur un cluster Swarm composé de **3 nœuds** (1 Manager, 2 Workers) :

- **Manager (Leader) :** `vps-738d9dba` (Héberge la BDD, Nginx, Traefik et orchestre le cluster)
- **Worker 1 :** `vps-b282b15c` (Exécute des réplicas Web et API)
- **Worker 2 :** `docker-desktop` (Exécute des réplicas Web en local)

### Services déployés :

- **Traefik (Reverse Proxy) :** Exposition HTTPS (Let's Encrypt), redirection 80 -> 443.
- **Nginx (Load Balancer Front) :** Répartit la charge vers le frontend (3 réplicas).
- **Web (Frontend SPA) :** Interface utilisateur (3 réplicas).
- **API (Backend Node.js) :** Logique métier (2 réplicas isolés des workers locaux).
- **PostgreSQL (Base de données) :** Isolée sur le Manager, avec volume persistant. (1 réplicas).
- **Prometheus :** Collecte des métriques (1 réplicas).
- **Grafana :** Visualisation des métriques (1 réplicas).
- **Minio :** Stockage des images (1 réplicas).
- **Minio Init :** Inititalisation de minio.
- **Api - Seed :** Pas up, utile seulement pour le workflow de seeds.
- **Api - Migration :** Pas up, utile seulement pour le workflow de migration.

---

## 2. Guide de Déploiement

## Étape 2.1 : Initialisation du Cluster

Sur la machine Manager (`vps-738d9dba`) :

```
docker swarm init
```

Sur les deux nœuds Workers, exécutez la commande `docker swarm join <TOKEN>` fournie par le Manager.

Vérification :

```
docker node ls
```

### Étape 2.2 : Sécurisation (Gestion des Secrets)

Création des secrets requis par la stack :

```
echo "postgres" | docker secret create db_user -
echo "VOTRE_MOT_DE_PASSE" | docker secret create db_password -
echo "mydb" | docker secret create db_name -
echo "SECRET_JWT_ACCESS" | docker secret create jwt_access_secret -
echo "SECRET_JWT_REFRESH" | docker secret create jwt_refresh_secret -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create grafana_admin_password -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create stripe_webhook_secret_v2 -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create stripe_secret_key -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create s3_endpoint -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create s3_bucket -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create resend_api_key -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create minio_root_user -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create minio_root_password -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create aws_access_key_id_v2 -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create aws_region -
echo "VOTRE_MOT_DE_PASSE_GRAFANA" | docker secret create aws_secret_access_key_v2 -
```

## Étape 2.3 : Docker Configs (Configurations Swarm)

En Docker Swarm, les fichiers de configuration ne peuvent pas être montés via des chemins relatifs car les containers peuvent tourner sur n'importe quel nœud. Les **Docker configs** permettent de stocker ces fichiers directement dans le cluster et de les injecter automatiquement au démarrage.

Création des configs requises sur le Manager :

```bash
# Prometheus
docker config create prometheus_config_v2 /app/monitoring/prometheus.yml

# Grafana
docker config create grafana_datasources /app/monitoring/grafana/provisioning/datasources/prometheus.yml
docker config create grafana_dashboards_provider /app/monitoring/grafana/provisioning/dashboards/dashboards.yml
docker config create grafana_dashboard_express /app/monitoring/grafana/dashboards/express-backend-overview.json

# Minio
docker config create minio_init_script_v2 /app/packages/minio/minio-init.sh

```

> ⚠️ Les Docker configs sont **immuables**. Pour mettre à jour une config, il faut créer une nouvelle version avec un nom différent (ex: `prometheus_config_v2`) et mettre à jour le `compose.prod.yaml` en conséquence.

### Étape 2.4 : Déploiement de la Stack

Sur le Manager, dans le répertoire contenant le `compose.prod.yaml` :

```
DOCKER_HUB_USERNAME=cecilelecerf docker stack deploy -c compose.prod.yaml cecoule --with-registry-auth
```

Vérification du démarrage :

```
docker service ls
```

---

## 3. Résilience et Tolérance aux Pannes

Le cluster est configuré pour résister aux défaillances matérielles et logicielles.

### Test de "Kill Pod" (Auto-healing)

Si un conteneur crash, l'orchestrateur en redémarre instantanément un nouveau pour maintenir le nombre de réplicas défini.

_Commande de test :_

```
docker kill <CONTAINER_ID>
docker service ps <SERVICE_NAME>
```

### Test de Scalabilité (Scale Up/Down)

La montée ou baisse en charge s'effectue sans interruption de service.

_Commande de test :_

```
docker service scale <SERVICE_NAME>=6
docker service ls
```

---

## 4. Fonctionnalités Avancées

### Gestion des Ressources (Requests & Limits)

Chaque service possède des limites strictes (CPU/RAM) et des réservations définies via le bloc `resources` pour éviter la saturation d'un nœud.

### Node Affinity & Contraintes

La BDD et les services critiques sont restreints aux nœuds appropriés via `placement: constraints` :

- `node.role == manager` pour la BDD et Traefik
- `node.hostname != docker-desktop` pour l'API et Nginx

### Rolling Updates & Rollback Automatique

Mise à jour progressive configurée (`update_config: parallelism: 1, delay: 5s`). En cas d'échec du healthcheck, le service revient automatiquement à la version précédente (`rollback_config`).

### CI/CD (GitHub Actions)

Le pipeline CI/CD automatise le build, le push des images Docker Hub et le déploiement sur le VPS à chaque push sur `main`.

---

## 5. Monitoring (Prometheus & Grafana)

L'infrastructure intègre un stack de monitoring complet basé sur **Prometheus** et **Grafana**.

### Architecture du monitoring

```
API (prom-client) → Prometheus (scrape /metrics toutes les 15s) → Grafana (dashboards)
```

### Métriques disponibles

**HTTP**

- Total requêtes, taux req/s
- Latence P50 / P95 / P99
- Codes de statut par route
- Erreurs 5xx
- Requêtes en cours (in-flight)

**Node.js Runtime**

- Heap mémoire (utilisé / total)
- Mémoire RSS
- CPU usage
- Event loop lag
- Garbage collector

**Base de données**

- Durée des queries P95 par opération
- Taux de queries/s

### Accès

- **Grafana** : `https://grafana.armali.online` (admin / mot de passe du secret `grafana_admin_password`)
- **Prometheus** : `http://151.80.232.199:9090`

---

### Mise à jour d'une Docker config

Les Docker configs étant immuables, pour mettre à jour la configuration Prometheus par exemple :

```bash
# Créer une nouvelle version
docker config create prometheus_config_v2 /app/monitoring/prometheus.yml

# Mettre à jour le compose.prod.yaml
# configs:
#   prometheus_config_v2:
#     external: true

# Redéployer
DOCKER_HUB_USERNAME=cecilelecerf docker stack deploy \
  --with-registry-auth \
  --compose-file /app/compose.prod.yaml \
  cecoule
```

## 6. Sauvegarde et Restauration

Pour effectuer une sauvegarde manuelle de la base de données et des certificats HTTPS, exécutez le script dédié sur le Manager :

```
chmod +x backup.sh
./backup.sh
```

Les archives `.tar.gz` seront générées dans le dossier `/app/backups`.

---
