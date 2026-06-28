/*
  Warnings:

  - Made the column `country` on table `client_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "client_profiles" ALTER COLUMN "country" SET NOT NULL;
