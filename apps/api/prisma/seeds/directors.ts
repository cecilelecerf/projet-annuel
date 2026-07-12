import { hash } from "bcryptjs";
import type { PrismaClient } from "../generated/prisma/client";

export async function seedDirectors(prisma: PrismaClient) {
  const password = await hash("Password123!", 10);

  // ── Users ────────────────────────────────────────────────────────────────────
  const [
    directorUser1,
    directorUser2,
    directorPending,
    directorRejected,
    directorApproved,
  ] = await Promise.all([
    prisma.user.create({
      data: {
        email: "directeur@gmail.com",
        firstname: "Jean",
        lastname: "Martin",
        password,
        role: "DIRECTOR",
        directorClinicProfile: {
          create: {},
        },
      },
      include: { directorClinicProfile: true },
    }),
    prisma.user.create({
      data: {
        email: "directeur@vetsaintmichel.fr",
        firstname: "Marie",
        lastname: "Dupont",
        password,
        role: "DIRECTOR",
        directorClinicProfile: {
          create: {},
        },
      },
      include: { directorClinicProfile: true },
    }),
    prisma.user.create({
      data: {
        email: "pending@gmail.fr",
        firstname: "Marie",
        lastname: "Dupont",
        password,
        role: "DIRECTOR",
        directorClinicProfile: {
          create: {},
        },
      },
      include: { directorClinicProfile: true },
    }),
    prisma.user.create({
      data: {
        email: "rejected@gmail.fr",
        firstname: "Marie",
        lastname: "Dupont",
        password,
        role: "DIRECTOR",
        directorClinicProfile: {
          create: {},
        },
      },
      include: { directorClinicProfile: true },
    }),
    prisma.user.create({
      data: {
        email: "approved@gmail.fr",
        firstname: "Marie",
        lastname: "Dupont",
        password,
        role: "DIRECTOR",
        directorClinicProfile: {
          create: {},
        },
      },
      include: { directorClinicProfile: true },
    }),
  ]);

  return {
    directorUser1,
    directorUser2,
    directorPending,
    directorApproved,
    directorRejected,
  };
}
