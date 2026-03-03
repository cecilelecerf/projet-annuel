import type { PrismaClient } from "../generated/prisma/client";
import type { seedUsers } from "./users";

type Users = Awaited<ReturnType<typeof seedUsers>>;

export async function seedBankingInfo(
  prisma: PrismaClient,
  { users }: { users: Users },
) {
  const {
    vetProfile1,
    vetProfile2,
    vetProfile3,
    secretaryUser1,
    referentUser1,
  } = users;

  await Promise.all([
    // ── Vétérinaires ────────────────────────────────────────────────────────────
    prisma.bankingInfo.create({
      data: {
        iban: "FR76 3000 6000 0112 3456 7890 189",
        bic: "BNPAFRPPXXX",
        domiciliation: "BNP Paribas Paris",
        beneficiary: "Pierre Leroy",
        veterinarianId: vetProfile1.id,
      },
    }),
    prisma.bankingInfo.create({
      data: {
        iban: "FR76 1027 8060 0001 2345 6789 073",
        bic: "CMCIFRPPXXX",
        domiciliation: "CIC Paris",
        beneficiary: "Claire Moreau",
        veterinarianId: vetProfile2.id,
      },
    }),
    prisma.bankingInfo.create({
      data: {
        iban: "FR76 2004 1010 0505 0013 4120 060",
        bic: "PSSTFRPPXXX",
        domiciliation: "La Banque Postale",
        beneficiary: "Lucas Garcia",
        veterinarianId: vetProfile3.id,
      },
    }),

    // ── Secrétaire ──────────────────────────────────────────────────────────────
    prisma.bankingInfo.create({
      data: {
        iban: "FR76 1820 6004 7740 0100 0975 672",
        bic: "AGRIFRPPXXX",
        domiciliation: "Crédit Agricole Lyon",
        beneficiary: "Lucie Petit",
        secretaryId: secretaryUser1.id,
      },
    }),

    // ── Référant (seulement ceux qui en ont besoin) ─────────────────────────────
    prisma.bankingInfo.create({
      data: {
        iban: "FR76 3000 4000 0300 0000 1234 500",
        bic: "BNPAFRPP",
        domiciliation: "Société Générale Bordeaux",
        beneficiary: "Sophie Bernard",
        referantId: referentUser1.id,
      },
    }),
  ]);
}
