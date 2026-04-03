#!/bin/sh
set -e

if [ -f /run/secrets/db_user ]; then
  DB_USER=$(cat /run/secrets/db_user)
  DB_PASSWORD=$(cat /run/secrets/db_password)
  DB_NAME=$(cat /run/secrets/db_name)
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}"
  export JWT_ACCESS_SECRET=$(cat /run/secrets/jwt_access_secret)
  export JWT_REFRESH_SECRET=$(cat /run/secrets/jwt_refresh_secret)
fi


echo "Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi
echo "$DATABASE_URL"
echo "Waiting for database..."

echo "Running migrations..."
cd /app/apps/api
prisma migrate deploy --config=./dist/prisma.config.js 
 

echo "Starting application..."
exec node /app/apps/api/dist/index.js
