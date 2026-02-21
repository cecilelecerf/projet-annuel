/*
  Warnings:

  - The values [CLINIC] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('CLIENT', 'SECRETARY', 'VETERINARIAN', 'DIRECTOR', 'REFERANT', 'ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CLIENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "director_clinic_profiles" DROP CONSTRAINT "director_clinic_profiles_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "referent_clinic_profiles" DROP CONSTRAINT "referent_clinic_profiles_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "secretary_profiles" DROP CONSTRAINT "secretary_profiles_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "veterinarian_profiles" DROP CONSTRAINT "veterinarian_profiles_clinicId_fkey";

-- AlterTable
ALTER TABLE "client_profiles" ADD COLUMN     "secretaryProfileId" TEXT;

-- AddForeignKey
ALTER TABLE "veterinarian_profiles" ADD CONSTRAINT "veterinarian_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretary_profiles" ADD CONSTRAINT "secretary_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_clinic_profiles" ADD CONSTRAINT "director_clinic_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referent_clinic_profiles" ADD CONSTRAINT "referent_clinic_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
