#!/bin/sh
until mc alias set local http://minio:9000 "$(cat /run/secrets/minio_root_user)" "$(cat /run/secrets/minio_root_password)"; do
  echo "En attente de MinIO..."
  sleep 2
done
mc mb --ignore-existing local/armali-files
mc anonymous set download local/armali-files/users
mc anonymous set download local/armali-files/animals
mc anonymous set download local/armali-files/brands
mc anonymous set download local/armali-files/products
mc anonymous set download local/armali-files/imagings
mc anonymous set download local/armali-files/analysiss
 
