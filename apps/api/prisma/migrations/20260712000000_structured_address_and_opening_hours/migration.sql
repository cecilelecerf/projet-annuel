-- AlterTable: clinic_requests - adresse structurée
ALTER TABLE "clinic_requests" ADD COLUMN "street" TEXT;
ALTER TABLE "clinic_requests" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "clinic_requests" ADD COLUMN "city" TEXT;
ALTER TABLE "clinic_requests" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'FR';

UPDATE "clinic_requests" SET "street" = "address", "postalCode" = '00000', "city" = 'Inconnue' WHERE "street" IS NULL;

ALTER TABLE "clinic_requests" ALTER COLUMN "street" SET NOT NULL;
ALTER TABLE "clinic_requests" ALTER COLUMN "postalCode" SET NOT NULL;
ALTER TABLE "clinic_requests" ALTER COLUMN "city" SET NOT NULL;
ALTER TABLE "clinic_requests" DROP COLUMN "address";

-- AlterTable: clinics - adresse structurée + horaires en JSON
ALTER TABLE "clinics" ADD COLUMN "street" TEXT;
ALTER TABLE "clinics" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "clinics" ADD COLUMN "city" TEXT;
ALTER TABLE "clinics" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'FR';

UPDATE "clinics" SET "street" = "address", "postalCode" = '00000', "city" = 'Inconnue' WHERE "street" IS NULL;

ALTER TABLE "clinics" ALTER COLUMN "street" SET NOT NULL;
ALTER TABLE "clinics" ALTER COLUMN "postalCode" SET NOT NULL;
ALTER TABLE "clinics" ALTER COLUMN "city" SET NOT NULL;
ALTER TABLE "clinics" DROP COLUMN "address";

ALTER TABLE "clinics" ALTER COLUMN "openingHours" TYPE JSONB USING to_jsonb("openingHours");

ALTER TABLE "clinics" ALTER COLUMN "lat" SET DEFAULT 0;
ALTER TABLE "clinics" ALTER COLUMN "lng" SET DEFAULT 0;
