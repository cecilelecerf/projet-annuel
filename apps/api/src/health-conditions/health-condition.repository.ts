import { PrismaClient } from "../../prisma/generated/prisma/client";

export class AnimalHealthConditionRepository {
  constructor(private prisma: PrismaClient) {}

  async findByAnimal(animalId: string) {
    return this.prisma.animalHealthCondition.findMany({
      where: { animalId },
      select: {
        healthConditionId: true,
        healthCondition: { select: { name: true } },
      },
      distinct: ["healthConditionId"],
    });
  }
}