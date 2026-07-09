import { PrismaClient } from "../../prisma/generated/prisma/client";
import type { CreateRace, UpdateRace } from "@armali/schemas";

export class RaceRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.race.findUnique({ where: { id } });
  }

  async findByPetId(petId: string) {
    return this.prisma.race.findMany({
      where: { petId },
      orderBy: { name: "asc" },
    });
  }

  async create(data: CreateRace) {
    return this.prisma.race.create({ data });
  }

  async update(id: string, data: UpdateRace) {
    return this.prisma.race.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.race.delete({ where: { id } });
  }

  /**
   * Vérifie si la race est référencée par des animaux existants avant
   * suppression — évite un échec de contrainte FK brut.
   */
  async hasAnimals(id: string): Promise<boolean> {
    const count = await this.prisma.animal.count({ where: { raceId: id } });
    return count > 0;
  }
}
