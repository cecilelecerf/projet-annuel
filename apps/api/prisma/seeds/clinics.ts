import type { PrismaClient } from "../generated/prisma/client";
async function geocodeAddress(address: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    { headers: { "User-Agent": "Armali/1.0" } }, // obligatoire pour Nominatim
  );
  const [result] = await res.json();
  return result
    ? { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
    : { lat: 0, lng: 0 };
}

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
  const address1 = "12 Avenue du Parc, Paris 75015";
  const address2 = "5 Rue Saint-Michel, Paris 75005";
  const address3 = "45 Avenue du Maine, Paris 75014";
  const address4 = "18 Rue de la Paix, Lyon 69002";
  const [coord1, coord2, coord3, coord4] = await Promise.all([
    geocodeAddress(address1),
    geocodeAddress(address2),
    geocodeAddress(address3),
    geocodeAddress(address4),
  ]);
  const [clinic1, clinic2, clinic3, clinic4] = await Promise.all([
    prisma.clinic.upsert({
      where: { siret: "12345678901234" },
      update: {},
      create: {
        name: "Clinique Vétérinaire du Parc",
        address: address1,
        siret: "12345678901234",
        phone: "01 23 45 67 89",
        website: "https://vetparc.fr",
        description:
          "Clinique généraliste et spécialisée en cardiologie et neurologie",
        openingHours: "Lun-Ven 8h-19h · Sam 9h-17h",
        lat: coord1.lat,
        lng: coord1.lng,
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
        address: address2,
        siret: "98765432109876",
        phone: "01 98 76 54 32",
        website: "https://vetsaintmichel.fr",
        description:
          "Clinique généraliste avec expertise en dermatologie et comportement",
        openingHours: "Lun-Sam 9h-18h",
        lat: coord2.lat,
        lng: coord2.lng,
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
        address: address3,
        siret: "11122233344455",
        phone: "01 44 55 66 77",
        website: "https://vetmontparnasse.fr",
        description:
          "Centre pluridisciplinaire spécialisé en oncologie, chirurgie et médecine interne",
        openingHours: "Lun-Ven 8h-20h · Sam-Dim 9h-18h (urgences)",
        lat: coord3.lat,
        lng: coord3.lng,
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
        address: address4,
        siret: "55566677788899",
        phone: "04 72 33 44 55",
        website: "https://vetnac-lyon.fr",
        description:
          "Spécialisée dans les nouveaux animaux de compagnie et animaux exotiques",
        openingHours: "Mar-Sam 9h-18h",
        lat: coord4.lat,
        lng: coord4.lng,
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
