import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { PetRepository } from "./pet.repository";
import type { CreatePet, UpdatePet, UserRole } from "@armali/schemas";

export class PetService {
  constructor(private repository: PetRepository) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const pet = await this.repository.findById(id);
    if (!pet) throw new NotFoundError("Espèce");
    return pet;
  }

  async create(data: CreatePet, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();
    return this.repository.create(data);
  }

  async update(id: string, data: UpdatePet, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Espèce");

    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Espèce");

    const hasReferences = await this.repository.hasReferences(id);
    if (hasReferences) {
      throw new BadRequestError(
        "Impossible de supprimer cette espèce : elle est utilisée par des races, vaccins, cliniques ou vétérinaires existants",
      );
    }

    return this.repository.delete(id);
  }
}
