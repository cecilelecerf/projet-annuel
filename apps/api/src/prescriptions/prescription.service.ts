import { ForbiddenError, NotFoundError } from "@api/errors";
import { PrescriptionRepository } from "./prescription.repository";
import type {
  CreatePrescription,
  MeetingId,
  UpdatePrescription,
  UserRole,
} from "@armali/schemas";

const ALLOWED_ROLES: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
];

const prescriptionRepository = new PrescriptionRepository();

export class PrescriptionService {
  async getByMeeting(meetingId: MeetingId) {
    return prescriptionRepository.findByMeeting(meetingId);
  }

  async getById(id: string) {
    const prescription = await prescriptionRepository.findById(id);
    if (!prescription) throw new NotFoundError("Prescription");
    return prescription;
  }

  async create(data: CreatePrescription, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    return prescriptionRepository.create(data);
  }

  async update(id: string, data: UpdatePrescription, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const prescription = await prescriptionRepository.findById(id);
    if (!prescription) throw new NotFoundError("Prescription");
    return prescriptionRepository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const prescription = await prescriptionRepository.findById(id);
    if (!prescription) throw new NotFoundError("Prescription");
    return prescriptionRepository.delete(id);
  }
}
