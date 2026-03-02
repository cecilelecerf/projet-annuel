import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient } from "./generated/prisma/client";

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================================
  // CLEANUP (ordre inverse des dépendances)
  // ============================================================
  await prisma.messageRead.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.foodHealthCondition.deleteMany();
  await prisma.ownedPetHealthCondition.deleteMany();
  await prisma.healthCondition.deleteMany();
  await prisma.ownedPetVaccine.deleteMany();
  await prisma.foodPet.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.clinicProduct.deleteMany();
  await prisma.food.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.animalMetting.deleteMany();
  await prisma.internalMettingParticipant.deleteMany();
  await prisma.internalMetting.deleteMany();
  await prisma.veterinarianClinicAvailability.deleteMany();
  await prisma.mettingBase.deleteMany();
  await prisma.ownedPet.deleteMany();
  await prisma.veterinarianClinic.deleteMany();
  await prisma.speciality.deleteMany();
  await prisma.vaccine.deleteMany();
  await prisma.race.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.directorClinicProfile.deleteMany();
  await prisma.referentClinicProfile.deleteMany();
  await prisma.secretaryProfile.deleteMany();
  await prisma.veterinarianProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.user.deleteMany();

  const password = await hash("Password123!", 10);

  // ============================================================
  // CLINICS
  // ============================================================
  const clinic1 = await prisma.clinic.create({
    data: {
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
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      firstname: "Super",
      lastname: "Admin",
      password,
      role: "ADMIN",
    },
  });

  const directorUser1 = await prisma.user.create({
    data: {
      email: "directeur@gmail.com",
      firstname: "Jean",
      lastname: "Martin",
      password,
      role: "DIRECTOR",
    },
  });

  const directorUser2 = await prisma.user.create({
    data: {
      email: "directeur@vetsaintmichel.fr",
      firstname: "Marie",
      lastname: "Dupont",
      password,
      role: "DIRECTOR",
    },
  });

  const referentUser1 = await prisma.user.create({
    data: {
      email: "referent@gmail.com",
      firstname: "Sophie",
      lastname: "Bernard",
      password,
      role: "REFERANT",
    },
  });

  const vetoUser1 = await prisma.user.create({
    data: {
      email: "veto@gmail.com",
      firstname: "Pierre",
      lastname: "Leroy",
      password,
      role: "VETERINARIAN",
    },
  });

  const vetoUser2 = await prisma.user.create({
    data: {
      email: "dr.moreau@vetparc.fr",
      firstname: "Claire",
      lastname: "Moreau",
      password,
      role: "VETERINARIAN",
    },
  });

  const vetoUser3 = await prisma.user.create({
    data: {
      email: "dr.garcia@vetsaintmichel.fr",
      firstname: "Lucas",
      lastname: "Garcia",
      password,
      role: "VETERINARIAN",
    },
  });

  const secretaryUser1 = await prisma.user.create({
    data: {
      email: "secretaire@gmail.com",
      firstname: "Lucie",
      lastname: "Petit",
      password,
      role: "SECRETARY",
    },
  });

  const clientUser1 = await prisma.user.create({
    data: {
      email: "client@gmail.com",
      firstname: "Alice",
      lastname: "Durand",
      password,
      role: "CLIENT",
    },
  });

  const clientUser2 = await prisma.user.create({
    data: {
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
  await prisma.directorClinicProfile.create({
    data: { clinicId: clinic1.id, id: directorUser1.id },
  });

  await prisma.directorClinicProfile.create({
    data: { clinicId: clinic2.id, id: directorUser2.id },
  });

  await prisma.referentClinicProfile.create({
    data: { clinicId: clinic1.id, id: referentUser1.id },
  });

  const vetProfile1 = await prisma.veterinarianProfile.create({
    data: {
      licenseNumber: "VET-001",
      yearsExperience: 10,
      bio: "Spécialiste en cardiologie animale",
      id: vetoUser1.id,
    },
  });

  const vetProfile2 = await prisma.veterinarianProfile.create({
    data: {
      licenseNumber: "VET-002",
      yearsExperience: 5,
      bio: "Généraliste avec expertise en dermatologie",
      id: vetoUser2.id,
    },
  });

  const vetProfile3 = await prisma.veterinarianProfile.create({
    data: {
      licenseNumber: "VET-003",
      yearsExperience: 8,
      bio: "Généraliste",
      id: vetoUser3.id,
    },
  });

  await prisma.secretaryProfile.create({
    data: {
      clinicId: clinic1.id,
      id: secretaryUser1.id,
    },
  });

  const clientProfile1 = await prisma.clientProfile.create({
    data: {
      dateOfBirth: new Date("1990-05-15"),
      address: "3 Rue des Lilas, Paris",
      phone: "06 12 34 56 78",
      id: clientUser1.id,
    },
  });

  const clientProfile2 = await prisma.clientProfile.create({
    data: {
      dateOfBirth: new Date("1985-11-20"),
      address: "8 Boulevard Victor Hugo, Lyon",
      phone: "07 98 76 54 32",
      id: clientUser2.id,
    },
  });

  // ============================================================
  // PETS & RACES
  // ============================================================
  const petDog = await prisma.pet.create({
    data: { name: "Chien" },
  });
  const petCat = await prisma.pet.create({
    data: { name: "Chat" },
  });
  const petRabbit = await prisma.pet.create({
    data: { name: "Lapin" },
  });

  const raceLab = await prisma.race.create({
    data: { name: "Labrador", petId: petDog.id },
  });
  const raceGolden = await prisma.race.create({
    data: { name: "Golden Retriever", petId: petDog.id },
  });
  const racePersan = await prisma.race.create({
    data: { name: "Persan", petId: petCat.id },
  });
  await prisma.race.create({
    data: { name: "Européen", petId: petCat.id },
  });

  // ============================================================
  // SPECIALITIES
  // ============================================================
  const specCardio = await prisma.speciality.create({
    data: {
      name: "Cardiologie",
      description: "Maladies cardiaques et vasculaires",
    },
  });

  const specDerma = await prisma.speciality.create({
    data: {
      name: "Dermatologie",
      description: "Maladies de la peau et du pelage",
    },
  });

  await prisma.speciality.create({
    data: {
      name: "Chirurgie",
      description: "Interventions chirurgicales",
    },
  });

  // ============================================================
  // VETERINARIAN <-> CLINIC
  // ============================================================
  const vetoClinic1 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile1.id, clinicId: clinic1.id },
  });

  const vetoClinic2 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile2.id, clinicId: clinic1.id },
  });

  await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile1.id, clinicId: clinic2.id },
  });

  await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile3.id, clinicId: clinic2.id },
  });

  // ============================================================
  // METTING BASES — DISPONIBILITÉS VÉTO
  // ============================================================

  // Veto1 clinic1 — RECURRING lundi matin
  const baseAvail1 = await prisma.mettingBase.create({
    data: {
      type: "RECURRING",
      dayOfWeek: 1,
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T12:00:00Z"),
      kind: "AVAILABILITY",
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-06-30"),
      availabilty: {
        create: {
          veterinarianClinicId: vetoClinic1.id,
          contextType: "VETERINARIAN_CLINIC",
        },
      },
    },
  });

  // Veto1 clinic1 — RECURRING mercredi après-midi
  await prisma.mettingBase.create({
    data: {
      type: "RECURRING",
      dayOfWeek: 3,
      startTime: new Date("1970-01-01T14:00:00Z"),
      endTime: new Date("1970-01-01T18:00:00Z"),
      kind: "AVAILABILITY",
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-06-30"),
      availabilty: {
        create: {
          veterinarianClinicId: vetoClinic1.id,
          contextType: "VETERINARIAN_CLINIC",
        },
      },
    },
  });

  // Veto1 clinic1 — EXCEPTION : absent le lundi 9 mars (annule base-avail-1)
  await prisma.mettingBase.create({
    data: {
      type: "EXCEPTION",
      specificDate: new Date("2026-03-09"),
      parentId: baseAvail1.id,
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          veterinarianClinicId: vetoClinic1.id,
          contextType: "VETERINARIAN_CLINIC",
        },
      },
    },
  });

  // Veto1 clinic1 — SPECIFIED : dispo exceptionnellement le 15 mars
  await prisma.mettingBase.create({
    data: {
      type: "SPECIFIED",
      specificDate: new Date("2026-03-15"),
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T17:00:00Z"),
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          veterinarianClinicId: vetoClinic1.id,
          contextType: "VETERINARIAN_CLINIC",
        },
      },
    },
  });

  // Veto2 clinic1 — RECURRING mardi matin
  await prisma.mettingBase.create({
    data: {
      type: "RECURRING",
      dayOfWeek: 2,
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T13:00:00Z"),
      kind: "AVAILABILITY",
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-06-30"),
      availabilty: {
        create: {
          veterinarianClinicId: vetoClinic2.id,
          contextType: "VETERINARIAN_CLINIC",
        },
      },
    },
  });

  // Veto2 clinic1 — RECURRING jeudi journée
  await prisma.mettingBase.create({
    data: {
      type: "RECURRING",
      dayOfWeek: 4,
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T18:00:00Z"),
      kind: "AVAILABILITY",
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-06-30"),
      availabilty: {
        create: {
          veterinarianClinicId: vetoClinic2.id,
          contextType: "VETERINARIAN_CLINIC",
        },
      },
    },
  });

  // ============================================================
  // AVAILABILITIES — SECRÉTAIRE
  // ============================================================

  // Secrétaire — RECURRING lundi 08h-17h
  const baseSecAvail1 = await prisma.mettingBase.create({
    data: {
      type: "RECURRING",
      dayOfWeek: 1,
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T17:00:00Z"),
      kind: "AVAILABILITY",
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-06-30"),
      availabilty: {
        create: {
          contextType: "USER",
          userId: secretaryUser1.id,
        },
      },
    },
  });

  // Secrétaire — RECURRING mardi 08h-17h
  await prisma.mettingBase.create({
    data: {
      type: "RECURRING",
      dayOfWeek: 2,
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T17:00:00Z"),
      kind: "AVAILABILITY",
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-06-30"),
      availabilty: {
        create: {
          contextType: "USER",
          userId: secretaryUser1.id,
        },
      },
    },
  });

  // Secrétaire — SPECIFIED : dispo exceptionnellement le mercredi 15 avril
  await prisma.mettingBase.create({
    data: {
      type: "SPECIFIED",
      specificDate: new Date("2026-04-15"),
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T14:00:00Z"),
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          contextType: "USER",
          userId: secretaryUser1.id,
        },
      },
    },
  });

  // Secrétaire — EXCEPTION : absente le lundi 23 mars malgré le RECURRING
  await prisma.mettingBase.create({
    data: {
      type: "EXCEPTION",
      specificDate: new Date("2026-03-23"),
      parentId: baseSecAvail1.id,
      kind: "AVAILABILITY",
      availabilty: {
        create: {
          contextType: "USER",
          userId: secretaryUser1.id,
        },
      },
    },
  });

  // ============================================================
  // OWNED PETS
  // ============================================================
  const ownedPet1 = await prisma.ownedPet.create({
    data: {
      name: "Rex",
      dateOfBirth: new Date("2020-03-10"),
      activity: 8,
      clientId: clientProfile1.id,
      raceId: raceLab.id,
      attendingVeterinarianId: vetProfile1.id,
    },
  });

  const ownedPet2 = await prisma.ownedPet.create({
    data: {
      name: "Luna",
      dateOfBirth: new Date("2021-07-22"),
      activity: 5,
      clientId: clientProfile1.id,
      raceId: racePersan.id,
    },
  });

  const ownedPet3 = await prisma.ownedPet.create({
    data: {
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
  const vaccineRage = await prisma.vaccine.create({
    data: {
      name: "Rage",
      description: "Vaccin antirabique obligatoire",
      recommendedAge: 12,
      boosterInterval: 52,
      mandatoryCountry: ["FR", "BE", "CH"],
      petId: petDog.id,
    },
  });

  const vaccineCHPPi = await prisma.vaccine.create({
    data: {
      name: "CHPPi",
      description: "Maladie de Carré, Hépatite, Parvovirose, Parainfluenza",
      recommendedAge: 8,
      boosterInterval: 52,
      petId: petDog.id,
    },
  });

  const vaccineTyphus = await prisma.vaccine.create({
    data: {
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
  const conditionRenal = await prisma.healthCondition.create({
    data: {
      name: "Insuffisance rénale",
      description: "Réduction de la fonction rénale",
      petId: petDog.id,
    },
  });

  await prisma.healthCondition.create({
    data: {
      name: "Diabète",
      description: "Trouble de la régulation du glucose",
      petId: petDog.id,
    },
  });

  const conditionCardio = await prisma.healthCondition.create({
    data: {
      name: "Insuffisance cardiaque",
      description: "Réduction de la fonction cardiaque",
      petId: petDog.id,
    },
  });

  // ============================================================
  // METTING BASES — RDV ANIMAUX
  // ============================================================

  // RDV 1 — Consultation cardiologie Rex
  const animalMeeting1 = await prisma.mettingBase.create({
    data: {
      type: "SPECIFIED",
      specificDate: new Date("2026-02-10"),
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T09:30:00Z"),
      kind: "ANIMAL",
      animalMetting: {
        create: {
          description: "Consultation de routine",
          petWeight: 28,
          petSize: 58,
          report:
            "Rex présente un souffle cardiaque léger. Surveillance recommandée.",
          specialityId: specCardio.id,
          ownedPetId: ownedPet1.id,
          veterinarianId: vetProfile1.id,
        },
      },
    },
  });

  // RDV 2 — Consultation dermatologie Luna
  const animalMeeting2 = await prisma.mettingBase.create({
    data: {
      type: "SPECIFIED",
      specificDate: new Date("2026-03-05"),
      startTime: new Date("1970-01-01T14:00:00Z"),
      endTime: new Date("1970-01-01T14:20:00Z"),
      kind: "ANIMAL",
      animalMetting: {
        create: {
          description: "Problème de peau",
          petWeight: 4,
          petSize: 32,
          specialityId: specDerma.id,
          ownedPetId: ownedPet2.id,
          veterinarianId: vetProfile2.id,
        },
      },
    },
  });

  // RDV 3 — Consultation dermatologie Max
  await prisma.mettingBase.create({
    data: {
      type: "SPECIFIED",
      specificDate: new Date("2026-04-01"),
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T10:30:00Z"),
      kind: "ANIMAL",
      animalMetting: {
        create: {
          specialityId: specDerma.id,
          ownedPetId: ownedPet3.id,
          veterinarianId: vetProfile2.id,
        },
      },
    },
  });

  // ============================================================
  // METTING BASES — RÉUNIONS INTERNES
  // ============================================================

  // Réunion RECURRING tous les lundis de 10h à 11h
  const baseInternal1 = await prisma.mettingBase.create({
    data: {
      type: "RECURRING",
      dayOfWeek: 1,
      dateStart: new Date("2026-01-01"),
      dateEnd: new Date("2026-06-30"),
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T11:00:00Z"),
      kind: "INTERNAL",
      internalMetting: {
        create: {
          title: "Réunion hebdomadaire équipe",
          description: "Point de la semaine entre tous les vétérinaires",
          clinicId: clinic1.id,
        },
      },
    },
  });

  // EXCEPTION : réunion annulée le lundi 9 mars
  await prisma.mettingBase.create({
    data: {
      type: "EXCEPTION",
      specificDate: new Date("2026-03-09"),
      parentId: baseInternal1.id,
      kind: "INTERNAL",
      internalMetting: {
        create: {
          title: "Annulation réunion du 9 mars",
          clinicId: clinic1.id,
        },
      },
    },
  });

  // Réunion SPECIFIED ponctuelle
  const baseInternal2 = await prisma.mettingBase.create({
    data: {
      type: "SPECIFIED",
      specificDate: new Date("2026-03-20"),
      startTime: new Date("1970-01-01T14:00:00Z"),
      endTime: new Date("1970-01-01T15:30:00Z"),
      kind: "INTERNAL",
      internalMetting: {
        create: {
          title: "Formation nouveaux équipements",
          description: "Présentation du nouvel équipement d'échographie",
          clinicId: clinic1.id,
        },
      },
    },
  });

  // Participants réunions internes
  await prisma.internalMettingParticipant.createMany({
    data: [
      {
        mettingId: baseInternal1.id,
        userId: vetoUser1.id,
        status: "ACCEPTED",
      },
      {
        mettingId: baseInternal1.id,
        userId: vetoUser2.id,
        status: "ACCEPTED",
      },
      {
        mettingId: baseInternal1.id,
        userId: secretaryUser1.id,
        status: "PENDING",
      },
      {
        mettingId: baseInternal2.id,
        userId: vetoUser1.id,
        status: "ACCEPTED",
      },
      {
        mettingId: baseInternal2.id,
        userId: vetoUser2.id,
        status: "DECLINED",
      },
    ],
  });

  // ============================================================
  // OWNED PET HEALTH CONDITIONS
  // ============================================================
  await prisma.ownedPetHealthCondition.create({
    data: {
      notes: "Diagnostiqué lors de la consultation du 10 février",
      diagnosedAt: new Date("2026-02-10"),
      healthConditionId: conditionCardio.id,
      ownedPetId: ownedPet1.id,
      meetingId: animalMeeting1.id,
      addedById: vetoUser1.id,
    },
  });

  await prisma.ownedPetHealthCondition.create({
    data: {
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
  await prisma.ownedPetVaccine.createMany({
    data: [
      {
        ownedPetId: ownedPet1.id,
        vaccineId: vaccineRage.id,
        meetingId: animalMeeting1.id,
      },
      { ownedPetId: ownedPet1.id, vaccineId: vaccineCHPPi.id },
      { ownedPetId: ownedPet2.id, vaccineId: vaccineTyphus.id },
    ],
  });

  // ============================================================
  // BRANDS & PRODUCTS & FOOD
  // ============================================================
  const brandRoyal = await prisma.brand.create({
    data: {
      name: "Royal Canin",
      logo: "https://royalcanin.com/logo.png",
    },
  });

  const brandHills = await prisma.brand.create({
    data: {
      name: "Hill's",
      logo: "https://hillspet.com/logo.png",
    },
  });

  const productKibble1 = await prisma.product.create({
    data: {
      name: "Royal Canin Cardiac",
      qrCode: "RC-CARDIAC-001",
      brandId: brandRoyal.id,
      description: "Croquettes spéciales insuffisance cardiaque",
    },
  });

  const productKibble2 = await prisma.product.create({
    data: {
      name: "Hill's Renal",
      qrCode: "HILLS-RENAL-001",
      brandId: brandHills.id,
      description: "Croquettes pour insuffisance rénale",
    },
  });

  const productKibble3 = await prisma.product.create({
    data: {
      name: "Royal Canin Adult",
      qrCode: "RC-ADULT-001",
      brandId: brandRoyal.id,
      description: "Croquettes adulte standard",
    },
  });

  const food1 = await prisma.food.create({
    data: {
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
      caloriesPer100: 385,
      proteinPer100: 27.0,
      fatPercentage: 16.0,
      fiberPercentage: 4.5,
      moisturePercentage: 8.0,
      type: "KIBBLE",
      productId: productKibble3.id,
    },
  });

  await prisma.foodHealthCondition.createMany({
    data: [
      {
        foodId: food1.id,
        healthConditionId: conditionCardio.id,
        recommendation: "RECOMMENDED",
      },
      {
        foodId: food2.id,
        healthConditionId: conditionRenal.id,
        recommendation: "RECOMMENDED",
      },
      {
        foodId: food3.id,
        healthConditionId: conditionCardio.id,
        recommendation: "AVOID",
      },
      {
        foodId: food3.id,
        healthConditionId: conditionRenal.id,
        recommendation: "AVOID",
      },
    ],
  });

  await prisma.foodPet.createMany({
    data: [
      {
        day: 1,
        dateStart: new Date("2026-02-10"),
        quantity: 280,
        hours: new Date("1970-01-01T08:00:00Z"),
        foodId: food1.id,
        ownedPetId: ownedPet1.id,
      },
      {
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
  const cp1 = await prisma.clinicProduct.create({
    data: {
      stock: 50,
      minimumRequired: 10,
      price: 65.9,
      clinicId: clinic1.id,
      productId: productKibble1.id,
    },
  });

  await prisma.clinicProduct.create({
    data: {
      stock: 30,
      minimumRequired: 5,
      price: 58.5,
      clinicId: clinic1.id,
      productId: productKibble2.id,
    },
  });

  await prisma.clinicProduct.create({
    data: {
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
      status: "CONFIRMED",
      pickupAt: new Date("2026-02-25T10:00:00"),
      clientId: clientProfile1.id,
      clinicId: clinic1.id,
    },
  });

  await prisma.orderItem.create({
    data: {
      quantity: 2,
      unitPrice: 65.9,
      productClinicId: cp1.id,
      orderId: order1.id,
    },
  });

  // ============================================================
  // MESSAGING
  // ============================================================
  const conv1 = await prisma.conversation.create({
    data: { name: "Équipe Clinique du Parc" },
  });

  const member1 = await prisma.conversationMember.create({
    data: {
      role: "ADMIN",
      userId: vetoUser1.id,
      conversationId: conv1.id,
    },
  });

  const member2 = await prisma.conversationMember.create({
    data: {
      role: "MEMBER",
      userId: vetoUser2.id,
      conversationId: conv1.id,
    },
  });

  const member3 = await prisma.conversationMember.create({
    data: {
      role: "MEMBER",
      userId: secretaryUser1.id,
      conversationId: conv1.id,
    },
  });

  const msg1 = await prisma.message.create({
    data: {
      content: "Bonjour à tous ! Réunion demain à 8h30.",
      conversationId: conv1.id,
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      content: "Reçu, je serai là !",
      conversationId: conv1.id,
    },
  });

  await prisma.messageRead.createMany({
    data: [
      {
        readAt: new Date(),
        messageId: msg1.id,
        readById: member1.id,
      },
      {
        readAt: new Date(),
        messageId: msg1.id,
        readById: member2.id,
      },
      {
        readAt: new Date(),
        messageId: msg2.id,
        readById: member1.id,
      },
    ],
  });

  console.log("✅ Seed terminé avec succès !");
  console.log("\n📋 Comptes créés :");
  console.log("  Admin      : admin@gmail.com / Password123!");
  console.log("  Directeur  : directeur@gmail.com / Password123!");
  console.log("  Référant   : referent@gmail.com / Password123!");
  console.log("  Véto 1     : veto@gmail.com / Password123!");
  console.log("  Véto 2     : dr.moreau@vetparc.fr / Password123!");
  console.log("  Véto 3     : dr.garcia@vetsaintmichel.fr / Password123!");
  console.log("  Secrétaire : secretaire@gmail.com / Password123!");
  console.log("  Client 1   : client@gmail.com / Password123!");
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
