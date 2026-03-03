import { hash } from "bcryptjs";
import type { Clinic, PrismaClient } from "../generated/prisma/client";

export async function seedUsers(prisma: PrismaClient, clinics: Clinic[]) {
  const [clinic1, clinic2] = clinics;
  const password = await hash("Password123!", 10);

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

  // ── Profiles ────────────────────────────────────────────────────────────────
  await prisma.directorClinicProfile.createMany({
    data: [
      { id: directorUser1.id, clinicId: clinic1.id },
      { id: directorUser2.id, clinicId: clinic2.id },
    ],
  });

  await prisma.referentClinicProfile.create({
    data: { id: referentUser1.id, clinicId: clinic1.id },
  });

  await prisma.secretaryProfile.create({
    data: { id: secretaryUser1.id, clinicId: clinic1.id },
  });

  const vetProfile1 = await prisma.veterinarianProfile.create({
    data: {
      id: vetoUser1.id,
      licenseNumber: "VET-001",
      yearsExperience: 10,
      bio: "Spécialiste en cardiologie animale",
    },
  });
  const vetProfile2 = await prisma.veterinarianProfile.create({
    data: {
      id: vetoUser2.id,
      licenseNumber: "VET-002",
      yearsExperience: 5,
      bio: "Généraliste avec expertise en dermatologie",
    },
  });
  const vetProfile3 = await prisma.veterinarianProfile.create({
    data: {
      id: vetoUser3.id,
      licenseNumber: "VET-003",
      yearsExperience: 8,
      bio: "Généraliste",
    },
  });

  const clientProfile1 = await prisma.clientProfile.create({
    data: {
      id: clientUser1.id,
      dateOfBirth: new Date("1990-05-15"),
      address: "3 Rue des Lilas, Paris",
      phone: "06 12 34 56 78",
    },
  });
  const clientProfile2 = await prisma.clientProfile.create({
    data: {
      id: clientUser2.id,
      dateOfBirth: new Date("1985-11-20"),
      address: "8 Boulevard Victor Hugo, Lyon",
      phone: "07 98 76 54 32",
    },
  });

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
    clientUser1,
    clientUser2,
    clientProfile1,
    clientProfile2,
  };
}
