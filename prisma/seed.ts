import {
  PrismaClient,
  UserRole,
  FoodType,
  FoodPetDay,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { hash } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Start seeding...");

  // ============================================
  // NETTOYER LA BASE
  // ============================================
  await prisma.foodPet.deleteMany();
  await prisma.personalPetVaccine.deleteMany();
  await prisma.metting.deleteMany();
  await prisma.clientPet.deleteMany();
  await prisma.clinicProduct.deleteMany();
  await prisma.food.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.vaccine.deleteMany();
  await prisma.race.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.secretaryProfile.deleteMany();
  await prisma.veterinarianProfile.deleteMany();
  await prisma.clinicProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Database cleaned");

  const password = await hash("password123", 10);

  // ============================================
  // CRÉER DES BRANDS
  // ============================================
  const royalCanin = await prisma.brand.create({
    data: {
      name: "Royal Canin",
      logo: "https://picsum.photos/seed/royalcanin/200",
    },
  });

  const purina = await prisma.brand.create({
    data: {
      name: "Purina Pro Plan",
      logo: "https://picsum.photos/seed/purina/200",
    },
  });

  const hills = await prisma.brand.create({
    data: {
      name: "Hill's Science Diet",
      logo: "https://picsum.photos/seed/hills/200",
    },
  });

  console.log("✅ Brands created");

  // ============================================
  // CRÉER DES PRODUITS ALIMENTAIRES
  // ============================================
  const product1 = await prisma.product.create({
    data: {
      name: "Croquettes Chien Adulte",
      description: "Alimentation complète pour chiens adultes",
      qrCode: "QR-001-RC-DOG",
      websiteUrl: "https://www.royalcanin.com",
      picture: "https://picsum.photos/seed/dogfood1/300",
      brandId: royalCanin.id,
      Food: {
        create: {
          type: FoodType.KIBBLE,
          caloriesPer100: 350,
          proteinPer100: 25,
          fatPercentage: 14,
          fiberPercentage: 3.5,
          moisturePercentage: 8,
        },
      },
    },
    include: { Food: true },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "Pâtée Chat Adulte",
      description: "Nourriture humide pour chats adultes",
      qrCode: "QR-002-PP-CAT",
      websiteUrl: "https://www.purina.com",
      picture: "https://picsum.photos/seed/catfood1/300",
      brandId: purina.id,
      Food: {
        create: {
          type: FoodType.WET,
          caloriesPer100: 85,
          proteinPer100: 10,
          fatPercentage: 5,
          fiberPercentage: 1.5,
          moisturePercentage: 80,
        },
      },
    },
    include: { Food: true },
  });

  const product3 = await prisma.product.create({
    data: {
      name: "Croquettes Chat Senior",
      description: "Pour chats de plus de 7 ans",
      qrCode: "QR-003-HS-CAT",
      websiteUrl: "https://www.hillspet.com",
      picture: "https://picsum.photos/seed/catfood2/300",
      brandId: hills.id,
      Food: {
        create: {
          type: FoodType.KIBBLE,
          caloriesPer100: 320,
          proteinPer100: 28,
          fatPercentage: 12,
          fiberPercentage: 4,
          moisturePercentage: 7,
        },
      },
    },
    include: { Food: true },
  });

  console.log("✅ Products and Foods created");

  // ============================================
  // CRÉER DES ANIMAUX (ESPÈCES) ET RACES
  // ============================================
  const dog = await prisma.pet.create({
    data: {
      name: "Chien",
      picture: "https://picsum.photos/seed/dog/200",
    },
  });

  const cat = await prisma.pet.create({
    data: {
      name: "Chat",
      picture: "https://picsum.photos/seed/cat/200",
    },
  });

  // Races de chiens
  const goldenRetriever = await prisma.race.create({
    data: {
      name: "Golden Retriever",
      picture: "https://picsum.photos/seed/golden/200",
      petId: dog.id,
    },
  });

  const labrador = await prisma.race.create({
    data: {
      name: "Labrador",
      picture: "https://picsum.photos/seed/labrador/200",
      petId: dog.id,
    },
  });

  const germanShepherd = await prisma.race.create({
    data: {
      name: "Berger Allemand",
      picture: "https://picsum.photos/seed/shepherd/200",
      petId: dog.id,
    },
  });

  // Races de chats
  const siamese = await prisma.race.create({
    data: {
      name: "Siamois",
      picture: "https://picsum.photos/seed/siamese/200",
      petId: cat.id,
    },
  });

  const persian = await prisma.race.create({
    data: {
      name: "Persan",
      picture: "https://picsum.photos/seed/persian/200",
      petId: cat.id,
    },
  });

  const maineCoon = await prisma.race.create({
    data: {
      name: "Maine Coon",
      picture: "https://picsum.photos/seed/mainecoon/200",
      petId: cat.id,
    },
  });

  console.log("✅ Pets and Races created");

  // ============================================
  // CRÉER DES VACCINS
  // ============================================
  const rabiesVaccine = await prisma.vaccine.create({
    data: {
      name: "Rage",
      description: "Vaccin contre la rage, obligatoire en France",
      recommendedAge: 3, // mois
      boosterInterval: 12, // mois
      mandatoryCountry: ["FR", "BE", "CH"],
      recommendedCountry: ["US", "CA", "UK"],
      petId: dog.id,
    },
  });

  const parvoVaccine = await prisma.vaccine.create({
    data: {
      name: "Parvovirose",
      description: "Protection contre le parvovirus canin",
      recommendedAge: 2,
      boosterInterval: 12,
      mandatoryCountry: [],
      recommendedCountry: ["FR", "BE", "CH", "US"],
      petId: dog.id,
    },
  });

  const felineLeukemiaVaccine = await prisma.vaccine.create({
    data: {
      name: "Leucose Féline",
      description: "Vaccin contre la leucose du chat",
      recommendedAge: 2,
      boosterInterval: 12,
      mandatoryCountry: [],
      recommendedCountry: ["FR", "BE", "CH"],
      petId: cat.id,
    },
  });

  const typhusVaccine = await prisma.vaccine.create({
    data: {
      name: "Typhus",
      description: "Panleucopénie féline",
      recommendedAge: 2,
      boosterInterval: 12,
      mandatoryCountry: [],
      recommendedCountry: ["FR", "BE", "CH", "US"],
      petId: cat.id,
    },
  });

  console.log("✅ Vaccines created");

  // ============================================
  // CRÉER UN ADMIN
  // ============================================
  const admin = await prisma.user.create({
    data: {
      email: "admin@vetclinic.com",
      firstname: "Admin",
      lastname: "System",
      password,
      role: UserRole.ADMIN,
      picture: "https://picsum.photos/seed/admin/200",
    },
  });

  console.log("✅ Admin created:", admin.email);

  // ============================================
  // CRÉER DES CLINIQUES
  // ============================================
  const clinic1User = await prisma.user.create({
    data: {
      email: "contact@vetclinic-paris.com",
      firstname: "Clinique",
      lastname: "Vétérinaire Paris",
      password,
      role: UserRole.CLINIC,
      picture: "https://picsum.photos/seed/clinic1/200",
    },
  });

  const clinic1 = await prisma.clinicProfile.create({
    data: {
      name: "Clinique Vétérinaire Paris Centre",
      address: "123 rue de Rivoli, 75001 Paris",
      siret: "12345678901234",
      phone: "+33123456789",
      description: "Clinique vétérinaire moderne avec équipement de pointe",
      website: "https://vetclinic-paris.com",
      userId: clinic1User.id,
    },
  });

  const clinic2User = await prisma.user.create({
    data: {
      email: "contact@vetclinic-lyon.com",
      firstname: "Clinique",
      lastname: "Vétérinaire Lyon",
      password,
      role: UserRole.CLINIC,
      picture: "https://picsum.photos/seed/clinic2/200",
    },
  });

  const clinic2 = await prisma.clinicProfile.create({
    data: {
      name: "Clinique Vétérinaire Lyon",
      address: "45 cours Lafayette, 69003 Lyon",
      siret: "98765432109876",
      phone: "+33478901234",
      description: "Spécialisée en chirurgie et urgences",
      website: "https://vetclinic-lyon.com",
      userId: clinic2User.id,
    },
  });

  console.log("✅ Clinics created");

  // ============================================
  // CRÉER DES VÉTÉRINAIRES
  // ============================================
  const vet1User = await prisma.user.create({
    data: {
      email: "dr.smith@vetclinic.com",
      firstname: "Jane",
      lastname: "Smith",
      password,
      role: UserRole.VETERINARIAN,
      picture: "https://picsum.photos/seed/vet1/200",
    },
  });

  // Note: Il faut d'abord créer un ClientProfile pour la relation
  const vet1Client = await prisma.clientProfile.create({
    data: {
      dateOfBirth: new Date("1985-03-15"),
      address: "10 rue Example, 75001 Paris",
      phone: "+33600000001",
      userId: vet1User.id,
    },
  });

  const vet1 = await prisma.veterinarianProfile.create({
    data: {
      licenseNumber: "VET-FR-001",
      specialty: "Chirurgie générale",
      yearsExperience: 10,
      bio: "Spécialisée en chirurgie avec 10 ans d'expérience",
      userId: vet1User.id,
      clinicId: vet1Client.id,
    },
  });

  const vet2User = await prisma.user.create({
    data: {
      email: "dr.martin@vetclinic.com",
      firstname: "Pierre",
      lastname: "Martin",
      password,
      role: UserRole.VETERINARIAN,
      picture: "https://picsum.photos/seed/vet2/200",
    },
  });

  const vet2Client = await prisma.clientProfile.create({
    data: {
      dateOfBirth: new Date("1990-07-22"),
      address: "20 avenue Test, 75002 Paris",
      phone: "+33600000002",
      userId: vet2User.id,
    },
  });

  const vet2 = await prisma.veterinarianProfile.create({
    data: {
      licenseNumber: "VET-FR-002",
      specialty: "Médecine interne",
      yearsExperience: 5,
      bio: "Expert en diagnostics complexes",
      userId: vet2User.id,
      clinicId: vet2Client.id,
    },
  });

  console.log("✅ Veterinarians created");

  // ============================================
  // CRÉER DES SECRÉTAIRES
  // ============================================
  const secretary1User = await prisma.user.create({
    data: {
      email: "marie@vetclinic.com",
      firstname: "Marie",
      lastname: "Dupont",
      password,
      role: UserRole.SECRETARY,
      picture: "https://picsum.photos/seed/secretary1/200",
    },
  });

  const secretary1Client = await prisma.clientProfile.create({
    data: {
      dateOfBirth: new Date("1995-05-10"),
      address: "30 rue Secrétaire, 75003 Paris",
      phone: "+33600000003",
      userId: secretary1User.id,
    },
  });

  const secretary1 = await prisma.secretaryProfile.create({
    data: {
      userId: secretary1User.id,
      clinicId: secretary1Client.id,
    },
  });

  console.log("✅ Secretaries created");

  // ============================================
  // CRÉER DES CLIENTS
  // ============================================
  const client1User = await prisma.user.create({
    data: {
      email: "john.doe@email.com",
      firstname: "John",
      lastname: "Doe",
      password,
      role: UserRole.CLIENT,
      picture: "https://picsum.photos/seed/client1/200",
    },
  });

  const client1 = await prisma.clientProfile.create({
    data: {
      dateOfBirth: new Date("1990-05-15"),
      address: "45 avenue des Champs-Élysées, 75008 Paris",
      phone: "+33612345678",
      userId: client1User.id,
    },
  });

  const client2User = await prisma.user.create({
    data: {
      email: "alice.wilson@email.com",
      firstname: "Alice",
      lastname: "Wilson",
      password,
      role: UserRole.CLIENT,
      picture: "https://picsum.photos/seed/client2/200",
    },
  });

  const client2 = await prisma.clientProfile.create({
    data: {
      dateOfBirth: new Date("1985-08-22"),
      address: "78 rue de la Paix, 75002 Paris",
      phone: "+33687654321",
      userId: client2User.id,
    },
  });

  const client3User = await prisma.user.create({
    data: {
      email: "bob.martin@email.com",
      firstname: "Bob",
      lastname: "Martin",
      password,
      role: UserRole.CLIENT,
      picture: "https://picsum.photos/seed/client3/200",
    },
  });

  const client3 = await prisma.clientProfile.create({
    data: {
      dateOfBirth: new Date("1988-11-30"),
      address: "12 boulevard Saint-Germain, 75005 Paris",
      phone: "+33698765432",
      userId: client3User.id,
    },
  });

  console.log("✅ Clients created");

  // ============================================
  // CRÉER DES ANIMAUX DE COMPAGNIE
  // ============================================
  const pet1 = await prisma.clientPet.create({
    data: {
      name: "Max",
      dateOfBirth: new Date("2020-03-10"),
      description: "Chien très joueur et affectueux",
      activity: 8,
      clientId: client1.id,
      raceId: goldenRetriever.id,
      attendingVeterinarianId: vet1.id,
    },
  });

  const pet2 = await prisma.clientPet.create({
    data: {
      name: "Luna",
      dateOfBirth: new Date("2021-06-15"),
      description: "Chatte calme et indépendante",
      activity: 4,
      clientId: client1.id,
      raceId: siamese.id,
      attendingVeterinarianId: vet2.id,
    },
  });

  const pet3 = await prisma.clientPet.create({
    data: {
      name: "Rocky",
      dateOfBirth: new Date("2019-01-20"),
      description: "Labrador énergique",
      activity: 9,
      clientId: client2.id,
      raceId: labrador.id,
      attendingVeterinarianId: vet1.id,
    },
  });

  const pet4 = await prisma.clientPet.create({
    data: {
      name: "Milo",
      dateOfBirth: new Date("2022-04-05"),
      description: "Chaton curieux",
      activity: 7,
      clientId: client2.id,
      raceId: persian.id,
      attendingVeterinarianId: vet2.id,
    },
  });

  const pet5 = await prisma.clientPet.create({
    data: {
      name: "Bella",
      dateOfBirth: new Date("2018-09-12"),
      description: "Berger Allemand protecteur",
      activity: 8,
      clientId: client3.id,
      raceId: germanShepherd.id,
      attendingVeterinarianId: vet1.id,
    },
  });

  console.log("✅ Client Pets created");

  // ============================================
  // CRÉER DES STOCKS EN CLINIQUE
  // ============================================
  await prisma.clinicProduct.create({
    data: {
      stock: 50,
      minimumRequired: 10,
      clinicId: vet1Client.id,
      productId: product1.id,
    },
  });

  await prisma.clinicProduct.create({
    data: {
      stock: 30,
      minimumRequired: 15,
      clinicId: vet1Client.id,
      productId: product2.id,
    },
  });

  await prisma.clinicProduct.create({
    data: {
      stock: 25,
      minimumRequired: 10,
      clinicId: vet2Client.id,
      productId: product3.id,
    },
  });

  console.log("✅ Clinic Products created");

  // ============================================
  // CRÉER DES RENDEZ-VOUS (METTINGS)
  // ============================================
  const meeting1 = await prisma.metting.create({
    data: {
      date: new Date("2026-02-10T10:00:00"),
      duration: 0.5, // 30 minutes
      description: "Consultation de routine",
      petWeight: 30,
      petSize: 60,
      clientPetId: pet1.id,
      veterinarianId: vet1.id,
    },
  });

  const meeting2 = await prisma.metting.create({
    data: {
      date: new Date("2026-02-12T14:00:00"),
      duration: 0.75, // 45 minutes
      description: "Vaccination annuelle",
      petWeight: 4,
      petSize: 25,
      clientPetId: pet2.id,
      veterinarianId: vet2.id,
    },
  });

  const meeting3 = await prisma.metting.create({
    data: {
      date: new Date("2026-02-15T09:00:00"),
      duration: 1, // 1 heure
      description: "Contrôle post-opératoire",
      petWeight: 32,
      petSize: 65,
      clientPetId: pet3.id,
      veterinarianId: vet1.id,
    },
  });

  console.log("✅ Meetings created");

  // ============================================
  // CRÉER DES VACCINATIONS
  // ============================================
  await prisma.personalPetVaccine.create({
    data: {
      clientPetId: pet1.id,
      vaccineId: rabiesVaccine.id,
      mettingId: meeting1.id,
    },
  });

  await prisma.personalPetVaccine.create({
    data: {
      clientPetId: pet1.id,
      vaccineId: parvoVaccine.id,
      mettingId: meeting1.id,
    },
  });

  await prisma.personalPetVaccine.create({
    data: {
      clientPetId: pet2.id,
      vaccineId: felineLeukemiaVaccine.id,
      mettingId: meeting2.id,
    },
  });

  await prisma.personalPetVaccine.create({
    data: {
      clientPetId: pet2.id,
      vaccineId: typhusVaccine.id,
      mettingId: meeting2.id,
    },
  });

  await prisma.personalPetVaccine.create({
    data: {
      clientPetId: pet3.id,
      vaccineId: rabiesVaccine.id,
      mettingId: meeting3.id,
    },
  });

  console.log("✅ Personal Pet Vaccines created");

  // ============================================
  // CRÉER DES PLANS ALIMENTAIRES
  // ============================================
  await prisma.foodPet.create({
    data: {
      type: FoodPetDay.MONDAY,
      dateStart: new Date("2026-01-01"),
      quantity: 200, // grammes
      hours: new Date("2026-01-01T08:00:00"),
      foodId: product1.Food!.id,
      clientPetId: pet1.id,
    },
  });

  await prisma.foodPet.create({
    data: {
      type: FoodPetDay.MONDAY,
      dateStart: new Date("2026-01-01"),
      quantity: 200,
      hours: new Date("2026-01-01T18:00:00"),
      foodId: product1.Food!.id,
      clientPetId: pet1.id,
    },
  });

  await prisma.foodPet.create({
    data: {
      type: FoodPetDay.TUESDAY,
      dateStart: new Date("2026-01-01"),
      quantity: 150,
      hours: new Date("2026-01-01T09:00:00"),
      foodId: product2.Food!.id,
      clientPetId: pet2.id,
    },
  });

  await prisma.foodPet.create({
    data: {
      type: FoodPetDay.TUESDAY,
      dateStart: new Date("2026-01-01"),
      quantity: 150,
      hours: new Date("2026-01-01T19:00:00"),
      foodId: product2.Food!.id,
      clientPetId: pet2.id,
    },
  });

  await prisma.foodPet.create({
    data: {
      type: FoodPetDay.WEDNESDAY,
      dateStart: new Date("2026-01-01"),
      quantity: 250,
      hours: new Date("2026-01-01T07:30:00"),
      foodId: product1.Food!.id,
      clientPetId: pet3.id,
    },
  });

  console.log("✅ Food Pets created");

  // ============================================
  // RÉSUMÉ
  // ============================================
  console.log("\n🎉 Seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log("  - 1 Admin");
  console.log("  - 2 Clinics");
  console.log("  - 2 Veterinarians");
  console.log("  - 1 Secretary");
  console.log("  - 3 Clients");
  console.log("  - 5 Pets");
  console.log("  - 3 Brands");
  console.log("  - 3 Food Products");
  console.log("  - 2 Pet Species (Dog, Cat)");
  console.log("  - 6 Races");
  console.log("  - 4 Vaccines");
  console.log("  - 3 Meetings");
  console.log("  - 5 Vaccinations");
  console.log("  - 5 Food Plans");
  console.log("\n🔑 Login credentials:");
  console.log("  Email: admin@vetclinic.com");
  console.log("  Email: dr.smith@vetclinic.com");
  console.log("  Email: john.doe@email.com");
  console.log("  Password (all): password123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
