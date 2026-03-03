/*
  Warnings:

  - You are about to drop the column `yearsExperience` on the `veterinarian_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "veterinarian_profiles" DROP COLUMN "yearsExperience";

-- CreateTable
CREATE TABLE "veterinarian_identities" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "birthCity" TEXT,
    "birthDepartment" TEXT,
    "birthCountry" TEXT,
    "nationality" TEXT,
    "inseNumber" TEXT,
    "diploma" TEXT,
    "diplomaObtainedAt" TIMESTAMP(3),
    "rppsNumber" TEXT,
    "orderRegisteredAt" TIMESTAMP(3),
    "practiceAuthorization" BOOLEAN NOT NULL DEFAULT false,
    "proPhone" TEXT,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "veterinarian_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banking_infos" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iban" TEXT,
    "bic" TEXT,
    "domiciliation" TEXT,
    "beneficiary" TEXT,
    "veterinarianId" TEXT,
    "secretaryId" TEXT,
    "referantId" TEXT,

    CONSTRAINT "banking_infos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_identities_veterinarianId_key" ON "veterinarian_identities"("veterinarianId");

-- CreateIndex
CREATE UNIQUE INDEX "banking_infos_veterinarianId_key" ON "banking_infos"("veterinarianId");

-- CreateIndex
CREATE UNIQUE INDEX "banking_infos_secretaryId_key" ON "banking_infos"("secretaryId");

-- CreateIndex
CREATE UNIQUE INDEX "banking_infos_referantId_key" ON "banking_infos"("referantId");

-- AddForeignKey
ALTER TABLE "veterinarian_identities" ADD CONSTRAINT "veterinarian_identities_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banking_infos" ADD CONSTRAINT "banking_infos_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banking_infos" ADD CONSTRAINT "banking_infos_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "secretary_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banking_infos" ADD CONSTRAINT "banking_infos_referantId_fkey" FOREIGN KEY ("referantId") REFERENCES "referent_clinic_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
