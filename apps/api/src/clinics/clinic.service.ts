import {
  ClinicId,
  clinicIdSchema,
  UpdateClinic,
  UserId,
} from "@armali/schemas";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";
import { ClinicRepository } from "./clinic.repository";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { CLINIC_STAFF_ROLES, STAFF_ROLES } from "@api/utils";
import { Clinic } from "../../prisma/generated/prisma/client";

export class ClinicService {
  constructor(private repository: ClinicRepository) {}

  async getClinicByUser(userId: string): Promise<Clinic[]> {
    const clinics = await this.repository.findClinicByUserId(userId);
    if (!clinics) throw new NotFoundError("Clinique");
    return clinics;
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
    if (!CLINIC_STAFF_ROLES.includes(role)) throw new ForbiddenError();

    const clinics = await this.getClinicByUser(authorId);
    if (!clinics.some(({ id }) => id === clinicId)) {
      throw new ForbiddenError();
    }
    return await this.repository.findClientsById(clinicId);
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
  async updateClinic({
    userId,
    role,
    data,
  }: {
    userId: UserId;
    role: UserRole;
    data: UpdateClinic;
  }) {
    const clinicIds = await this.getClinicIdsByUserId({ userId, role });

    if (!clinicIds) throw new NotFoundError("clinic");
    if (clinicIds.length !== 1)
      throw new ConflictError("Multiple clinics associated with the user");

    return this.repository.update(clinicIds[0], data);
  }
}
