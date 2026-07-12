-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('ALIVE', 'DECEASED');

-- AlterTable
ALTER TABLE "animals" ADD COLUMN     "hasInsurance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "insurancePolicyNumber" TEXT,
ADD COLUMN     "insuranceProvider" TEXT,
ADD COLUMN     "status" "AnimalStatus" NOT NULL DEFAULT 'ALIVE';
