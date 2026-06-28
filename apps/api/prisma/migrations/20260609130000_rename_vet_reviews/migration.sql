-- RenameTable
ALTER TABLE "vet_reviews" RENAME TO "veterinarian_reviews";

-- RenameIndex
ALTER INDEX "vet_reviews_clientId_veterinarianId_key" RENAME TO "veterinarian_reviews_clientId_veterinarianId_key";

-- RenameForeignKey
ALTER TABLE "veterinarian_reviews" RENAME CONSTRAINT "vet_reviews_clientId_fkey" TO "veterinarian_reviews_clientId_fkey";
ALTER TABLE "veterinarian_reviews" RENAME CONSTRAINT "vet_reviews_veterinarianId_fkey" TO "veterinarian_reviews_veterinarianId_fkey";

-- RenamePrimaryKey
ALTER TABLE "veterinarian_reviews" RENAME CONSTRAINT "vet_reviews_pkey" TO "veterinarian_reviews_pkey";
