import type { PrismaClient, Pet } from "../generated/prisma/client";

export async function seedHealthConditions(
  prisma: PrismaClient,
  { petDog }: { petDog: Pet },
) {
  const conditionRenal = await prisma.healthCondition.create({
    data: {
      name: "Insuffisance rénale",
      description: "Réduction de la fonction rénale",
      petId: petDog.id,
    },
  });
  await prisma.healthCondition.create({
    data: {
      name: "Diabète",
      description: "Trouble de la régulation du glucose",
      petId: petDog.id,
    },
  });
  const conditionCardio = await prisma.healthCondition.create({
    data: {
      name: "Insuffisance cardiaque",
      description: "Réduction de la fonction cardiaque",
      petId: petDog.id,
    },
  });

  return { conditionRenal, conditionCardio };
}
