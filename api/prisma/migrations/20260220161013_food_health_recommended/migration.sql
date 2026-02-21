/*
  Warnings:

  - Added the required column `recommended` to the `food_health_condition` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FoodHealthConditionRecommendation" AS ENUM ('RECOMMENDED', 'AVOID');

-- AlterTable
ALTER TABLE "food_health_condition" ADD COLUMN     "recommended" "FoodHealthConditionRecommendation" NOT NULL;
