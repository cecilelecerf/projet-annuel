import { PrismaClient } from "../../prisma/generated/prisma/client";

export class ShopRepository {
  constructor(private prisma: PrismaClient) {}

  async findClinicIdsByClient(clientUserId: string): Promise<string[]> {
    const animals = await this.prisma.animal.findMany({
      where: { clientId: clientUserId },
      select: {
        attendingVeterinarianClinic: { select: { clinicId: true } },
        animalMeeting: {
          select: {
            veterinarianClinic: { select: { clinicId: true } },
          },
        },
      },
    });

    const clinicIds = new Set<string>();
    for (const animal of animals) {
      if (animal.attendingVeterinarianClinic) {
        clinicIds.add(animal.attendingVeterinarianClinic.clinicId);
      }
      for (const meeting of animal.animalMeeting) {
        if (meeting.veterinarianClinic?.clinicId) {
          clinicIds.add(meeting.veterinarianClinic.clinicId);
        }
      }
    }
    return [...clinicIds];
  }

  async findClinicProducts(clinicIds: string[]) {
    return this.prisma.clinicProduct.findMany({
      where: { clinicId: { in: clinicIds } },
      include: {
        product: { include: { brand: true } },
        clinic: { select: { id: true, name: true } },
      },
      orderBy: { product: { name: "asc" } },
    });
  }

  async findClinicProductById(id: string) {
    return this.prisma.clinicProduct.findUnique({
      where: { id },
      include: {
        product: { include: { brand: true } },
        clinic: { select: { id: true, name: true } },
      },
    });
  }

  async findAnimalsByClient(clientUserId: string) {
    return this.prisma.animal.findMany({
      where: { clientId: clientUserId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async findAnimalOwnedByClient(animalId: string) {
    return this.prisma.animal.findUnique({
      where: { id: animalId },
      select: { id: true, clientId: true, dateOfBirth: true, activity: true },
    });
  }

  async findLatestWeight(animalId: string) {
    return this.prisma.animalMeeting.findFirst({
      where: { animalId, petWeight: { not: null } },
      orderBy: { meeting: { date: "desc" } },
      select: { petWeight: true },
    });
  }

  async findAnimalHealthConditions(animalId: string) {
    return this.prisma.animalHealthCondition.findMany({
      where: { animalId },
      select: {
        healthConditionId: true,
        healthCondition: { select: { name: true } },
      },
      distinct: ["healthConditionId"],
    });
  }

  async findFoodClinicProducts(clinicIds: string[]) {
    return this.prisma.clinicProduct.findMany({
      where: {
        clinicId: { in: clinicIds },
        product: { Food: { isNot: null } },
      },
      select: {
        id: true,
        product: {
          select: {
            Food: {
              select: {
                caloriesPer100: true,
                foodHealthConditions: {
                  select: { healthConditionId: true, recommendation: true },
                },
              },
            },
          },
        },
      },
    });
  }
}