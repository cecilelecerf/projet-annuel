import {
  ClinicId,
  clinicIdSchema,
  UpdateClinic,
  UserId,
} from "@armali/schemas";
import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { ClinicRepository } from "./clinic.repository";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { STAFF_ROLES } from "@api/utils";
import { Clinic } from "../../prisma/generated/prisma/client";

export class ClinicService {
  constructor(private repository: ClinicRepository) {}

  async getClinicByUser(userId: string): Promise<Clinic[]> {
    const clinics = await this.repository.findClinicByUserId(userId);
    if (!clinics) throw new NotFoundError("Clinique");
    return clinics;
  }

  // ── Staff d'une clinique, filtré par rôle cible ─────────────────────────────
  async getStaffByClinicRole({
    role,
    clinicId,
    targetRoles,
    authorId,
  }: {
    clinicId: ClinicId;
    authorId: UserId;
    role: UserRole;
    targetRoles?: UserRole[];
  }) {
    if (!STAFF_ROLES.includes(role)) throw new ForbiddenError();

    const clinics = await this.getClinicByUser(authorId);
    if (!clinics.some(({ id }) => id === clinicId)) {
      throw new ForbiddenError();
    }
    const clinicStaff = await this.repository.findStaff(clinicId);
    if (!clinicStaff) throw new NotFoundError("Clinique");
    if (!clinicStaff.director) throw new NotFoundError("Director clinique");

    // Aucun filtre → tous les rôles inclus
    const wantsRole = (r: UserRole) => !targetRoles || targetRoles.includes(r);

    const staffs = [
      ...(wantsRole("DIRECTOR") ? [clinicStaff.director] : []),
      ...(wantsRole("REFERENT") ? clinicStaff.referents : []),
      ...(wantsRole("SECRETARY") ? clinicStaff.secretaries : []),
      ...(wantsRole("VETERINARIAN") ? clinicStaff.veterinarians : []),
    ];

    return staffs;
  }

  async getClientsByClinic({
    role,
    clinicId,
    authorId,
  }: {
    clinicId: ClinicId;
    authorId: UserId;
    role: UserRole;
  }) {
    if (!STAFF_ROLES.includes(role)) throw new ForbiddenError();

    const clinics = await this.getClinicByUser(authorId);
    if (!clinics.some(({ id }) => id === clinicId)) {
      throw new ForbiddenError();
    }
    const clients = await this.repository.findClientsById(clinicId);

    return clients;
  }
  async getClinicIdsByUserId({
    userId,
    role,
  }: {
    userId: string;
    role: UserRole;
  }): Promise<ClinicId[]> {
    const clinicIds = await this.repository.findClinicIdByUser({
      userId,
      role,
    });
    if (!clinicIds) throw new ForbiddenError();
    return clinicIdSchema.array().parse(clinicIds);
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
