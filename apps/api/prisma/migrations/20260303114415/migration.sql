/*
  Warnings:

  - You are about to drop the `veterinarian_clinic_availabilities` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActType" AS ENUM ('VACCINATION', 'SURGERY', 'HOSPITALIZATION', 'IMAGING', 'ANALYSIS', 'NURSING', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "AnesthesiaType" AS ENUM ('LOCAL', 'GENERAL', 'SEDATION');

-- CreateEnum
CREATE TYPE "ImagingType" AS ENUM ('XRAY', 'ULTRASOUND', 'SCANNER', 'MRI');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('BLOOD', 'URINE', 'STOOL', 'BIOPSY', 'CYTOLOGY', 'OTHER');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RECEIVED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "veterinarian_clinic_availabilities" DROP CONSTRAINT "veterinarian_clinic_availabilities_id_fkey";

-- DropForeignKey
ALTER TABLE "veterinarian_clinic_availabilities" DROP CONSTRAINT "veterinarian_clinic_availabilities_veterinarianClinicId_fkey";

-- DropTable
DROP TABLE "veterinarian_clinic_availabilities";

-- CreateTable
CREATE TABLE "acts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ActType" NOT NULL,
    "basePrice" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "acts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_acts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DECIMAL(8,2) NOT NULL,
    "actId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "clinic_acts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_metting_acts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "priceApplied" DECIMAL(8,2) NOT NULL,
    "animalMettingId" TEXT NOT NULL,
    "clinicActId" TEXT NOT NULL,

    CONSTRAINT "animal_metting_acts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_metting_act_performers" (
    "id" TEXT NOT NULL,
    "animalMettingActId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "animal_metting_act_performers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surgeries" (
    "id" TEXT NOT NULL,
    "anesthesiaType" "AnesthesiaType" NOT NULL,
    "duration" INTEGER,
    "complications" TEXT,
    "postOpInstructions" TEXT,

    CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitalizations" (
    "id" TEXT NOT NULL,
    "admittedAt" TIMESTAMP(3) NOT NULL,
    "dischargedAt" TIMESTAMP(3),
    "boxNumber" TEXT,

    CONSTRAINT "hospitalizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitalization_reports" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL,
    "weight" DECIMAL(5,2),
    "temperature" DECIMAL(4,2),
    "hospitalizationId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "hospitalization_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagings" (
    "id" TEXT NOT NULL,
    "imagingType" "ImagingType" NOT NULL,
    "bodyPart" TEXT,
    "findings" TEXT,
    "fileUrl" TEXT,

    CONSTRAINT "imagings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "analysisType" "AnalysisType" NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "laboratory" TEXT,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "interpretation" TEXT,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "animalMettingId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" INTEGER,
    "instructions" TEXT,
    "prescriptionId" TEXT NOT NULL,
    "clinicProductId" TEXT NOT NULL,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinic_acts_actId_clinicId_key" ON "clinic_acts"("actId", "clinicId");

-- AddForeignKey
ALTER TABLE "clinic_acts" ADD CONSTRAINT "clinic_acts_actId_fkey" FOREIGN KEY ("actId") REFERENCES "acts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_acts" ADD CONSTRAINT "clinic_acts_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_metting_acts" ADD CONSTRAINT "animal_metting_acts_animalMettingId_fkey" FOREIGN KEY ("animalMettingId") REFERENCES "animal_mettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_metting_acts" ADD CONSTRAINT "animal_metting_acts_clinicActId_fkey" FOREIGN KEY ("clinicActId") REFERENCES "clinic_acts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_metting_act_performers" ADD CONSTRAINT "animal_metting_act_performers_animalMettingActId_fkey" FOREIGN KEY ("animalMettingActId") REFERENCES "animal_metting_acts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_metting_act_performers" ADD CONSTRAINT "animal_metting_act_performers_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_metting_acts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_metting_acts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalization_reports" ADD CONSTRAINT "hospitalization_reports_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "hospitalizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalization_reports" ADD CONSTRAINT "hospitalization_reports_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagings" ADD CONSTRAINT "imagings_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_metting_acts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_metting_acts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_animalMettingId_fkey" FOREIGN KEY ("animalMettingId") REFERENCES "animal_mettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_clinicProductId_fkey" FOREIGN KEY ("clinicProductId") REFERENCES "clinic_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
