-- CreateEnum
CREATE TYPE "ConversationMemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "FoodHealthConditionRecommendation" AS ENUM ('RECOMMENDED', 'AVOID');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('RECURRING', 'SPECIFIED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "MettingKind" AS ENUM ('AVAILABILITY', 'INTERNAL', 'ANIMAL');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('KIBBLE', 'WET');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'READY', 'PICKED_UP', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'SECRETARY', 'VETERINARIAN', 'DIRECTOR', 'REFERANT', 'ADMIN');

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialities" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "specialities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_clinics" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "veterinarianId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "veterinarian_clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "ConversationMemberRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reads" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "readById" TEXT NOT NULL,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_conditions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "petId" TEXT NOT NULL,

    CONSTRAINT "health_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owned_pet_health_conditions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL,
    "diagnosedAt" TIMESTAMP(3) NOT NULL,
    "healthConditionId" TEXT NOT NULL,
    "ownedPetId" TEXT NOT NULL,
    "meetingId" TEXT,
    "addedById" TEXT NOT NULL,

    CONSTRAINT "owned_pet_health_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_health_conditions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recommendation" "FoodHealthConditionRecommendation" NOT NULL,
    "foodId" TEXT NOT NULL,
    "healthConditionId" TEXT NOT NULL,

    CONSTRAINT "food_health_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metting_bases" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ScheduleType" NOT NULL,
    "dayOfWeek" SMALLINT,
    "dateStart" DATE,
    "dateEnd" DATE,
    "startTime" TIME(0),
    "endTime" TIME(0),
    "specificDate" DATE,
    "parentId" TEXT,
    "kind" "MettingKind" NOT NULL,

    CONSTRAINT "metting_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_clinic_availabilities" (
    "id" TEXT NOT NULL,
    "veterinarianClinicId" TEXT NOT NULL,

    CONSTRAINT "veterinarian_clinic_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_metting_participants" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mettingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MeetingStatus" NOT NULL,

    CONSTRAINT "internal_metting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_mettings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "internal_mettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_mettings" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "petWeight" DECIMAL(5,2),
    "petSize" DECIMAL(5,2),
    "report" TEXT,
    "specialityId" TEXT,
    "ownedPetId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "animal_mettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owned_pets" (
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

    CONSTRAINT "owned_pets_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "owned_pet_vaccines" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownedPetId" TEXT NOT NULL,
    "vaccineId" TEXT NOT NULL,
    "meetingId" TEXT,

    CONSTRAINT "owned_pet_vaccines_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "foods" (
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

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "food_pets" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "day" SMALLINT NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3),
    "quantity" DECIMAL(65,30) NOT NULL,
    "hours" TIMESTAMP(3) NOT NULL,
    "foodId" TEXT NOT NULL,
    "ownedPetId" TEXT NOT NULL,

    CONSTRAINT "food_pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "pickupAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "productClinicId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
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
    "secretaryProfileId" TEXT,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_profiles" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "bio" TEXT,
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
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "director_clinic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referent_clinic_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

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

-- CreateTable
CREATE TABLE "_ClinicToSpeciality" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClinicToSpeciality_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ClinicToPet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClinicToPet_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SpecialityToVeterinarianProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SpecialityToVeterinarianProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PetToVeterinarianProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PetToVeterinarianProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinics_siret_key" ON "clinics"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "specialities_name_key" ON "specialities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "foods_productId_key" ON "foods"("productId");

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
CREATE UNIQUE INDEX "veterinarian_profiles_userId_key" ON "veterinarian_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "secretary_profiles_userId_key" ON "secretary_profiles"("userId");

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

-- CreateIndex
CREATE INDEX "_ClinicToSpeciality_B_index" ON "_ClinicToSpeciality"("B");

-- CreateIndex
CREATE INDEX "_ClinicToPet_B_index" ON "_ClinicToPet"("B");

-- CreateIndex
CREATE INDEX "_SpecialityToVeterinarianProfile_B_index" ON "_SpecialityToVeterinarianProfile"("B");

