import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { AnimalMedicalHistoryRepository } from "./medical-history.repository";
import type {
  ActType,
  CreateMedicalHistory,
  UpdateMedicalHistory,
  UserRole,
} from "@armali/schemas";
import { AnimalMeetingRepository } from "@api/meetings/animal-meeting/animal-meeting.repository";
import { VeterinarianClinicRepository } from "@api/veterinarian-clinics/veterinarian-clinic.repository";
import { ClinicActRepository } from "@api/acts/clinic-act.repository";
import { AnimalRepository } from "@api/animals/animal.repository";
import { isStaff } from "@api/utils";
import { Decimal } from "../../prisma/generated/prisma/internal/prismaNamespace";
import { VaccineRepository } from "@api/vaccines/vaccine.repository";

const ALLOWED_ROLES: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERENT",
  "ADMIN",
];

export class AnimalMedicalHistoryService {
  constructor(
    private repository: AnimalMedicalHistoryRepository,
    private animalMeetingRepository: AnimalMeetingRepository,
    private animalRepository: AnimalRepository,
    private vaccineRepository: VaccineRepository,
    private veterinarianClinicRepository: VeterinarianClinicRepository,
    private clinicActRepository: ClinicActRepository,
  ) {}

  async getById(id: string) {
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return act;
  }

  async create(data: CreateMedicalHistory, role: UserRole, userId: string) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();

    const animalMeeting = await this.animalMeetingRepository.findById(
      data.meetingId,
    );
    if (!animalMeeting) throw new NotFoundError("animalMeeting");

    // Si CLIENT, l'animal doit lui appartenir
    if (role === "CLIENT") {
      const animal = await this.animalRepository.findById(
        animalMeeting.animalId,
      );
      if (animal?.clientId !== userId) throw new ForbiddenError();
    }

    // Si STAFF, clinicActId obligatoire
    if (isStaff(role) && !data.clinicActId) {
      throw new BadRequestError("clinicActId est obligatoire pour le staff");
    }

    let type: ActType | undefined;
    let performedBy: string[] = [];
    let priceApplied: Decimal | undefined = data.priceApplied
      ? new Decimal(data.priceApplied)
      : undefined;
    let actId: string | undefined = data.actId ?? undefined;

    if (data.clinicActId) {
      const clinicAct = await this.clinicActRepository.findById(
        data.clinicActId,
      );
      if (!clinicAct) throw new NotFoundError("clinic act");

      actId = clinicAct.actId;
      if (animalMeeting.veterinarianClinicId) {
        const veterinarianClinic =
          await this.veterinarianClinicRepository.findById(
            animalMeeting.veterinarianClinicId,
          );
        if (!veterinarianClinic) throw new NotFoundError("veterinarian clinic");
        if (veterinarianClinic.clinicId !== clinicAct.clinicId) {
          throw new BadRequestError(
            "Le meeting et l'acte ne sont pas de la même clinique",
          );
        }
      }

      type = clinicAct.act.type;

      // priceApplied fallback sur le prix du clinicAct
      if (!priceApplied) {
        priceApplied = clinicAct.price;
      }

      // performedBy doit être de la même clinique
      if (data.performedByIds?.length) {
        performedBy = (
          await Promise.all(
            data.performedByIds.map((id) =>
              this.veterinarianClinicRepository.findByVeterinarianAndClinic(
                id,
                clinicAct.clinicId,
              ),
            ),
          )
        )
          .filter((vc) => vc !== null)
          .map((vc) => vc!.id);
      }

      // Si vaccin, il doit être associé au même pet que l'animal du meeting
      if (data.vaccination) {
        const animal = await this.animalRepository.findById(
          animalMeeting.animalId,
        );
        const vaccine = await this.vaccineRepository.findById(
          data.vaccination.vaccineId,
        );
        if (vaccine?.petId !== animal?.race.petId) {
          throw new BadRequestError(
            "Le vaccin ne correspond pas à l'espèce de l'animal",
          );
        }
      }
    }

    if (!type) {
      if (data.vaccination) type = "VACCINATION";
      else if (data.surgery) type = "SURGERY";
      else if (data.hospitalization) type = "HOSPITALIZATION";
      else if (data.imaging) type = "IMAGING";
      else if (data.analysis) type = "ANALYSIS";
      else
        throw new BadRequestError("Impossible de déterminer le type de l'acte");
    }

    if (!actId) throw new BadRequestError("actId est obligatoire");
    if (!priceApplied) throw new BadRequestError("price applied");
    // performedAt = date du meeting si disponible, sinon celle passée dans data
    const performedAt = animalMeeting.meeting?.date ?? data.performedAt;
    if (!performedAt) throw new BadRequestError("performedAt est obligatoire");

    return this.repository.create({
      data,
      animalMeetingId: animalMeeting.id,
      animalId: animalMeeting.animalId,
      actId,
      priceApplied,
      performedAt,
      type,
      performedBy,
    });
  }
  async update(id: string, data: UpdateMedicalHistory, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return this.repository.delete(id);
  }

  async getByMeeting(meetingId: string) {
    const acts = await this.repository.findByMeeting(meetingId);
    if (!acts) throw new NotFoundError("acts historys");
    return acts;
  }
  async getByClinic(clinicId: string) {
    const acts = await this.repository.findByMeeting(clinicId);
    if (!acts) throw new NotFoundError("acts historys");
    return acts;
  }
}
