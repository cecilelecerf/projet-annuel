#!/bin/sh
set -e

echo "Running migrations..."

DB_USER=$(cat /run/secrets/db_user)
DB_PASSWORD=$(cat /run/secrets/db_password)
DB_NAME=$(cat /run/secrets/db_name)

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}"

cd /app/apps/api

prisma migrate deploy --config=./dist/prisma.config.js

echo "Migration complete"