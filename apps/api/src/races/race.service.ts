import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { RaceRepository } from "./race.repository";
import { PetRepository } from "@api/pets/pet.repository";
import type { CreateRace, UpdateRace, UserRole } from "@armali/schemas";

export class RaceService {
  constructor(
    private repository: RaceRepository,
    private petRepository: PetRepository,
  ) {}

  async getByPetId(petId: string) {
    const pet = await this.petRepository.findById(petId);
    if (!pet) throw new NotFoundError("Espèce");
    return this.repository.findByPetId(petId);
  }

  async getById(id: string) {
    const race = await this.repository.findById(id);
    if (!race) throw new NotFoundError("Race");
    return race;
  }

  async create(data: CreateRace, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();

    const pet = await this.petRepository.findById(data.petId);
    if (!pet) throw new NotFoundError("Espèce");

    return this.repository.create(data);
  }

  async update(id: string, data: UpdateRace, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Race");

    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Race");

    const hasAnimals = await this.repository.hasAnimals(id);
    if (hasAnimals) {
      throw new BadRequestError(
        "Impossible de supprimer cette race : elle est utilisée par des animaux existants",
      );
    }

    return this.repository.delete(id);
  }
}
