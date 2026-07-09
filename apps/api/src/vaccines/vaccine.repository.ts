import { CreateVaccine, UpdateVaccine } from "@armali/schemas";
import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export const vaccineDetailsInclude = {
  countryRules: true,
  act: true,
} satisfies Prisma.VaccineInclude;

export type VaccineWithDetails = Prisma.VaccineGetPayload<{
  include: typeof vaccineDetailsInclude;
}>;

export class VaccineRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<VaccineWithDetails | null> {
    return this.prisma.vaccine.findUnique({
      where: { id },
      include: vaccineDetailsInclude,
    });
  }

  async findByPetId(petId: string): Promise<VaccineWithDetails[]> {
    return this.prisma.vaccine.findMany({
      where: { petId },
      include: vaccineDetailsInclude,
    });
  }

  async findAll() {
    return this.prisma.vaccine.findMany({
      include: vaccineDetailsInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Crée l'Act (type VACCINATION) et le Vaccine associé en une seule
   * opération imbriquée, avec ses countryRules.
   */
  async create(data: CreateVaccine) {
    return this.prisma.vaccine.create({
      data: {
        recommendedAge: data.recommendedAge,
        boosterInterval: data.boosterInterval,
        petId: data.petId,
        countryRules: {
          create: data.countryRules,
        },
        act: {
          create: {
            name: data.name,
            description: data.description,
            type: "VACCINATION",
            basePrice: data.basePrice,
          },
        },
      },
      include: vaccineDetailsInclude,
    });
  }

  async update(id: string, data: UpdateVaccine) {
    // Met à jour l'Act et le Vaccine séparément (deux tables distinctes)
    const vaccine = await this.prisma.vaccine.findUniqueOrThrow({
      where: { id },
      select: { act: { select: { id: true } } },
    });

    if (
      data.name !== undefined ||
      data.description !== undefined ||
      data.basePrice !== undefined
    ) {
      await this.prisma.act.update({
        where: { id: vaccine.act!.id },
        data: {
          name: data.name,
          description: data.description,
          basePrice: data.basePrice,
        },
      });
    }

    if (data.countryRules) {
      // Remplace entièrement les règles existantes par les nouvelles
      await this.prisma.vaccineCountryRule.deleteMany({
        where: { vaccineId: id },
      });
    }

    return this.prisma.vaccine.update({
      where: { id },
      data: {
        recommendedAge: data.recommendedAge,
        boosterInterval: data.boosterInterval,
        countryRules: data.countryRules
          ? { create: data.countryRules }
          : undefined,
      },
      include: vaccineDetailsInclude,
    });
  }

  async delete(id: string) {
    // La suppression de l'Act cascade sur le Vaccine (relation 1:1 via
    // Act.vaccineId), qui cascade lui-même sur les countryRules.
    const vaccine = await this.prisma.vaccine.findUniqueOrThrow({
      where: { id },
      select: { act: { select: { id: true } } },
    });
    await this.prisma.act.delete({ where: { id: vaccine.act!.id } });
    await this.prisma.vaccine.delete({ where: { id } });
  }
}
