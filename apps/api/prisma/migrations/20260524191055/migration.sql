/*
  Warnings:

  - You are about to drop the column `mandatoryCountry` on the `vaccines` table. All the data in the column will be lost.
  - You are about to drop the column `recommendedCountry` on the `vaccines` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VaccineRuleType" AS ENUM ('MANDATORY', 'RECOMMENDED');

-- AlterTable
ALTER TABLE "vaccines" DROP COLUMN "mandatoryCountry",
DROP COLUMN "recommendedCountry";

-- CreateTable
CREATE TABLE "vaccine_country_rules" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "minAge" INTEGER NOT NULL,
    "type" "VaccineRuleType" NOT NULL,
    "vaccineId" TEXT NOT NULL,

    CONSTRAINT "vaccine_country_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vaccine_country_rules_vaccineId_country_type_key" ON "vaccine_country_rules"("vaccineId", "country", "type");

-- AddForeignKey
ALTER TABLE "vaccine_country_rules" ADD CONSTRAINT "vaccine_country_rules_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