-- CreateIndex
CREATE INDEX "_PetToVeterinarianProfile_B_index" ON "_PetToVeterinarianProfile"("B");

-- AddForeignKey
ALTER TABLE "veterinarian_clinics" ADD CONSTRAINT "veterinarian_clinics_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinics" ADD CONSTRAINT "veterinarian_clinics_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_readById_fkey" FOREIGN KEY ("readById") REFERENCES "conversation_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_conditions" ADD CONSTRAINT "health_conditions_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_healthConditionId_fkey" FOREIGN KEY ("healthConditionId") REFERENCES "health_conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "animal_mettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_health_conditions" ADD CONSTRAINT "food_health_conditions_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_health_conditions" ADD CONSTRAINT "food_health_conditions_healthConditionId_fkey" FOREIGN KEY ("healthConditionId") REFERENCES "health_conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metting_bases" ADD CONSTRAINT "metting_bases_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "metting_bases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinic_availabilities" ADD CONSTRAINT "veterinarian_clinic_availabilities_id_fkey" FOREIGN KEY ("id") REFERENCES "metting_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinic_availabilities" ADD CONSTRAINT "veterinarian_clinic_availabilities_veterinarianClinicId_fkey" FOREIGN KEY ("veterinarianClinicId") REFERENCES "veterinarian_clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_metting_participants" ADD CONSTRAINT "internal_metting_participants_mettingId_fkey" FOREIGN KEY ("mettingId") REFERENCES "internal_mettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_metting_participants" ADD CONSTRAINT "internal_metting_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_mettings" ADD CONSTRAINT "internal_mettings_id_fkey" FOREIGN KEY ("id") REFERENCES "metting_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_mettings" ADD CONSTRAINT "internal_mettings_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_mettings" ADD CONSTRAINT "animal_mettings_id_fkey" FOREIGN KEY ("id") REFERENCES "metting_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_mettings" ADD CONSTRAINT "animal_mettings_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "specialities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_mettings" ADD CONSTRAINT "animal_mettings_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_mettings" ADD CONSTRAINT "animal_mettings_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pets" ADD CONSTRAINT "owned_pets_attendingVeterinarianId_fkey" FOREIGN KEY ("attendingVeterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pets" ADD CONSTRAINT "owned_pets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pets" ADD CONSTRAINT "owned_pets_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccines" ADD CONSTRAINT "owned_pet_vaccines_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccines" ADD CONSTRAINT "owned_pet_vaccines_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccines" ADD CONSTRAINT "owned_pet_vaccines_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "animal_mettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_pets" ADD CONSTRAINT "food_pets_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_pets" ADD CONSTRAINT "food_pets_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productClinicId_fkey" FOREIGN KEY ("productClinicId") REFERENCES "clinic_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_profiles" ADD CONSTRAINT "veterinarian_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretary_profiles" ADD CONSTRAINT "secretary_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretary_profiles" ADD CONSTRAINT "secretary_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_clinic_profiles" ADD CONSTRAINT "director_clinic_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_clinic_profiles" ADD CONSTRAINT "director_clinic_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referent_clinic_profiles" ADD CONSTRAINT "referent_clinic_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referent_clinic_profiles" ADD CONSTRAINT "referent_clinic_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToSpeciality" ADD CONSTRAINT "_ClinicToSpeciality_A_fkey" FOREIGN KEY ("A") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToSpeciality" ADD CONSTRAINT "_ClinicToSpeciality_B_fkey" FOREIGN KEY ("B") REFERENCES "specialities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToPet" ADD CONSTRAINT "_ClinicToPet_A_fkey" FOREIGN KEY ("A") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToPet" ADD CONSTRAINT "_ClinicToPet_B_fkey" FOREIGN KEY ("B") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialityToVeterinarianProfile" ADD CONSTRAINT "_SpecialityToVeterinarianProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "specialities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialityToVeterinarianProfile" ADD CONSTRAINT "_SpecialityToVeterinarianProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PetToVeterinarianProfile" ADD CONSTRAINT "_PetToVeterinarianProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PetToVeterinarianProfile" ADD CONSTRAINT "_PetToVeterinarianProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
