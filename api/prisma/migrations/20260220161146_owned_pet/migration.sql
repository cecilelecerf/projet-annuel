/*
  Warnings:

  - You are about to drop the column `clientPetId` on the `food_pet` table. All the data in the column will be lost.
  - Added the required column `ownedPetId` to the `food_pet` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "food_pet" DROP CONSTRAINT "food_pet_clientPetId_fkey";

-- AlterTable
ALTER TABLE "food_pet" DROP COLUMN "clientPetId",
ADD COLUMN     "ownedPetId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "food_pet" ADD CONSTRAINT "food_pet_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
