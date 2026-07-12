-- AlterTable: add emergencyToken as nullable first so existing rows can be backfilled
ALTER TABLE "animals" ADD COLUMN "emergencyToken" TEXT;

-- Backfill existing rows with a random token
UPDATE "animals" SET "emergencyToken" = gen_random_uuid()::text WHERE "emergencyToken" IS NULL;

-- Enforce NOT NULL + uniqueness now that every row has a value
ALTER TABLE "animals" ALTER COLUMN "emergencyToken" SET NOT NULL;
CREATE UNIQUE INDEX "animals_emergencyToken_key" ON "animals"("emergencyToken");
