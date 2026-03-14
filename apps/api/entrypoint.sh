#!/bin/sh
set -e

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
exec node /dist/prisma/seed.js


echo "Starting application..."
exec node /app/apps/api/dist/src/index.js
