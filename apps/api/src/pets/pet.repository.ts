import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import type { CreatePet, UpdatePet } from "@armali/schemas";

const petDetailsInclude = {
  races: true,
} satisfies Prisma.PetInclude;

export type PetWithDetails = Prisma.PetGetPayload<{
  include: typeof petDetailsInclude;
}>;

export class PetRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<PetWithDetails | null> {
    return this.prisma.pet.findUnique({
      where: { id },
      include: petDetailsInclude,
    });
  }

  async findAll(): Promise<PetWithDetails[]> {
    return this.prisma.pet.findMany({
      include: petDetailsInclude,
      orderBy: { name: "asc" },
    });
  }

  async create(data: CreatePet): Promise<PetWithDetails> {
    return this.prisma.pet.create({
      data: {
        name: data.name,
        picture: data.picture,
      },
      include: petDetailsInclude,
    });
  }

  async update(id: string, data: UpdatePet): Promise<PetWithDetails> {
    return this.prisma.pet.update({
      where: { id },
      data: {
        name: data.name,
        picture: data.picture,
      },
      include: petDetailsInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pet.delete({ where: { id } });
  }

  /**
   * Vérifie si l'espèce est référencée ailleurs (races, vaccins, cliniques,
   * vétérinaires, conditions de santé) avant suppression — évite un échec
   * de contrainte FK brut et donne un message clair au lieu d'une erreur Prisma.
   */
  async hasReferences(id: string): Promise<boolean> {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            races: true,
            vaccine: true,
            clinics: true,
            veterinarians: true,
            healthConditions: true,
          },
        },
      },
    });
    if (!pet) return false;
    return Object.values(pet._count).some((count) => count > 0);
  }
}
