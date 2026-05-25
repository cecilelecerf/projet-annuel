import { prisma } from "@api/lib/prisma";

export class VaccineRepository {
  async findById(id: string) {
    return prisma.vaccine.findUnique({
      where: { id },
      include: {
        countryRules: true,
        act: true,
      },
    });
  }

  async findByPetId(petId: string) {
    return prisma.vaccine.findMany({
      where: { petId },
      include: {
        countryRules: true,
        act: true,
      },
    });
  }
}
