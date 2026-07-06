import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaClient } from "@prisma/client/extension";

// ═══════════════════════════════════════════════════════════════
// Include — partagé par les deux méthodes
// ═══════════════════════════════════════════════════════════════

const vaccineDetailsInclude = {
  countryRules: true,
  act: true,
} satisfies Prisma.VaccineInclude;

export type VaccineWithDetails = Prisma.VaccineGetPayload<{
  include: typeof vaccineDetailsInclude;
}>;

// ═══════════════════════════════════════════════════════════════
// Repository
// ═══════════════════════════════════════════════════════════════

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
}
