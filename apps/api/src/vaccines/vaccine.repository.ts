import { PrismaClient } from "@prisma/client/extension";

export class VaccineRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.vaccine.findUnique({
      where: { id },
      include: {
        countryRules: true,
        act: true,
      },
    });
  }

  async findByPetId(petId: string) {
    return this.prisma.vaccine.findMany({
      where: { petId },
      include: {
        countryRules: true,
        act: true,
      },
    });
  }
}
