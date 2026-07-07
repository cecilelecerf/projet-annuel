import { NotFoundError, ForbiddenError, ConflictError } from "@api/errors";
import type {
  ClinicActId,
  CreateClinicAct,
  UpdateClinicAct,
  UserId,
  UserRole,
} from "@armali/schemas";
import { ClinicActRepository } from "./clinic-act.repository";
import { Prisma } from "../../prisma/generated/prisma/client";
import { ClinicService } from "@api/clinics/clinic.service";

export class ClinicActService {
  constructor(
    private repository: ClinicActRepository,
    private clinicService: ClinicService,
  ) {}

  // ── ClinicActs (actes d'une clinique) ─────────────────────────────────────

  async getClinicActs(clinicId: string) {
    return this.repository.findByClinic(clinicId);
  }

  async getClinicActById(id: string) {
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte clinique");
    return act;
  }

  async createClinicAct(
    data: CreateClinicAct,
    role: UserRole,
    authorId: UserId,
  ) {
    if (!["DIRECTOR", "REFERENT"].includes(role)) throw new ForbiddenError();
    const clinicId = await this.clinicService.getClinicIdByUserId({
      userId: authorId,
      role,
    });
    const clinicAct = await this.repository.findByKeys(clinicId, data.actId);
    console.log(clinicAct);
    if (clinicAct) throw new ConflictError("ClinicAct already exist");
    try {
      return await this.repository.create(clinicId, data);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictError("Cet acte est déjà associé à cette clinique");
      }
      throw err;
    }
  }

  async updateClinicAct(id: string, data: UpdateClinicAct, role: UserRole) {
    if (!["DIRECTOR", "REFERENT"].includes(role)) throw new ForbiddenError();
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte clinique");
    return this.repository.update(id, data);
  }

  async deleteClinicAct(id: ClinicActId, role: UserRole) {
    if (!["DIRECTOR", "REFERENT"].includes(role)) throw new ForbiddenError();
    const act = await this.repository.findById(id);
    console.log(act);
    if (!act) throw new NotFoundError("Acte clinique");
    return this.repository.delete(id);
  }
}
