/*
  Warnings:

  - You are about to drop the column `type` on the `food_pet` table. All the data in the column will be lost.
  - Added the required column `day` to the `food_pet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "food_pet" DROP COLUMN "type",
ADD COLUMN     "day" SMALLINT NOT NULL;

-- DropEnum
DROP TYPE "FoodPetDay";
