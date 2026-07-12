import { ForbiddenError, NotFoundError, ConflictError } from "@api/errors";
import { VeterinarianClinicRepository } from "./veterinarian-clinic.repository";
import type { UserRole, VeterinarianClinicId } from "@armali/schemas";
import { isStaff } from "@api/utils";

export class VeterinarianClinicService {
  constructor(private repository: VeterinarianClinicRepository) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById({ id }: { id: VeterinarianClinicId }) {
    const vc = await this.repository.findById(id);
    if (!vc) throw new NotFoundError("Association vétérinaire-clinique");
    return vc;
  }

  async getByClinic(clinicId: string, role: UserRole) {
    if (!isStaff(role)) throw new ForbiddenError();
    return this.repository.findByClinic(clinicId);
  }

  async getByVeterinarian(veterinarianId: string) {
    return this.repository.findByVeterinarian(veterinarianId);
  }

  async create({
    veterinarianId,
    clinicId,
    role,
  }: {
    veterinarianId: string;
    clinicId: string;
    role: UserRole;
  }) {
    if (!isStaff(role)) throw new ForbiddenError();

    // Vérifie que l'association n'existe pas déjà
    const existing = await this.repository.findByKeys(veterinarianId, clinicId);
    if (existing)
      throw new ConflictError(
        "Ce vétérinaire est déjà associé à cette clinique",
      );

    return this.repository.create(veterinarianId, clinicId);
  }

  async delete({ id, role }: { id: VeterinarianClinicId; role: UserRole }) {
    if (!isStaff(role)) throw new ForbiddenError();
    const vc = await this.repository.findById(id);
    if (!vc) throw new NotFoundError("Association vétérinaire-clinique");
    return this.repository.delete(id);
  }
}
