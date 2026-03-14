import type { PrismaClient, Pet } from "../generated/prisma/client";

export async function seedVaccines(
  prisma: PrismaClient,
  { petDog, petCat }: { petDog: Pet; petCat: Pet },
) {
  const vaccineRage = await prisma.vaccine.create({
    data: {
      name: "Rage",
      description: "Vaccin antirabique obligatoire",
      recommendedAge: 12,
      boosterInterval: 52,
      mandatoryCountry: ["FR", "BE", "CH"],
      petId: petDog.id,
    },
  });
  const vaccineCHPPi = await prisma.vaccine.create({
    data: {
      name: "CHPPi",
      description: "Maladie de Carré, Hépatite, Parvovirose, Parainfluenza",
      recommendedAge: 8,
      boosterInterval: 52,
      petId: petDog.id,
    },
  });
  const vaccineTyphus = await prisma.vaccine.create({
    data: {
      name: "Typhus",
      description: "Panleucopénie féline",
      recommendedAge: 8,
      boosterInterval: 52,
      petId: petCat.id,
    },
  });

  return { vaccineRage, vaccineCHPPi, vaccineTyphus };
}
