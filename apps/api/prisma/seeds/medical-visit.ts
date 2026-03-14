import type { PrismaClient } from "../generated/prisma/client";
import type { seedUsers } from "./users";

type Users = Awaited<ReturnType<typeof seedUsers>>;

export async function seedMedicalVisits(
  prisma: PrismaClient,
  { users }: { users: Users },
) {
  const { vetoUser1, vetoUser2, vetoUser3, secretaryUser1, referentUser1 } =
    users;

  await Promise.all([
    // ── Visite d'embauche — Pierre Leroy (véto 1) ───────────────────────────
    prisma.medicalVisit.create({
      data: {
        visitedAt: new Date("2024-01-15"),
        newVisitedAt: new Date("2029-01-15"),
        result: "FIT",
        doctorName: "Dr. Émilie Rousseau",
        doctorRpps: "10012345678",
        occupationalHealthService: "CIAMT Paris",
        certificateUrl:
          "https://storage.vetparc.fr/medical/leroy-embauche-2024.pdf",
        staffs: { connect: { id: vetoUser1.id } },
      },
    }),

    // ── Visite périodique — Claire Moreau (véto 2) ──────────────────────────
    prisma.medicalVisit.create({
      data: {
        visitedAt: new Date("2025-03-10"),
        newVisitedAt: new Date("2027-03-10"),
        result: "FIT_WITH_RESTRICTIONS",
        restrictions:
          "Port de charges limité à 10kg — surveillance lombaire recommandée",
        doctorName: "Dr. Émilie Rousseau",
        doctorRpps: "10012345678",
        occupationalHealthService: "CIAMT Paris",
        certificateUrl:
          "https://storage.vetparc.fr/medical/moreau-periodique-2025.pdf",
        staffs: { connect: { id: vetoUser2.id } },
      },
    }),

    // ── Visite d'embauche — Lucas Garcia (véto 3) ───────────────────────────
    prisma.medicalVisit.create({
      data: {
        visitedAt: new Date("2023-09-01"),
        newVisitedAt: new Date("2028-09-01"),
        result: "FIT",
        doctorName: "Dr. Marc Fontaine",
        doctorRpps: "10098765432",
        occupationalHealthService: "ACMS Lyon",
        certificateUrl:
          "https://storage.vetparc.fr/medical/garcia-embauche-2023.pdf",
        staffs: { connect: { id: vetoUser3.id } },
      },
    }),

    // ── Visite de reprise — Lucie Petit (secrétaire) ────────────────────────
    prisma.medicalVisit.create({
      data: {
        visitedAt: new Date("2025-06-20"),
        newVisitedAt: new Date("2027-06-20"),
        result: "FIT",
        doctorName: "Dr. Émilie Rousseau",
        doctorRpps: "10012345678",
        occupationalHealthService: "CIAMT Paris",
        certificateUrl:
          "https://storage.vetparc.fr/medical/petit-reprise-2025.pdf",
        staffs: { connect: { id: secretaryUser1.id } },
      },
    }),

    // ── Visite périodique — Sophie Bernard (référante) ──────────────────────
    prisma.medicalVisit.create({
      data: {
        visitedAt: new Date("2025-11-05"),
        newVisitedAt: new Date("2027-11-05"),
        result: "FIT",
        doctorName: "Dr. Marc Fontaine",
        doctorRpps: "10098765432",
        occupationalHealthService: "ACMS Lyon",
        certificateUrl:
          "https://storage.vetparc.fr/medical/bernard-periodique-2025.pdf",
        staffs: { connect: { id: referentUser1.id } },
      },
    }),

    // ── Visite collective — réunion annuelle sécurité (véto 1 + véto 2) ─────
    prisma.medicalVisit.create({
      data: {
        visitedAt: new Date("2025-12-01"),
        newVisitedAt: new Date("2026-12-01"),
        result: "FIT",
        doctorName: "Dr. Émilie Rousseau",
        doctorRpps: "10012345678",
        occupationalHealthService: "CIAMT Paris",
        certificateUrl:
          "https://storage.vetparc.fr/medical/collective-securite-2025.pdf",
        staffs: {
          connect: [{ id: vetoUser1.id }, { id: vetoUser2.id }],
        },
      },
    }),
  ]);
}
