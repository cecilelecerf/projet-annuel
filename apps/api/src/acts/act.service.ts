import { NotFoundError, ForbiddenError } from "@api/errors";
import { ActRepository } from "./act.repository";
import { ClinicActRepository } from "./clinic-act.repository";
import type {
  CreateAct,
  UpdateAct,
  CreateClinicAct,
  UpdateClinicAct,
  UserRole,
} from "@armali/schemas";

const ADMIN_ROLES: UserRole[] = ["ADMIN"];
const STAFF_ROLES: UserRole[] = [
  "DIRECTOR",
  "SECRETARY",
  "REFERANT",
  "VETERINARIAN",
];

export class ActService {
  constructor(
    private repository: ActRepository,
    private clinicActRepository: ClinicActRepository,
  ) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return act;
  }

  async create(data: CreateAct, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateAct, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return this.repository.delete(id);
  }

  // ── ClinicActs (actes d'une clinique) ─────────────────────────────────────

  async getClinicActs(clinicId: string) {
    return this.clinicActRepository.findByClinic(clinicId);
  }

  async getClinicActById(id: string) {
    const act = await this.clinicActRepository.findById(id);
    if (!act) throw new NotFoundError("Acte clinique");
    return act;
  }

  async createClinicAct(data: CreateClinicAct, role: UserRole) {
    if (!STAFF_ROLES.includes(role) && !ADMIN_ROLES.includes(role))
      throw new ForbiddenError();
    return this.clinicActRepository.create(data);
  }

  async updateClinicAct(id: string, data: UpdateClinicAct, role: UserRole) {
    if (!STAFF_ROLES.includes(role) && !ADMIN_ROLES.includes(role))
      throw new ForbiddenError();
    const act = await this.clinicActRepository.findById(id);
    if (!act) throw new NotFoundError("Acte clinique");
    return this.clinicActRepository.update(id, data);
  }

  async deleteClinicAct(id: string, role: UserRole) {
    if (!STAFF_ROLES.includes(role) && !ADMIN_ROLES.includes(role))
      throw new ForbiddenError();
    const act = await this.clinicActRepository.findById(id);
    if (!act) throw new NotFoundError("Acte clinique");
    return this.clinicActRepository.delete(id);
  }
}
