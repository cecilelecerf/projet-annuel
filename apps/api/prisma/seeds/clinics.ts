import type { PrismaClient } from "../generated/prisma/client";

export async function seedClinics(
  prisma: PrismaClient,
  {
    specialities,
  }: {
    specialities: ReturnType<
      typeof import("./specialities").seedSpecialities
    > extends Promise<infer T>
      ? T
      : never;
  },
) {
  const [clinic1, clinic2, clinic3, clinic4] = await Promise.all([
    prisma.clinic.upsert({
      where: { siret: "12345678901234" },
      update: {},
      create: {
        name: "Clinique Vétérinaire du Parc",
        address: "12 Avenue du Parc, Paris 75015",
        siret: "12345678901234",
        phone: "01 23 45 67 89",
        website: "https://vetparc.fr",
        description:
          "Clinique généraliste et spécialisée en cardiologie et neurologie",
        openingHours: "Lun-Ven 8h-19h · Sam 9h-17h",
        specialities: {
          connect: [
            { id: specialities.medecineGenerale.id },
            { id: specialities.cardiologie.id },
            { id: specialities.neurologie.id },
            { id: specialities.chirurgie.id },
            { id: specialities.imageriemédicale.id },
          ],
        },
      },
    }),

    prisma.clinic.upsert({
      where: { siret: "98765432109876" },
      update: {},
      create: {
        name: "Cabinet Vétérinaire Saint-Michel",
        address: "5 Rue Saint-Michel, Paris 75005",
        siret: "98765432109876",
        phone: "01 98 76 54 32",
        website: "https://vetsaintmichel.fr",
        description:
          "Clinique généraliste avec expertise en dermatologie et comportement",
        openingHours: "Lun-Sam 9h-18h",
        specialities: {
          connect: [
            { id: specialities.medecineGenerale.id },
            { id: specialities.dermatologie.id },
            { id: specialities.comportementAnimal.id },
            { id: specialities.dentisterie.id },
          ],
        },
      },
    }),

    prisma.clinic.upsert({
      where: { siret: "11122233344455" },
      update: {},
      create: {
        name: "Centre Vétérinaire Montparnasse",
        address: "45 Avenue du Maine, Paris 75014",
        siret: "11122233344455",
        phone: "01 44 55 66 77",
        website: "https://vetmontparnasse.fr",
        description:
          "Centre pluridisciplinaire spécialisé en oncologie, chirurgie et médecine interne",
        openingHours: "Lun-Ven 8h-20h · Sam-Dim 9h-18h (urgences)",
        specialities: {
          connect: [
            { id: specialities.oncologie.id },
            { id: specialities.chirurgie.id },
            { id: specialities.medecineInterne.id },
            { id: specialities.orthopedie.id },
            { id: specialities.urgencesSoinsIntensifs.id },
          ],
        },
      },
    }),

    prisma.clinic.upsert({
      where: { siret: "55566677788899" },
      update: {},
      create: {
        name: "Clinique des NAC & Exotiques",
        address: "18 Rue de la Paix, Lyon 69002",
        siret: "55566677788899",
        phone: "04 72 33 44 55",
        website: "https://vetnac-lyon.fr",
        description:
          "Spécialisée dans les nouveaux animaux de compagnie et animaux exotiques",
        openingHours: "Mar-Sam 9h-18h",
        specialities: {
          connect: [
            { id: specialities.medecineNAC.id },
            { id: specialities.medecineGenerale.id },
            { id: specialities.reproductionObstetrique.id },
            { id: specialities.ophtalmologie.id },
          ],
        },
      },
    }),
  ]);

  return { clinic1, clinic2, clinic3, clinic4 };
}
