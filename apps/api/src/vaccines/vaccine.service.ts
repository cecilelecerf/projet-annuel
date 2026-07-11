import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { VaccineRepository } from "./vaccine.repository";
import type { CreateVaccine, UpdateVaccine, UserRole } from "@armali/schemas";
import { PetRepository } from "@api/pets/pet.repository";

export class VaccineService {
  constructor(
    private repository: VaccineRepository,
    private petRepository: PetRepository,
  ) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const vaccine = await this.repository.findById(id);
    if (!vaccine) throw new NotFoundError("Vaccin");
    return vaccine;
  }

  async getByPetId(petId: string) {
    const pet = await this.petRepository.findById(petId);
    if (!pet) throw new NotFoundError("Espèce");
    return this.repository.findByPetId(petId);
  }

  async create(data: CreateVaccine, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();

    const pet = await this.petRepository.findById(data.petId);
    if (!pet) throw new NotFoundError("Espèce");

    const countries = data.countryRules.map((r) => `${r.country}-${r.type}`);
    if (new Set(countries).size !== countries.length) {
      throw new BadRequestError(
        "Un même pays ne peut avoir qu'une règle par type (obligatoire/recommandé)",
      );
    }

    return this.repository.create(data);
  }

  async update(id: string, data: UpdateVaccine, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Vaccin");

    if (data.countryRules) {
      const countries = data.countryRules.map((r) => `${r.country}-${r.type}`);
      if (new Set(countries).size !== countries.length) {
        throw new BadRequestError(
          "Un même pays ne peut avoir qu'une règle par type (obligatoire/recommandé)",
        );
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Vaccin");

    return this.repository.delete(id);
  }
}
