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

if [ -f /run/secrets/aws_access_key_id ]; then
  export AWS_ACCESS_KEY_ID=$(cat /run/secrets/aws_access_key_id)
  export AWS_SECRET_ACCESS_KEY=$(cat /run/secrets/aws_secret_access_key)
  export S3_BUCKET=$(cat /run/secrets/s3_bucket)
  export S3_ENDPOINT=$(cat /run/secrets/s3_endpoint)
  export ASSETS_BASE_URL=$(cat /run/secrets/assets_base_url)
fi

if [ -f /run/secrets/stripe_secret_key ]; then
  export STRIPE_SECRET_KEY=$(cat /run/secrets/stripe_secret_key)
  export STRIPE_WEBHOOK_SECRET=$(cat /run/secrets/stripe_webhook_secret_v2)
fi

if [ -f /run/secrets/resend_api_key ]; then
  export RESEND_API_KEY=$(cat /run/secrets/resend_api_key)
fi

echo "Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi
echo "✅ DATABASE_URL is set"
echo "Waiting for database..."

echo "Running migrations..."
cd /app/apps/api
prisma migrate deploy --config=./dist/prisma.config.js 
 

echo "Starting application..."
exec node /app/apps/api/dist/index.js
