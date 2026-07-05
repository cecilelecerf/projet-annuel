import type { PrismaClient } from "../generated/prisma/client";

const defaultOpeningHours = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  openTime: dayOfWeek === 0 ? "00:00" : "09:00",
  closeTime: dayOfWeek === 0 ? "00:00" : dayOfWeek === 6 ? "13:00" : "19:00",
  closed: dayOfWeek === 0,
}));

export async function seedClinics(prisma: PrismaClient) {
  const clinic1 = await prisma.clinic.upsert({
    where: { siret: "12345678901234" },
    update: {},
    create: {
      name: "Clinique Vétérinaire du Parc",
      street: "12 Avenue du Parc",
      postalCode: "75019",
      city: "Paris",
      country: "FR",
      siret: "12345678901234",
      phone: "01 23 45 67 89",
      description: "Clinique généraliste et spécialisée en cardiologie",
      website: "https://vetparc.fr",
      openingHours: defaultOpeningHours,
    },
  });

  const clinic2 = await prisma.clinic.upsert({
    where: { siret: "98765432109876" },
    update: {},
    create: {
      name: "Cabinet Vétérinaire Saint-Michel",
      street: "5 Rue Saint-Michel",
      postalCode: "69002",
      city: "Lyon",
      country: "FR",
      siret: "98765432109876",
      phone: "01 98 76 54 32",
      description: "Clinique généraliste",
      website: "https://vetsaintmichel.fr",
      openingHours: defaultOpeningHours,
    },
  });

  return { clinic1, clinic2 };
}
