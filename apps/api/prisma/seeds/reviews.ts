import type { PrismaClient } from "../generated/prisma/client";

export async function seedReviews(
  prisma: PrismaClient,
  {
    users,
    veterinarianClinics,
  }: {
    users: ReturnType<typeof import("./users").seedUsers> extends Promise<
      infer T
    >
      ? T
      : never;
    veterinarianClinics: ReturnType<
      typeof import("./veterinarian-clinics").seedVeterinarianClinics
    > extends Promise<infer T>
      ? T
      : never;
  },
) {
  const { clientUser1, clientUser2 } = users;

  // ── Avis de clientUser1 ──────────────────────────────────────────────────────
  const reviewClient1Vet1 = await prisma.review.create({
    data: {
      rating: 5,
      comment:
        "Dr très à l'écoute, Rex a été pris en charge rapidement et le suivi est excellent.",
      clientId: clientUser1.id,
      veterinarianClinicId: veterinarianClinics.vetoClinic1.id,
    },
  });

  const reviewClient1Vet2 = await prisma.review.create({
    data: {
      rating: 4,
      comment:
        "Bonne consultation pour Luna, quelques minutes d'attente mais rien de gênant.",
      clientId: clientUser1.id,
      veterinarianClinicId: veterinarianClinics.vetoClinic5.id,
    },
  });

  const reviewClient2Vet1 = await prisma.review.create({
    data: {
      rating: 2,
      comment:
        "Consultation un peu expéditive, j'aurais aimé plus d'explications sur le traitement.",
      clientId: clientUser2.id,
      veterinarianClinicId: veterinarianClinics.vetoClinic2.id,
    },
  });

  // ── Avis de clientUser2 ──────────────────────────────────────────────────────
  await prisma.review.create({
    data: {
      rating: 3,
      comment: "Correct dans l'ensemble, sans plus.",
      clientId: clientUser2.id,
      veterinarianClinicId: veterinarianClinics.vetoClinic4.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 5,
      comment: null,
      clientId: clientUser2.id,
      veterinarianClinicId: veterinarianClinics.vetoClinic3.id,
    },
  });

  console.log("✅ Reviews created");

  return {
    reviewClient1Vet1,
    reviewClient1Vet2,
    reviewClient2Vet1,
  };
}
