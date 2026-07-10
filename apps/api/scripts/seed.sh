#!/bin/sh
set -e

echo "Running seed..."

DB_USER=$(cat /run/secrets/db_user)
DB_PASSWORD=$(cat /run/secrets/db_password)
DB_NAME=$(cat /run/secrets/db_name)

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}"

export AWS_ACCESS_KEY_ID=$(cat /run/secrets/aws_access_key_id_v2)
export AWS_SECRET_ACCESS_KEY=$(cat /run/secrets/aws_secret_access_key_v2)

export S3_BUCKET=$(cat /run/secrets/s3_bucket)
export S3_ENDPOINT=$(cat /run/secrets/s3_endpoint)
export AWS_REGION=$(cat /run/secrets/aws_region)

cd /app/apps/api

pnpm prisma db seed --config=./dist/prisma.config.js

echo "Seed complete"