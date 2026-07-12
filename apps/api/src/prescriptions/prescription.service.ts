import { ForbiddenError, NotFoundError } from "@api/errors";
import { PrescriptionRepository } from "./prescription.repository";
import type {
  CreatePrescription,
  MeetingId,
  UpdatePrescription,
  UserRole,
} from "@armali/schemas";

const ALLOWED_ROLES: UserRole[] = ["VETERINARIAN"];

export class PrescriptionService {
  constructor(private repository: PrescriptionRepository) {}

  async getByMeeting(meetingId: MeetingId) {
    return this.repository.findByMeeting(meetingId);
  }

  async getById(id: string) {
    const prescription = await this.repository.findById(id);
    if (!prescription) throw new NotFoundError("Prescription");
    return prescription;
  }

  async create(data: CreatePrescription, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    return this.repository.create(data);
  }

  async update(id: string, data: UpdatePrescription, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const prescription = await this.repository.findById(id);
    if (!prescription) throw new NotFoundError("Prescription");
    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const prescription = await this.repository.findById(id);
    if (!prescription) throw new NotFoundError("Prescription");
    return this.repository.delete(id);
  }
}
