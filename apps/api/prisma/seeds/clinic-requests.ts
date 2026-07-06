import type { PrismaClient } from "../generated/prisma/client";

export async function seedClinicRequests(
  prisma: PrismaClient,
  {
    directors,
  }: {
    // Adapte cette clé/typage à la forme réelle de ton seed de directeurs
    directors: ReturnType<
      typeof import("./directors").seedDirectors
    > extends Promise<infer T>
      ? T
      : never;
  },
) {
  // `siret` n'étant pas unique sur ClinicCreationRequest (un même SIRET peut être
  // resoumis après un refus), on ne peut pas faire un upsert dessus. On vérifie
  // donc l'existence via findFirst avant de créer, pour garder le seed idempotent.
  async function upsertRequest(
    data: Parameters<typeof prisma.clinicRequest.create>[0]["data"],
  ) {
    const existing = await prisma.clinicRequest.findFirst({
      where: { siret: data.siret, status: data.status },
    });
    if (existing) return existing;
    return prisma.clinicRequest.create({ data });
  }

  const [requestPending, requestApproved, requestRejected] = await Promise.all([
    upsertRequest({
      status: "PENDING",
      name: "Clinique Vétérinaire des Buttes-Chaumont",
      address: "10 Rue Manin, Paris 75019",
      siret: "66677788899900",
      phone: "01 42 33 44 55",
      website: "https://vetbuttes-chaumont.fr",
      description: "Nouvelle clinique généraliste en cours d'ouverture",
      directorId: directors.directorPending.id,
    }),

    upsertRequest({
      status: "APPROVED",
      name: "Clinique Vétérinaire du Parc",
      address: "15 Rue de la Convention, Paris 75015",
      siret: "12345678901234",
      phone: "01 23 45 67 89",
      website: "https://vetparc.fr",
      description:
        "Clinique généraliste et spécialisée en cardiologie et neurologie",
      directorId: directors.directorApproved.id,
    }),

    upsertRequest({
      status: "REJECTED",
      name: "Cabinet Vétérinaire Express",
      address: "3 Rue de Rivoli, Paris 75004",
      siret: "77788899900011",
      phone: "01 40 50 60 70",
      website: "https://vet-express.fr",
      description: "Dossier incomplet, informations SIRET invalides",
      directorId: directors.directorRejected.id,
    }),
  ]);

  return { requestPending, requestApproved, requestRejected };
}
