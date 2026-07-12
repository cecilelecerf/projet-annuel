import { NotFoundError, ForbiddenError, BadRequestError } from "@api/errors";
import { SpecialityRepository } from "./speciality.repository";
import type {
  CreateSpeciality,
  UpdateSpeciality,
  UserRole,
} from "@armali/schemas";

export class SpecialityService {
  constructor(private repository: SpecialityRepository) {}

  async getAll(search?: string) {
    return this.repository.findAll(search);
  }

  async getById(id: string) {
    const speciality = await this.repository.findById(id);
    if (!speciality) throw new NotFoundError("Spécialité");
    return speciality;
  }

  async create(data: CreateSpeciality, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();
    if (!data.description) {
      throw new BadRequestError(
        "La description est requise pour créer une spécialité",
      );
    }
    const existing = await this.repository.findByExactName(data.name);
    if (existing) return existing;
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateSpeciality, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();
    const speciality = await this.repository.findById(id);
    if (!speciality) throw new NotFoundError("Spécialité");
    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();
    const speciality = await this.repository.findById(id);
    if (!speciality) throw new NotFoundError("Spécialité");
    return this.repository.delete(id);
  }
}
