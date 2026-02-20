-- CreateEnum
CREATE TYPE "VeterinarianClinicType" AS ENUM ('RECURRING', 'SPECIFIED', 'EXECPTION');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('KIBBLE', 'WET');

-- CreateEnum
CREATE TYPE "FoodPetDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'READY', 'PICKED_UP', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'ADMIN', 'SECRETARY', 'VETERINARIAN', 'CLINIC');

-- CreateTable
CREATE TABLE "clinic" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT NOT NULL,

    CONSTRAINT "clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speciality" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "speciality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_speciality" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "veterinarian_id" TEXT NOT NULL,
    "speciality_id" TEXT NOT NULL,

    CONSTRAINT "veterinarian_speciality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_speciality" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinic_id" TEXT NOT NULL,
    "speciality_id" TEXT NOT NULL,

    CONSTRAINT "clinic_speciality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_clinic" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "veterinarian_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,

    CONSTRAINT "veterinarian_clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_pet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pet_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,

    CONSTRAINT "clinic_pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_pet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pet_id" TEXT NOT NULL,
    "veterinarian_id" TEXT NOT NULL,

    CONSTRAINT "veterinarian_pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_clinic_average" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "VeterinarianClinicType" NOT NULL,
    "day_of_week" SMALLINT,
    "specific_date" DATE,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "veterinarian_clinic_id" TEXT NOT NULL,

    CONSTRAINT "veterinarian_clinic_average_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owned_pet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "activity" INTEGER,
    "attendingVeterinarianId" TEXT,
    "clientId" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,

    CONSTRAINT "owned_pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "picture" TEXT,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "petId" TEXT NOT NULL,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccines" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "recommendedAge" INTEGER NOT NULL,
    "boosterInterval" INTEGER NOT NULL,
    "mandatoryCountry" JSONB,
    "recommendedCountry" JSONB,
    "petId" TEXT NOT NULL,

    CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_pet_vaccine" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownedPetId" TEXT NOT NULL,
    "vaccineId" TEXT NOT NULL,
    "mettingId" TEXT,

    CONSTRAINT "personal_pet_vaccine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "petWeight" INTEGER,
    "petSize" INTEGER,
    "ownedPetId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "mettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "qrCode" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "picture" TEXT,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caloriesPer100" DECIMAL(65,30),
    "proteinPer100" DECIMAL(65,30),
    "fatPercentage" DECIMAL(65,30),
    "fiberPercentage" DECIMAL(65,30),
    "moisturePercentage" DECIMAL(65,30),
    "type" "FoodType" NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "logo" TEXT,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_products" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minimumRequired" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "clinicId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "clientProfileId" TEXT,

    CONSTRAINT "clinic_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_pet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "FoodPetDay" NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3),
    "quantity" DECIMAL(65,30) NOT NULL,
    "hours" TIMESTAMP(3) NOT NULL,
    "foodId" TEXT NOT NULL,
    "clientPetId" TEXT NOT NULL,

    CONSTRAINT "food_pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "pickup_at" TIMESTAMP(3),
    "client_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "product_clinic_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "picture" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_profiles" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "bio" TEXT,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "veterinarian_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secretary_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "secretary_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "director_clinic_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "director_clinic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referent_clinic_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "referent_clinic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinic_siret_key" ON "clinic"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "speciality_name_key" ON "speciality"("name");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_speciality_veterinarian_id_key" ON "veterinarian_speciality"("veterinarian_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_speciality_clinic_id_key" ON "clinic_speciality"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_clinic_veterinarian_id_key" ON "veterinarian_clinic"("veterinarian_id");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_clinic_clinic_id_key" ON "veterinarian_clinic"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_pet_pet_id_key" ON "clinic_pet"("pet_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_pet_clinic_id_key" ON "clinic_pet"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_pet_pet_id_key" ON "veterinarian_pet"("pet_id");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_pet_veterinarian_id_key" ON "veterinarian_pet"("veterinarian_id");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_clinic_average_veterinarian_clinic_id_key" ON "veterinarian_clinic_average"("veterinarian_clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "food_productId_key" ON "food"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_userId_key" ON "client_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_profiles_licenseNumber_key" ON "veterinarian_profiles"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_profiles_clinicId_key" ON "veterinarian_profiles"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_profiles_userId_key" ON "veterinarian_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "secretary_profiles_userId_key" ON "secretary_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "secretary_profiles_clinicId_key" ON "secretary_profiles"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "director_clinic_profiles_userId_key" ON "director_clinic_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "referent_clinic_profiles_userId_key" ON "referent_clinic_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "veterinarian_speciality" ADD CONSTRAINT "veterinarian_speciality_veterinarian_id_fkey" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_speciality" ADD CONSTRAINT "veterinarian_speciality_speciality_id_fkey" FOREIGN KEY ("speciality_id") REFERENCES "speciality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_speciality" ADD CONSTRAINT "clinic_speciality_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_speciality" ADD CONSTRAINT "clinic_speciality_speciality_id_fkey" FOREIGN KEY ("speciality_id") REFERENCES "speciality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinic" ADD CONSTRAINT "veterinarian_clinic_veterinarian_id_fkey" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinic" ADD CONSTRAINT "veterinarian_clinic_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_pet" ADD CONSTRAINT "clinic_pet_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_pet" ADD CONSTRAINT "clinic_pet_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_pet" ADD CONSTRAINT "veterinarian_pet_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_pet" ADD CONSTRAINT "veterinarian_pet_veterinarian_id_fkey" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinic_average" ADD CONSTRAINT "veterinarian_clinic_average_veterinarian_clinic_id_fkey" FOREIGN KEY ("veterinarian_clinic_id") REFERENCES "veterinarian_clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet" ADD CONSTRAINT "owned_pet_attendingVeterinarianId_fkey" FOREIGN KEY ("attendingVeterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet" ADD CONSTRAINT "owned_pet_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet" ADD CONSTRAINT "owned_pet_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_pet_vaccine" ADD CONSTRAINT "personal_pet_vaccine_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_pet_vaccine" ADD CONSTRAINT "personal_pet_vaccine_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_pet_vaccine" ADD CONSTRAINT "personal_pet_vaccine_mettingId_fkey" FOREIGN KEY ("mettingId") REFERENCES "mettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mettings" ADD CONSTRAINT "mettings_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mettings" ADD CONSTRAINT "mettings_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food" ADD CONSTRAINT "food_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_pet" ADD CONSTRAINT "food_pet_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_pet" ADD CONSTRAINT "food_pet_clientPetId_fkey" FOREIGN KEY ("clientPetId") REFERENCES "owned_pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_clinic_id_fkey" FOREIGN KEY ("product_clinic_id") REFERENCES "clinic_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_profiles" ADD CONSTRAINT "veterinarian_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_profiles" ADD CONSTRAINT "veterinarian_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretary_profiles" ADD CONSTRAINT "secretary_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretary_profiles" ADD CONSTRAINT "secretary_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_clinic_profiles" ADD CONSTRAINT "director_clinic_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referent_clinic_profiles" ADD CONSTRAINT "referent_clinic_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
