import type { PrismaClient } from "../generated/prisma/client";

export async function seedSpecialities(prisma: PrismaClient) {
  const specCardio = await prisma.speciality.create({
    data: {
      name: "Cardiologie",
      description: "Maladies cardiaques et vasculaires",
    },
  });
  const specDerma = await prisma.speciality.create({
    data: {
      name: "Dermatologie",
      description: "Maladies de la peau et du pelage",
    },
  });
  await prisma.speciality.create({
    data: { name: "Chirurgie", description: "Interventions chirurgicales" },
  });

  return { specCardio, specDerma };
}
