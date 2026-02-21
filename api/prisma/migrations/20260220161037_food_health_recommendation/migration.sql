/*
  Warnings:

  - You are about to drop the column `recommended` on the `food_health_condition` table. All the data in the column will be lost.
  - Added the required column `recommendation` to the `food_health_condition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "food_health_condition" DROP COLUMN "recommended",
ADD COLUMN     "recommendation" "FoodHealthConditionRecommendation" NOT NULL;
