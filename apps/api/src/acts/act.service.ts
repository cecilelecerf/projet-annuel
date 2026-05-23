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

const actRepository = new ActRepository();
const clinicActRepository = new ClinicActRepository();

export class ActService {
  async getAll() {
    return actRepository.findAll();
  }

  async getById(id: string) {
    const act = await actRepository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return act;
  }

  async create(data: CreateAct, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    return actRepository.create(data);
  }

  async update(id: string, data: UpdateAct, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    const act = await actRepository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return actRepository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    const act = await actRepository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return actRepository.delete(id);
  }

  // ── ClinicActs (actes d'une clinique) ─────────────────────────────────────

  async getClinicActs(clinicId: string) {
    return clinicActRepository.findByClinic(clinicId);
  }

  async getClinicActById(id: string) {
    const act = await clinicActRepository.findById(id);
    if (!act) throw new NotFoundError("Acte clinique");
    return act;
  }

  async createClinicAct(data: CreateClinicAct, role: UserRole) {
    if (!STAFF_ROLES.includes(role) && !ADMIN_ROLES.includes(role))
      throw new ForbiddenError();
    return clinicActRepository.create(data);
  }

  async updateClinicAct(id: string, data: UpdateClinicAct, role: UserRole) {
    if (!STAFF_ROLES.includes(role) && !ADMIN_ROLES.includes(role))
      throw new ForbiddenError();
    const act = await clinicActRepository.findById(id);
    if (!act) throw new NotFoundError("Acte clinique");
    return clinicActRepository.update(id, data);
  }

  async deleteClinicAct(id: string, role: UserRole) {
    if (!STAFF_ROLES.includes(role) && !ADMIN_ROLES.includes(role))
      throw new ForbiddenError();
    const act = await clinicActRepository.findById(id);
    if (!act) throw new NotFoundError("Acte clinique");
    return clinicActRepository.delete(id);
  }

  async getByMeeting(meetingId: string) {
    return actRepository.findByMeeting(meetingId);
  }
}
