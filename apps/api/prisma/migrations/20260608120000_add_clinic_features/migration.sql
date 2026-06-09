-- AlterTable: ajoute openingHours à la table clinics
ALTER TABLE "clinics" ADD COLUMN "openingHours" TEXT;

-- CreateEnum: statut des demandes de création de clinique
CREATE TYPE "ClinicRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable: demandes de création de clinique
CREATE TABLE "clinic_creation_requests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ClinicRequestStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "description" TEXT,
    "directorId" TEXT NOT NULL,

    CONSTRAINT "clinic_creation_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "clinic_creation_requests" ADD CONSTRAINT "clinic_creation_requests_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
