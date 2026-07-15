#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/armali-backup-${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

DB_HOST="${DB_HOST:-cecoule_postgres}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://cecoule_minio:9000}"

OVH_BUCKET="armali-backups-local"
OVH_ENDPOINT="https://s3.gra.io.cloud.ovh.net"
OVH_REGION="gra"

AWS_BUCKET="armali-backups-dr"
AWS_REGION="eu-west-3"

echo "[$(date)] Démarrage sauvegarde Armali"

# 1. Dump PostgreSQL
echo "[1/5] Dump PostgreSQL..."
DB_USER=$(cat /run/secrets/db_user)
DB_NAME=$(cat /run/secrets/db_name)
DB_PASSWORD=$(cat /run/secrets/db_password)

PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" \
  | gzip > "${BACKUP_DIR}/postgres_dump_${TIMESTAMP}.sql.gz"
echo "  -> $(du -h "${BACKUP_DIR}/postgres_dump_${TIMESTAMP}.sql.gz" | cut -f1)"

# 2. Mirror MinIO
echo "[2/5] Mirror MinIO..."
MINIO_USER=$(cat /run/secrets/minio_root_user)
MINIO_PASSWORD=$(cat /run/secrets/minio_root_password)

mc alias set minio-armali "$MINIO_ENDPOINT" "$MINIO_USER" "$MINIO_PASSWORD" > /dev/null
mkdir -p "${BACKUP_DIR}/files"
mc mirror --overwrite minio-armali/armali-files "${BACKUP_DIR}/files"
echo "  -> $(find "${BACKUP_DIR}/files" -type f | wc -l) fichiers"

# 3. Copie 2 — OVH Object Storage
echo "[3/5] Sync vers OVH..."
OVH_ACCESS_KEY=$(cat /run/secrets/ovh_s3_access_key)
OVH_SECRET_KEY=$(cat /run/secrets/ovh_s3_secret_key)

AWS_ACCESS_KEY_ID="$OVH_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$OVH_SECRET_KEY" \
  aws s3 sync "$BACKUP_DIR" "s3://${OVH_BUCKET}/backups/${TIMESTAMP}/" \
  --endpoint-url "$OVH_ENDPOINT" --region "$OVH_REGION"
echo "  -> OK"

# 4. Copie 3 — AWS S3 externe (optionnelle : skip si secrets absents)
if [ -f /run/secrets/aws_dr_access_key_id ] && [ -f /run/secrets/aws_dr_secret_access_key ]; then
  echo "[4/5] Sync vers AWS..."
  AWS_DR_ACCESS_KEY=$(cat /run/secrets/aws_dr_access_key_id)
  AWS_DR_SECRET_KEY=$(cat /run/secrets/aws_dr_secret_access_key)

  AWS_ACCESS_KEY_ID="$AWS_DR_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$AWS_DR_SECRET_KEY" \
    aws s3 sync "$BACKUP_DIR" "s3://${AWS_BUCKET}/backups/${TIMESTAMP}/" \
    --region "$AWS_REGION" --storage-class STANDARD_IA
  echo "  -> OK"
else
  echo "[4/5] Secrets AWS DR absents — étape ignorée (test partiel)"
fi

# 5. Nettoyage
rm -rf "$BACKUP_DIR"
echo "[$(date)] Sauvegarde terminée avec succès."