/*
  Warnings:

  - You are about to drop the `ClientPet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClientPet" DROP CONSTRAINT "ClientPet_attendingVeterinarionId_fkey";

-- DropForeignKey
ALTER TABLE "ClientPet" DROP CONSTRAINT "ClientPet_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ClientPet" DROP CONSTRAINT "ClientPet_raceId_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_authorId_fkey";

-- DropTable
DROP TABLE "ClientPet";

-- DropTable
DROP TABLE "posts";

-- DropTable
DROP TABLE "test";

-- CreateTable
CREATE TABLE "client_pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "activity" INTEGER NOT NULL,
    "attendingVeterinarionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,

    CONSTRAINT "client_pet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_pet_attendingVeterinarionId_key" ON "client_pet"("attendingVeterinarionId");

-- CreateIndex
CREATE UNIQUE INDEX "client_pet_clientId_key" ON "client_pet"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "client_pet_raceId_key" ON "client_pet"("raceId");

-- AddForeignKey
ALTER TABLE "client_pet" ADD CONSTRAINT "client_pet_attendingVeterinarionId_fkey" FOREIGN KEY ("attendingVeterinarionId") REFERENCES "veterinarian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_pet" ADD CONSTRAINT "client_pet_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_pet" ADD CONSTRAINT "client_pet_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
