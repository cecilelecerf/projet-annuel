import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});
async function main() {
  console.log("🌱 Seeding database...");

  // ============================================================
  // CLEANUP
  // ============================================================
  await prisma.message_read.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation_member.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.food_health_condition.deleteMany();
  await prisma.owned_pet_health_condition.deleteMany();
  await prisma.health_condition.deleteMany();
  await prisma.owned_pet_vaccine.deleteMany();
  await prisma.foodPet.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.clinicProduct.deleteMany();
  await prisma.food.deleteMany();
  await prisma.products.deleteMany();
  await prisma.brands.deleteMany();
  await prisma.mettings.deleteMany();
  await prisma.owned_pet.deleteMany();
  await prisma.veterinarian_clinic_average.deleteMany();
  await prisma.veterinarian_clinic.deleteMany();
  await prisma.veterinarian_speciality.deleteMany();
  await prisma.clinic_speciality.deleteMany();
  await prisma.veterinarian_pet.deleteMany();
  await prisma.clinic_pet.deleteMany();
  await prisma.speciality.deleteMany();
  await prisma.vaccines.deleteMany();
  await prisma.races.deleteMany();
  await prisma.pets.deleteMany();
  await prisma.director_clinic_profiles.deleteMany();
  await prisma.referent_clinic_profiles.deleteMany();
  await prisma.secretary_profiles.deleteMany();
  await prisma.veterinarian_profiles.deleteMany();
  await prisma.client_profiles.deleteMany();
  await prisma.refresh_tokens.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.users.deleteMany();

  const password = await bcrypt.hash("Password123!", 10);

  // ============================================================
  // CLINICS
  // ============================================================
  const clinic1 = await prisma.clinic.create({
    data: {
      id: "clinic-1",
      name: "Clinique Vétérinaire du Parc",
      address: "12 Avenue du Parc",
      siret: "12345678901234",
      phone: "01 23 45 67 89",
      description: "Clinique généraliste et spécialisée en cardiologie",
      website: "https://vetparc.fr",
    },
  });

  const clinic2 = await prisma.clinic.create({
    data: {
      id: "clinic-2",
      name: "Cabinet Vétérinaire Saint-Michel",
      address: "5 Rue Saint-Michel",
      siret: "98765432109876",
      phone: "01 98 76 54 32",
      description: "Clinique généraliste",
      website: "https://vetsaintmichel.fr",
    },
  });

  // ============================================================
  // USERS
  // ============================================================

  // Super admin
  const adminUser = await prisma.users.create({
    data: {
      id: "user-admin",
      email: "admin@cecoule.fr",
      firstname: "Super",
      lastname: "Admin",
      password,
      role: "ADMIN",
    },
  });

  // Directeur clinique 1
  const directorUser1 = await prisma.users.create({
    data: {
      id: "user-director-1",
      email: "directeur@vetparc.fr",
      firstname: "Jean",
      lastname: "Martin",
      password,
      role: "CLINIC",
    },
  });

  // Directeur clinique 2
  const directorUser2 = await prisma.users.create({
    data: {
      id: "user-director-2",
      email: "directeur@vetsaintmichel.fr",
      firstname: "Marie",
      lastname: "Dupont",
      password,
      role: "CLINIC",
    },
  });

  // Référant clinique 1
  const referentUser1 = await prisma.users.create({
    data: {
      id: "user-referent-1",
      email: "referent@vetparc.fr",
      firstname: "Sophie",
      lastname: "Bernard",
      password,
      role: "CLINIC",
    },
  });

  // Vétérinaires
  const vetoUser1 = await prisma.users.create({
    data: {
      id: "user-veto-1",
      email: "dr.leroy@vetparc.fr",
      firstname: "Pierre",
      lastname: "Leroy",
      password,
      role: "VETERINARIAN",
    },
  });

  const vetoUser2 = await prisma.users.create({
    data: {
      id: "user-veto-2",
      email: "dr.moreau@vetparc.fr",
      firstname: "Claire",
      lastname: "Moreau",
      password,
      role: "VETERINARIAN",
    },
  });

  const vetoUser3 = await prisma.users.create({
    data: {
      id: "user-veto-3",
      email: "dr.garcia@vetsaintmichel.fr",
      firstname: "Lucas",
      lastname: "Garcia",
      password,
      role: "VETERINARIAN",
    },
  });

  // Secrétaires
  const secretaryUser1 = await prisma.users.create({
    data: {
      id: "user-secretary-1",
      email: "secretaire@vetparc.fr",
      firstname: "Lucie",
      lastname: "Petit",
      password,
      role: "SECRETARY",
    },
  });

  // Clients
  const clientUser1 = await prisma.users.create({
    data: {
      id: "user-client-1",
      email: "alice.durand@email.fr",
      firstname: "Alice",
      lastname: "Durand",
      password,
      role: "CLIENT",
    },
  });

  const clientUser2 = await prisma.users.create({
    data: {
      id: "user-client-2",
      email: "thomas.blanc@email.fr",
      firstname: "Thomas",
      lastname: "Blanc",
      password,
      role: "CLIENT",
    },
  });

  // ============================================================
  // PROFILES
  // ============================================================

  await prisma.director_clinic_profiles.create({
    data: { id: "director-1", userId: directorUser1.id, clinicId: clinic1.id },
  });

  await prisma.director_clinic_profiles.create({
    data: { id: "director-2", userId: directorUser2.id, clinicId: clinic2.id },
  });

  await prisma.referent_clinic_profiles.create({
    data: { id: "referent-1", userId: referentUser1.id, clinicId: clinic1.id },
  });

  const vetProfile1 = await prisma.veterinarian_profiles.create({
    data: {
      id: "veto-profile-1",
      licenseNumber: "VET-001",
      yearsExperience: 10,
      bio: "Spécialiste en cardiologie animale",
      userId: vetoUser1.id,
    },
  });

  const vetProfile2 = await prisma.veterinarian_profiles.create({
    data: {
      id: "veto-profile-2",
      licenseNumber: "VET-002",
      yearsExperience: 5,
      bio: "Généraliste avec expertise en dermatologie",
      userId: vetoUser2.id,
    },
  });

  const vetProfile3 = await prisma.veterinarian_profiles.create({
    data: {
      id: "veto-profile-3",
      licenseNumber: "VET-003",
      yearsExperience: 8,
      bio: "Généraliste",
      userId: vetoUser3.id,
    },
  });

  await prisma.secretary_profiles.create({
    data: {
      id: "secretary-1",
      userId: secretaryUser1.id,
      clinicId: clinic1.id,
    },
  });

  const clientProfile1 = await prisma.client_profiles.create({
    data: {
      id: "client-1",
      dateOfBirth: new Date("1990-05-15"),
      address: "3 Rue des Lilas, Paris",
      phone: "06 12 34 56 78",
      userId: clientUser1.id,
    },
  });

  const clientProfile2 = await prisma.client_profiles.create({
    data: {
      id: "client-2",
      dateOfBirth: new Date("1985-11-20"),
      address: "8 Boulevard Victor Hugo, Lyon",
      phone: "07 98 76 54 32",
      userId: clientUser2.id,
    },
  });

  // ============================================================
  // PETS & RACES
  // ============================================================
  const petDog = await prisma.pets.create({
    data: { id: "pet-dog", name: "Chien" },
  });

  const petCat = await prisma.pets.create({
    data: { id: "pet-cat", name: "Chat" },
  });

  const petRabbit = await prisma.pets.create({
    data: { id: "pet-rabbit", name: "Lapin" },
  });

  const raceLab = await prisma.races.create({
    data: { id: "race-labrador", name: "Labrador", petId: petDog.id },
  });

  const raceGolden = await prisma.races.create({
    data: { id: "race-golden", name: "Golden Retriever", petId: petDog.id },
  });

  const racePersan = await prisma.races.create({
    data: { id: "race-persan", name: "Persan", petId: petCat.id },
  });

  const raceEuropeen = await prisma.races.create({
    data: { id: "race-europeen", name: "Européen", petId: petCat.id },
  });

  // ============================================================
  // SPECIALITIES
  // ============================================================
  const specCardio = await prisma.speciality.create({
    data: {
      id: "spec-cardio",
      name: "Cardiologie",
      description: "Maladies cardiaques et vasculaires",
    },
  });

  const specDerma = await prisma.speciality.create({
    data: {
      id: "spec-derma",
      name: "Dermatologie",
      description: "Maladies de la peau et du pelage",
    },
  });

  const specChirurgie = await prisma.speciality.create({
    data: {
      id: "spec-chirurgie",
      name: "Chirurgie",
      description: "Interventions chirurgicales",
    },
  });

  // ============================================================
  // VETERINARIAN <-> CLINIC
  // ============================================================
  const vetoClinic1 = await prisma.veterinarian_clinic.create({
    data: {
      id: "vc-1",
      veterinarian_id: vetProfile1.id,
      clinic_id: clinic1.id,
    },
  });

  const vetoClinic2 = await prisma.veterinarian_clinic.create({
    data: {
      id: "vc-2",
      veterinarian_id: vetProfile2.id,
      clinic_id: clinic1.id,
    },
  });

  // Veto1 travaille aussi en clinique 2 (sans cardio)
  const vetoClinic3 = await prisma.veterinarian_clinic.create({
    data: {
      id: "vc-3",
      veterinarian_id: vetProfile1.id,
      clinic_id: clinic2.id,
    },
  });

  const vetoClinic4 = await prisma.veterinarian_clinic.create({
    data: {
      id: "vc-4",
      veterinarian_id: vetProfile3.id,
      clinic_id: clinic2.id,
    },
  });

  // Disponibilités
  await prisma.veterinarian_clinic_average.createMany({
    data: [
      // Veto1 en clinique1 : lundi et mercredi matin
      {
        id: "avail-1",
        type: "RECURRING",
        day_of_week: 1,
        start_time: "08:00",
        end_time: "12:00",
        veterinarian_clinic_id: vetoClinic1.id,
      },
      {
        id: "avail-2",
        type: "RECURRING",
        day_of_week: 3,
        start_time: "14:00",
        end_time: "18:00",
        veterinarian_clinic_id: vetoClinic1.id,
      },
      // Veto1 : jour spécifique
      {
        id: "avail-3",
        type: "SPECIFIED",
        specific_date: new Date("2026-03-15"),
        start_time: "09:00",
        end_time: "17:00",
        veterinarian_clinic_id: vetoClinic1.id,
      },
      // Veto2 en clinique1 : mardi et jeudi
      {
        id: "avail-4",
        type: "RECURRING",
        day_of_week: 2,
        start_time: "09:00",
        end_time: "13:00",
        veterinarian_clinic_id: vetoClinic2.id,
      },
      {
        id: "avail-5",
        type: "RECURRING",
        day_of_week: 4,
        start_time: "09:00",
        end_time: "18:00",
        veterinarian_clinic_id: vetoClinic2.id,
      },
    ],
  });

  // ============================================================
  // SPECIALITIES <-> VETO & CLINIC
  // ============================================================

  // Veto1 est cardiologue et chirurgien
  await prisma.veterinarian_speciality.createMany({
    data: [
      {
        id: "vs-1",
        veterinarian_id: vetProfile1.id,
        speciality_id: specCardio.id,
      },
      {
        id: "vs-2",
        veterinarian_id: vetProfile1.id,
        speciality_id: specChirurgie.id,
      },
      {
        id: "vs-3",
        veterinarian_id: vetProfile2.id,
        speciality_id: specDerma.id,
      },
    ],
  });

  // Clinique1 a cardio et chirurgie, clinique2 seulement chirurgie
  await prisma.clinic_speciality.createMany({
    data: [
      { id: "cs-1", clinic_id: clinic1.id, speciality_id: specCardio.id },
      { id: "cs-2", clinic_id: clinic1.id, speciality_id: specChirurgie.id },
      { id: "cs-3", clinic_id: clinic1.id, speciality_id: specDerma.id },
      { id: "cs-4", clinic_id: clinic2.id, speciality_id: specChirurgie.id },
      // clinic2 n'a PAS cardio → veto1 ne peut pas faire cardio là-bas
    ],
  });

  // Espèces par veto et clinique
  await prisma.veterinarian_pet.createMany({
    data: [
      { id: "vp-1", veterinarian_id: vetProfile1.id, pet_id: petDog.id },
      { id: "vp-2", veterinarian_id: vetProfile1.id, pet_id: petCat.id },
      { id: "vp-3", veterinarian_id: vetProfile2.id, pet_id: petDog.id },
      { id: "vp-4", veterinarian_id: vetProfile2.id, pet_id: petCat.id },
      { id: "vp-5", veterinarian_id: vetProfile3.id, pet_id: petDog.id },
      { id: "vp-6", veterinarian_id: vetProfile3.id, pet_id: petCat.id },
      { id: "vp-7", veterinarian_id: vetProfile3.id, pet_id: petRabbit.id },
    ],
  });

  await prisma.clinic_pet.createMany({
    data: [
      { id: "cp-1", clinic_id: clinic1.id, pet_id: petDog.id },
      { id: "cp-2", clinic_id: clinic1.id, pet_id: petCat.id },
      { id: "cp-3", clinic_id: clinic2.id, pet_id: petDog.id },
      { id: "cp-4", clinic_id: clinic2.id, pet_id: petCat.id },
      { id: "cp-5", clinic_id: clinic2.id, pet_id: petRabbit.id },
    ],
  });

  // ============================================================
  // OWNED PETS
  // ============================================================
  const ownedPet1 = await prisma.owned_pet.create({
    data: {
      id: "op-1",
      name: "Rex",
      dateOfBirth: new Date("2020-03-10"),
      activity: 8,
      clientId: clientProfile1.id,
      raceId: raceLab.id,
      attendingVeterinarianId: vetProfile1.id,
    },
  });

  const ownedPet2 = await prisma.owned_pet.create({
    data: {
      id: "op-2",
      name: "Luna",
      dateOfBirth: new Date("2021-07-22"),
      activity: 5,
      clientId: clientProfile1.id,
      raceId: racePersan.id,
    },
  });

  const ownedPet3 = await prisma.owned_pet.create({
    data: {
      id: "op-3",
      name: "Max",
      dateOfBirth: new Date("2019-01-15"),
      activity: 6,
      clientId: clientProfile2.id,
      raceId: raceGolden.id,
      attendingVeterinarianId: vetProfile2.id,
    },
  });

  // ============================================================
  // VACCINES
  // ============================================================
  const vaccineRage = await prisma.vaccines.create({
    data: {
      id: "vacc-rage",
      name: "Rage",
      description: "Vaccin antirabique obligatoire",
      recommendedAge: 12,
      boosterInterval: 52,
      mandatoryCountry: ["FR", "BE", "CH"],
      petId: petDog.id,
    },
  });

  const vaccineCHPPi = await prisma.vaccines.create({
    data: {
      id: "vacc-chppi",
      name: "CHPPi",
      description: "Maladie de Carré, Hépatite, Parvovirose, Parainfluenza",
      recommendedAge: 8,
      boosterInterval: 52,
      petId: petDog.id,
    },
  });

  const vaccineTyphus = await prisma.vaccines.create({
    data: {
      id: "vacc-typhus",
      name: "Typhus",
      description: "Panleucopénie féline",
      recommendedAge: 8,
      boosterInterval: 52,
      petId: petCat.id,
    },
  });

  // ============================================================
  // HEALTH CONDITIONS
  // ============================================================
  const conditionRenal = await prisma.health_condition.create({
    data: {
      id: "hc-1",
      name: "Insuffisance rénale",
      description: "Réduction de la fonction rénale",
      petId: petDog.id,
    },
  });

  const conditionDiabete = await prisma.health_condition.create({
    data: {
      id: "hc-2",
      name: "Diabète",
      description: "Trouble de la régulation du glucose",
      petId: null,
    },
  });

  const conditionCardio = await prisma.health_condition.create({
    data: {
      id: "hc-3",
      name: "Insuffisance cardiaque",
      description: "Réduction de la fonction cardiaque",
      petId: petDog.id,
    },
  });

  // ============================================================
  // MEETINGS
  // ============================================================
  const meeting1 = await prisma.mettings.create({
    data: {
      id: "meeting-1",
      date: new Date("2026-02-10T09:00:00"),
      duration: 30,
      description: "Consultation de routine",
      petWeight: 28,
      petSize: 58,
      ownedPetId: ownedPet1.id,
      veterinarianId: vetProfile1.id,
      specialityId: specCardio.id,
      report:
        "Rex présente un souffle cardiaque léger. Surveillance recommandée.",
    },
  });

  const meeting2 = await prisma.mettings.create({
    data: {
      id: "meeting-2",
      date: new Date("2026-03-05T14:00:00"),
      duration: 20,
      description: "Problème de peau",
      petWeight: 4,
      petSize: 32,
      ownedPetId: ownedPet2.id,
      veterinarianId: vetProfile2.id,
      specialityId: specDerma.id,
    },
  });

  const meeting3 = await prisma.mettings.create({
    data: {
      id: "meeting-3",
      date: new Date("2026-04-01T10:00:00"),
      duration: 30,
      ownedPetId: ownedPet3.id,
      veterinarianId: vetProfile2.id,
      specialityId: specDerma.id,
    },
  });

  // ============================================================
  // OWNED PET HEALTH CONDITIONS
  // ============================================================
  await prisma.owned_pet_health_condition.create({
    data: {
      id: "ophc-1",
      notes: "Diagnostiqué lors de la consultation du 10 février",
      diagnosedAt: new Date("2026-02-10"),
      healthConditionId: conditionCardio.id,
      ownedPetId: ownedPet1.id,
      mettingId: meeting1.id,
      addedById: vetoUser1.id,
    },
  });

  await prisma.owned_pet_health_condition.create({
    data: {
      id: "ophc-2",
      notes: "Déclaré par le propriétaire, à confirmer",
      diagnosedAt: new Date("2026-01-15"),
      healthConditionId: conditionRenal.id,
      ownedPetId: ownedPet3.id,
      addedById: clientUser2.id,
    },
  });

  // ============================================================
  // OWNED PET VACCINES
  // ============================================================
  await prisma.owned_pet_vaccine.createMany({
    data: [
      {
        id: "opv-1",
        ownedPetId: ownedPet1.id,
        vaccineId: vaccineRage.id,
        mettingId: meeting1.id,
      },
      { id: "opv-2", ownedPetId: ownedPet1.id, vaccineId: vaccineCHPPi.id },
      { id: "opv-3", ownedPetId: ownedPet2.id, vaccineId: vaccineTyphus.id },
    ],
  });

  // ============================================================
  // BRANDS & PRODUCTS & FOOD
  // ============================================================
  const brandRoyal = await prisma.brands.create({
    data: {
      id: "brand-1",
      name: "Royal Canin",
      logo: "https://royalcanin.com/logo.png",
    },
  });

  const brandHills = await prisma.brands.create({
    data: {
      id: "brand-2",
      name: "Hill's",
      logo: "https://hillspet.com/logo.png",
    },
  });

  const productKibble1 = await prisma.products.create({
    data: {
      id: "product-1",
      name: "Royal Canin Cardiac",
      qrCode: "RC-CARDIAC-001",
      brandId: brandRoyal.id,
      description: "Croquettes spéciales insuffisance cardiaque",
    },
  });

  const productKibble2 = await prisma.products.create({
    data: {
      id: "product-2",
      name: "Hill's Renal",
      qrCode: "HILLS-RENAL-001",
      brandId: brandHills.id,
      description: "Croquettes pour insuffisance rénale",
    },
  });

  const productKibble3 = await prisma.products.create({
    data: {
      id: "product-3",
      name: "Royal Canin Adult",
      qrCode: "RC-ADULT-001",
      brandId: brandRoyal.id,
      description: "Croquettes adulte standard",
    },
  });

  const food1 = await prisma.food.create({
    data: {
      id: "food-1",
      caloriesPer100: 370,
      proteinPer100: 25.5,
      fatPercentage: 14.0,
      fiberPercentage: 5.5,
      moisturePercentage: 8.0,
      type: "KIBBLE",
      productId: productKibble1.id,
    },
  });

  const food2 = await prisma.food.create({
    data: {
      id: "food-2",
      caloriesPer100: 340,
      proteinPer100: 18.0,
      fatPercentage: 11.0,
      fiberPercentage: 6.0,
      moisturePercentage: 8.5,
      type: "KIBBLE",
      productId: productKibble2.id,
    },
  });

  const food3 = await prisma.food.create({
    data: {
      id: "food-3",
      caloriesPer100: 385,
      proteinPer100: 27.0,
      fatPercentage: 16.0,
      fiberPercentage: 4.5,
      moisturePercentage: 8.0,
      type: "KIBBLE",
      productId: productKibble3.id,
    },
  });

  // Food <-> health conditions
  await prisma.food_health_condition.createMany({
    data: [
      {
        id: "fhc-1",
        foodId: food1.id,
        healthConditionId: conditionCardio.id,
        recommendation: "RECOMMENDED",
      },
      {
        id: "fhc-2",
        foodId: food2.id,
        healthConditionId: conditionRenal.id,
        recommendation: "RECOMMENDED",
      },
      {
        id: "fhc-3",
        foodId: food3.id,
        healthConditionId: conditionCardio.id,
        recommendation: "AVOID",
      },
      {
        id: "fhc-4",
        foodId: food3.id,
        healthConditionId: conditionRenal.id,
        recommendation: "AVOID",
      },
    ],
  });

  // Pet food schedule
  await prisma.food_pet.createMany({
    data: [
      // Rex mange du Royal Canin Cardiac tous les jours (0=lundi à 6=dimanche)
      {
        id: "fp-1",
        day: 1,
        dateStart: new Date("2026-02-10"),
        quantity: 280,
        hours: new Date("1970-01-01T08:00:00Z"),
        foodId: food1.id,
        ownedPetId: ownedPet1.id,
      },
      {
        id: "fp-2",
        day: 1,
        dateStart: new Date("2026-02-10"),
        quantity: 280,
        hours: new Date("1970-01-01T18:00:00Z"),
        foodId: food1.id,
        ownedPetId: ownedPet1.id,
      },
    ],
  });

  // ============================================================
  // CLINIC PRODUCTS
  // ============================================================
  const cp1 = await prisma.clinic_products.create({
    data: {
      id: "clinprod-1",
      stock: 50,
      minimumRequired: 10,
      price: 65.9,
      clinicId: clinic1.id,
      productId: productKibble1.id,
    },
  });

  const cp2 = await prisma.clinic_products.create({
    data: {
      id: "clinprod-2",
      stock: 30,
      minimumRequired: 5,
      price: 58.5,
      clinicId: clinic1.id,
      productId: productKibble2.id,
    },
  });

  const cp3 = await prisma.clinic_products.create({
    data: {
      id: "clinprod-3",
      stock: 3,
      minimumRequired: 10,
      price: 45.0,
      clinicId: clinic2.id,
      productId: productKibble3.id,
    },
  });

  // ============================================================
  // ORDERS
  // ============================================================
  const order1 = await prisma.order.create({
    data: {
      id: "order-1",
      status: "CONFIRMED",
      pickupAt: new Date("2026-02-25T10:00:00"),
      client_id: clientProfile1.id,
      clinic_id: clinic1.id,
    },
  });

  await prisma.order_item.create({
    data: {
      id: "oi-1",
      quantity: 2,
      unit_price: 65.9,
      product_clinic_id: cp1.id,
      order_id: order1.id,
    },
  });

  // ============================================================
  // MESSAGING
  // ============================================================

  // Groupe clinique1 (tous les membres de la clinique)
  const conv1 = await prisma.conversation.create({
    data: {
      id: "conv-1",
      name: "Équipe Clinique du Parc",
    },
  });

  const member1 = await prisma.conversation_member.create({
    data: {
      id: "cm-1",
      role: "ADMIN",
      userId: vetoUser1.id,
      conversationId: conv1.id,
    },
  });

  const member2 = await prisma.conversation_member.create({
    data: {
      id: "cm-2",
      role: "MEMBER",
      userId: vetoUser2.id,
      conversationId: conv1.id,
    },
  });

  const member3 = await prisma.conversation_member.create({
    data: {
      id: "cm-3",
      role: "MEMBER",
      userId: secretaryUser1.id,
      conversationId: conv1.id,
    },
  });

  // Messages
  const msg1 = await prisma.message.create({
    data: {
      id: "msg-1",
      content: "Bonjour à tous ! Réunion demain à 8h30.",
      conversationId: conv1.id,
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      id: "msg-2",
      content: "Reçu, je serai là !",
      conversationId: conv1.id,
    },
  });

  // Message reads
  await prisma.message_read.createMany({
    data: [
      {
        id: "mr-1",
        readAt: new Date(),
        messageId: msg1.id,
        readById: member1.id,
      },
      {
        id: "mr-2",
        readAt: new Date(),
        messageId: msg1.id,
        readById: member2.id,
      },
      {
        id: "mr-3",
        readAt: new Date(),
        messageId: msg2.id,
        readById: member1.id,
      },
    ],
  });

  console.log("✅ Seed terminé avec succès !");
  console.log("\n📋 Comptes créés :");
  console.log("  Admin      : admin@cecoule.fr / Password123!");
  console.log("  Directeur  : directeur@vetparc.fr / Password123!");
  console.log("  Référant   : referent@vetparc.fr / Password123!");
  console.log("  Véto 1     : dr.leroy@vetparc.fr / Password123!");
  console.log("  Véto 2     : dr.moreau@vetparc.fr / Password123!");
  console.log("  Véto 3     : dr.garcia@vetsaintmichel.fr / Password123!");
  console.log("  Secrétaire : secretaire@vetparc.fr / Password123!");
  console.log("  Client 1   : alice.durand@email.fr / Password123!");
  console.log("  Client 2   : thomas.blanc@email.fr / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
