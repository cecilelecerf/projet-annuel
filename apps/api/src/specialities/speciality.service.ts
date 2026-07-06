import { NotFoundError } from "@api/errors";
import type { CreateSpeciality, UpdateSpeciality } from "@armali/schemas";
import { SpecialityRepository } from "./speciality.repository";

export class SpecialityService {
  constructor(private readonly repository: SpecialityRepository) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const speciality = await this.repository.findById(id);
    if (!speciality) throw new NotFoundError("Spécialité");
    return speciality;
  }

  async create(data: CreateSpeciality) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateSpeciality) {
    await this.getById(id);
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);
    return this.repository.delete(id);
  }
}
