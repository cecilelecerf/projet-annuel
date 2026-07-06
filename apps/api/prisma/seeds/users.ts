import { hash } from "bcryptjs";
import type { PrismaClient } from "../generated/prisma/client";

export async function seedUsers(
  prisma: PrismaClient,
  {
    clinics,
    specialities,
    pets,
  }: {
    clinics: ReturnType<typeof import("./clinics").seedClinics> extends Promise<
      infer T
    >
      ? T
      : never;
    specialities: ReturnType<
      typeof import("./specialities").seedSpecialities
    > extends Promise<infer T>
      ? T
      : never;
    pets: ReturnType<typeof import("./pets").seedPets> extends Promise<infer T>
      ? T
      : never;
  },
) {
  const { clinic1, clinic2 } = clinics;

  const password = await hash("Password123!", 10);

  // ── Users ────────────────────────────────────────────────────────────────────
  const [
    adminUser,
    directorUser1,
    directorUser2,
    referentUser1,
    vetoUser1,
    vetoUser2,
    vetoUser3,
    secretaryUser1,
    clientUser1,
    clientUser2,
  ] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@gmail.com",
        firstname: "Super",
        lastname: "Admin",
        password,
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        email: "directeur@gmail.com",
        firstname: "Jean",
        lastname: "Martin",
        password,
        role: "DIRECTOR",
      },
    }),
    prisma.user.create({
      data: {
        email: "directeur@vetsaintmichel.fr",
        firstname: "Marie",
        lastname: "Dupont",
        password,
        role: "DIRECTOR",
      },
    }),
    prisma.user.create({
      data: {
        email: "referent@gmail.com",
        firstname: "Sophie",
        lastname: "Bernard",
        password,
        role: "REFERENT",
      },
    }),
    prisma.user.create({
      data: {
        email: "veto@gmail.com",
        firstname: "Pierre",
        lastname: "Leroy",
        password,
        role: "VETERINARIAN",
      },
    }),
    prisma.user.create({
      data: {
        email: "dr.moreau@vetparc.fr",
        firstname: "Claire",
        lastname: "Moreau",
        password,
        role: "VETERINARIAN",
      },
    }),
    prisma.user.create({
      data: {
        email: "dr.garcia@vetsaintmichel.fr",
        firstname: "Lucas",
        lastname: "Garcia",
        password,
        role: "VETERINARIAN",
      },
    }),
    prisma.user.create({
      data: {
        email: "secretaire@gmail.com",
        firstname: "Lucie",
        lastname: "Petit",
        password,
        role: "SECRETARY",
      },
    }),
    prisma.user.create({
      data: {
        email: "client@gmail.com",
        firstname: "Alice",
        lastname: "Durand",
        password,
        role: "CLIENT",
      },
    }),
    prisma.user.create({
      data: {
        email: "thomas.blanc@email.fr",
        firstname: "Thomas",
        lastname: "Blanc",
        password,
        role: "CLIENT",
      },
    }),
  ]);

  // ── Profiles clinic ───────────────────────────────────────────────────────────
  await prisma.directorClinicProfile.createMany({
    data: [
      { id: directorUser1.id, clinicId: clinic1.id },
      { id: directorUser2.id, clinicId: clinic2.id },
    ],
  });

  await prisma.referentClinicProfile.create({
    data: { id: referentUser1.id, clinicId: clinic1.id },
  });

  const secretaryProfile = await prisma.secretaryProfile.create({
    data: { id: secretaryUser1.id, clinicId: clinic1.id },
    include: { user: true },
  });

  // ── Veterinarian profiles ─────────────────────────────────────────────────────
  const [vetProfile1, vetProfile2, vetProfile3] = await Promise.all([
    prisma.veterinarianProfile.create({
      data: {
        id: vetoUser1.id,
        licenseNumber: "VET-001",
        bio: "Spécialiste en cardiologie animale",
        pets: {
          connect: [
            { id: pets.petCat.id },
            { id: pets.petRabbit.id },
            { id: pets.petDog.id },
          ],
        },

        specialities: {
          connect: [
            { id: specialities.cardiologie.id },
            { id: specialities.dermatologie.id },
          ],
        },
      },
    }),
    prisma.veterinarianProfile.create({
      data: {
        id: vetoUser2.id,
        licenseNumber: "VET-002",
        bio: "Généraliste avec expertise en dermatologie",
        pets: { connect: [{ id: pets.petCat.id }, { id: pets.petDog.id }] },

        specialities: {
          connect: [
            { id: specialities.dermatologie.id },
            { id: specialities.chirurgie.id },
          ],
        },
      },
    }),
    prisma.veterinarianProfile.create({
      data: {
        id: vetoUser3.id,
        licenseNumber: "VET-003",
        bio: "Généraliste",
        pets: { connect: [{ id: pets.petCat.id }, { id: pets.petDog.id }] },
        specialities: {
          connect: [{ id: specialities.medecineGenerale.id }],
        },
      },
    }),
  ]);

  // ── Client profiles ───────────────────────────────────────────────────────────
  const [clientProfile1, clientProfile2] = await Promise.all([
    prisma.clientProfile.create({
      data: {
        id: clientUser1.id,
        dateOfBirth: new Date("1990-05-15"),
        address: "3 Rue des Lilas, Paris",
        phone: "06 12 34 56 78",
      },
    }),
    prisma.clientProfile.create({
      data: {
        id: clientUser2.id,
        dateOfBirth: new Date("1985-11-20"),
        address: "8 Boulevard Victor Hugo, Lyon",
        phone: "07 98 76 54 32",
      },
    }),
  ]);

  return {
    adminUser,
    directorUser1,
    directorUser2,
    referentUser1,
    vetoUser1,
    vetoUser2,
    vetoUser3,
    vetProfile1,
    vetProfile2,
    vetProfile3,
    secretaryUser1,
    secretaryProfile,
    clientUser1,
    clientUser2,
    clientProfile1,
    clientProfile2,
  };
}
