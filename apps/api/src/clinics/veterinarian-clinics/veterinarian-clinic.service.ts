import { ForbiddenError, NotFoundError, ConflictError } from "@api/errors";
import { VeterinarianClinicRepository } from "./veterinarian-clinic.repository";
import type { UserRole } from "@armali/schemas";
import { isStaff } from "@api/utils";

const veterinarianClinicRepository = new VeterinarianClinicRepository();

export class VeterinarianClinicService {
  async getAll() {
    return veterinarianClinicRepository.findAll();
  }

  async getById(id: string) {
    const vc = await veterinarianClinicRepository.findById(id);
    if (!vc) throw new NotFoundError("Association vétérinaire-clinique");
    return vc;
  }

  async getByClinic(clinicId: string, role: UserRole) {
    if (!isStaff(role)) throw new ForbiddenError();
    return veterinarianClinicRepository.findByClinic(clinicId);
  }

  async getByVeterinarian(veterinarianId: string) {
    return veterinarianClinicRepository.findByVeterinarian(veterinarianId);
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
    const existing =
      await veterinarianClinicRepository.findByVeterinarianAndClinic(
        veterinarianId,
        clinicId,
      );
    if (existing)
      throw new ConflictError(
        "Ce vétérinaire est déjà associé à cette clinique",
      );

    return veterinarianClinicRepository.create(veterinarianId, clinicId);
  }

  async delete({ id, role }: { id: string; role: UserRole }) {
    if (!isStaff(role)) throw new ForbiddenError();
    const vc = await veterinarianClinicRepository.findById(id);
    if (!vc) throw new NotFoundError("Association vétérinaire-clinique");
    return veterinarianClinicRepository.delete(id);
  }
}
