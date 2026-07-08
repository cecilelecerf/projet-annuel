import { hash } from "bcryptjs";
import type { PrismaClient } from "../generated/prisma/client";
import { seedAvatar } from "./avatars";

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
  const { clinic1 } = clinics;

  const password = await hash("Password123!", 10);

  // ── Users ────────────────────────────────────────────────────────────────────
  const [
    adminUser,
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
        email: "referent@gmail.com",
        firstname: "Sophie",
        lastname: "Bernard",
        password,
        role: "REFERENT",
      },
    }),
    prisma.user
      .create({
        data: {
          email: "veto@gmail.com",
          firstname: "Pierre",
          lastname: "Leroy",
          password,
          role: "VETERINARIAN",
        },
      })
      .then(async (user) => {
        await seedAvatar(prisma, {
          userId: user.id,
          localImagePath: "assets/users/avatar-pierre.jpg",
        });
        return user;
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
    prisma.user
      .create({
        data: {
          email: "secretaire@gmail.com",
          firstname: "Lucie",
          lastname: "Petit",
          password,
          role: "SECRETARY",
        },
      })
      .then(async (user) => {
        await seedAvatar(prisma, {
          userId: user.id,
          localImagePath: "assets/users/avatar-lucie.jpg",
        });
        return user;
      }),
    prisma.user
      .create({
        data: {
          email: "client@gmail.com",
          firstname: "Alice",
          lastname: "Durand",
          password,
          role: "CLIENT",
        },
      })
      .then(async (user) => {
        await seedAvatar(prisma, {
          userId: user.id,
          localImagePath: "assets/users/avatar-alice.jpg",
        });
        return user;
      }),
    prisma.user
      .create({
        data: {
          email: "thomas.blanc@email.fr",
          firstname: "Thomas",
          lastname: "Blanc",
          password,
          role: "CLIENT",
        },
      })
      .then(async (user) => {
        await seedAvatar(prisma, {
          userId: user.id,
          localImagePath: "assets/users/avatar-thomas.jpg",
        });
        return user;
      }),
  ]);
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
