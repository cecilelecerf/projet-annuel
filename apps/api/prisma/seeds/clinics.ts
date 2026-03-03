import type { PrismaClient } from "../generated/prisma/client";

export async function seedClinics(prisma: PrismaClient) {
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

  return { clinic1, clinic2 };
}
