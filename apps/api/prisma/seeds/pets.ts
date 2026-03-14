import type { PrismaClient } from "../generated/prisma/client";

export async function seedPets(prisma: PrismaClient) {
  const petDog = await prisma.pet.create({ data: { name: "Chien" } });
  const petCat = await prisma.pet.create({ data: { name: "Chat" } });
  const petRabbit = await prisma.pet.create({ data: { name: "Lapin" } });

  const raceLab = await prisma.race.create({
    data: { name: "Labrador", petId: petDog.id },
  });
  const raceGolden = await prisma.race.create({
    data: { name: "Golden Retriever", petId: petDog.id },
  });
  const racePersan = await prisma.race.create({
    data: { name: "Persan", petId: petCat.id },
  });
  await prisma.race.create({ data: { name: "Européen", petId: petCat.id } });

  return { petDog, petCat, petRabbit, raceLab, raceGolden, racePersan };
}
