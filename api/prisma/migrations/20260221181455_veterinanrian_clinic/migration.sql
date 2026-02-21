/*
  Warnings:

  - You are about to drop the column `clinicId` on the `veterinarian_profiles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "veterinarian_profiles" DROP CONSTRAINT "veterinarian_profiles_clinicId_fkey";

-- DropIndex
DROP INDEX "veterinarian_profiles_clinicId_key";

-- AlterTable
ALTER TABLE "veterinarian_profiles" DROP COLUMN "clinicId";
