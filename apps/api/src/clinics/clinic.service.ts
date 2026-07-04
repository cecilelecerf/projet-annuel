import { UpdateClinic } from "@armali/schemas";
import { BadRequestError, NotFoundError } from "@api/errors";
import { ClinicRepository } from "./clinic.repository";
import { UserRole } from "../../prisma/generated/prisma/enums";

const USER_SELECT = {
  id: true,
  firstname: true,
  lastname: true,
  email: true,
} as const;

export class ClinicService {
  constructor(private repository: ClinicRepository) {}

  async getMyClinic(userId: string) {
    const clinic = await this.repository.findClinicByUserId(userId);
    if (!clinic) throw new NotFoundError("Clinique");
    return clinic;
  }

  async getClinicStaff(userId: string, role: UserRole) {
    const clinicId = await this.repository.findClinicIdByUser(userId, role);
    if (!clinicId) throw new NotFoundError("Clinique");
    return this.repository.findStaff(clinicId);
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
