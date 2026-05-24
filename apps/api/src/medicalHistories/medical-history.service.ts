import { ForbiddenError, NotFoundError } from "@api/errors";
import { AnimalMedicalHistoryRepository } from "./medical-history.repository";
import type {
  CreateMedicalHistory,
  UpdateMedicalHistory,
  UserRole,
} from "@armali/schemas";
import { AnimalMeetingRepository } from "@api/meetings";
import { VeterinarianClinicRepository } from "@api/clinics/veterinarian-clinics/veterinarian-clinic.repository";
import { ClinicActRepository } from "@api/acts/clinic-act.repository";

const ALLOWED_ROLES: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
];

const repository = new AnimalMedicalHistoryRepository();
const animalMeetingRepository = new AnimalMeetingRepository();
const clinicActRepository = new ClinicActRepository();
const veterinarianClinicRepository = new VeterinarianClinicRepository();

export class AnimalMeetingActService {
  async getById(id: string) {
    const act = await repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return act;
  }

  async create(data: CreateMedicalHistory, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const animalMeeting = await animalMeetingRepository.findById(
      data.meetingId,
    );
    if (!animalMeeting) throw new NotFoundError("animalMeeting");

    const clinicAct = await clinicActRepository.findById(data.clinicActId);
    if (!clinicAct) throw new NotFoundError("clinic act");

    const veterinarianClinicIds = data.performedByIds?.length
      ? (
          await Promise.all(
            data.performedByIds.map(({ id }) =>
              veterinarianClinicRepository.findByVeterinarianAndClinic(
                id,
                clinicAct.clinicId,
              ),
            ),
          )
        )
          .filter((vc) => vc !== null)
          .map((vc) => vc!.id)
      : [];
    return repository.create({
      data,
      animalMeetingId: animalMeeting.id,
      animalId: animalMeeting.animalId,
      type: clinicAct.act.type,
      performedBy: veterinarianClinicIds,
    });
  }

  async update(id: string, data: UpdateMedicalHistory, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const act = await repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const act = await repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return repository.delete(id);
  }

  async getByMeeting(meetingId: string) {
    const acts = await repository.findByMeeting(meetingId);
    if (!acts) throw new NotFoundError("acts historys");
    return acts;
  }
}
