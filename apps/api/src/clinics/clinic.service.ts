import { UpdateClinic } from "@armali/schemas";
import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { ClinicRepository } from "./clinic.repository";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { STAFF_ROLES } from "@api/utils";

export class ClinicService {
  constructor(private repository: ClinicRepository) {}

  async getMyClinic(userId: string) {
    const clinics = await this.repository.findClinicByUserId(userId);
    if (!clinics) throw new NotFoundError("Clinique");
    return clinics;
  }

  async getStaffByClinic(userId: string, role: UserRole) {
    if (!STAFF_ROLES.includes(role)) throw new ForbiddenError();
    const clinics = await this.repository.findClinicByUserId(userId);
    if (!clinics || clinics.length === 0) throw new NotFoundError("Clinique");
    return clinics.map(
      async (clinic) => await this.repository.findStaff(clinic.id),
    );
  }

  async updateClinic(userId: string, data: UpdateClinic) {
    const profile = await this.repository.findDirectorProfile(userId);
    if (!profile)
      throw new BadRequestError(
        "Aucune clinique associée à ce compte directeur",
      );
    return this.repository.update(profile.clinicId, data);
  }
}
