import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { AnimalMedicalHistoryRepository } from "./medical-history.repository";
import type {
  AnimalId,
  CreateFreeMedicalHistory,
  CreateMedicalHistory,
  CreateMettingMedicalHistory,
  UpdateMedicalHistory,
  UserRole,
  VeterinarianClinicId,
} from "@armali/schemas";
import { AnimalMeetingRepository } from "@api/meetings/animal-meeting/animal-meeting.repository";
import { VeterinarianClinicRepository } from "@api/veterinarian-clinics/veterinarian-clinic.repository";
import { AnimalRepository } from "@api/animals/animal.repository";
import { ActRepository } from "@api/acts/act.repository";
import { isStaff } from "@api/utils";
import { Decimal } from "../../prisma/generated/prisma/internal/prismaNamespace";
import { VaccineRepository } from "@api/vaccines/vaccine.repository";
import { ClinicActRepository } from "@api/clinic-acts/clinic-act.repository";
import { withUserAvatar } from "@api/users/user.utils";
import { File } from "../../prisma/generated/prisma/client";

const ALLOWED_ROLES: UserRole[] = ["CLIENT", "VETERINARIAN", "SECRETARY"];

export class AnimalMedicalHistoryService {
  constructor(
    private repository: AnimalMedicalHistoryRepository,
    private animalMeetingRepository: AnimalMeetingRepository,
    private animalRepository: AnimalRepository,
    private actRepository: ActRepository,
    private vaccineRepository: VaccineRepository,
    private veterinarianClinicRepository: VeterinarianClinicRepository,
    private clinicActRepository: ClinicActRepository,
  ) {}
  private formatMedicalHistory<
    T extends {
      performedBy?: { veterinarian: { user: { avatar: File | null } } } | null;
    },
  >(history: T) {
    if (!history.performedBy) return history;

    return {
      ...history,
      performedBy: {
        ...history.performedBy,
        veterinarian: withUserAvatar(history.performedBy.veterinarian),
      },
    };
  }

  private formatMedicalHistories<
    T extends {
      performedBy?: { veterinarian: { user: { avatar: File | null } } } | null;
    },
  >(histories: T[]) {
    return histories.map((h) => this.formatMedicalHistory(h));
  }

  /**
   * Vérifie que l'utilisateur staff connecté appartient bien à la clinique
   * concernée. Lève ForbiddenError sinon.
   */
  private async assertStaffBelongsToClinic(userId: string, clinicId: string) {
    const veterinarianClinic =
      await this.veterinarianClinicRepository.findByVeterinarianAndClinic(
        userId,
        clinicId,
      );
    if (!veterinarianClinic) {
      throw new ForbiddenError(
        "Vous n'appartenez pas à la clinique de cet acte",
      );
    }
    return veterinarianClinic;
  }

  // ── Create : dispatch selon la présence de meetingId ──────────────────────

  async create(data: CreateMedicalHistory, role: UserRole, userId: string) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();

    const act =
      data.type === "meeting"
        ? await this.createFromMeeting(data, role, userId)
        : await this.createFree(data, role, userId);
    return this.formatMedicalHistory(act);
  }

  /**
   * Flow "libre" — CLIENT ou staff, saisie sans RDV (historique passé,
   * nouveau client). Aucun clinicActId/prix/intervenant.
   */
  private async createFree(
    data: CreateFreeMedicalHistory,
    role: UserRole,
    userId: string,
  ) {
    if (!data.actId) throw new BadRequestError("actId est obligatoire");
    const act = await this.actRepository.findById(data.actId);
    if (!act) throw new NotFoundError("Acte");

    const animal = await this.animalRepository.findById(data.animalId);
    if (!animal) throw new NotFoundError("Animal");

    // Le client ne peut saisir que sur ses propres animaux
    if (role === "CLIENT" && animal.clientId !== userId) {
      throw new ForbiddenError();
    }
    // Le staff ne peut saisir que sur un animal suivi par sa clinique
    if (isStaff(role) && animal.attendingVeterinarianClinic) {
      await this.assertStaffBelongsToClinic(
        userId,
        animal.attendingVeterinarianClinic.clinicId,
      );
    }

    if (!data.performedAt) {
      throw new BadRequestError("performedAt est obligatoire");
    }

    return this.repository.create({
      data,
      animalMeetingId: null,
      animalId: data.animalId,
      actId: data.actId,
      priceApplied: null,
      performedAt: data.performedAt,
      type: act.type,
    });
  }

  /**
   * Flow "RDV" — staff uniquement, acte réalisé pendant un meeting.
   * clinicActId obligatoire, doit appartenir à la clinique du staff.
   */
  private async createFromMeeting(
    data: CreateMettingMedicalHistory,
    role: UserRole,
    userId: string,
  ) {
    if (!isStaff(role)) throw new ForbiddenError();
    if (!data.animalMeetingId)
      throw new BadRequestError("meetingId est obligatoire");
    const animalMeeting = await this.animalMeetingRepository.findById(
      data.animalMeetingId,
    );
    if (!animalMeeting) throw new NotFoundError("animalMeeting");

    if (!data.clinicActId) {
      throw new BadRequestError("clinicActId est obligatoire pour le staff");
    }

    const clinicAct = await this.clinicActRepository.findById(data.clinicActId);
    if (!clinicAct) throw new NotFoundError("clinic act");

    // L'utilisateur connecté doit appartenir à la clinique de l'acte
    await this.assertStaffBelongsToClinic(userId, clinicAct.clinicId);

    const veterinarianClinic = await this.veterinarianClinicRepository.findById(
      animalMeeting.veterinarianClinicId as VeterinarianClinicId,
    );
    if (!veterinarianClinic) throw new NotFoundError("veterinarian clinic");
    if (veterinarianClinic.clinicId !== clinicAct.clinicId) {
      throw new BadRequestError(
        "Le meeting et l'acte ne sont pas de la même clinique",
      );
    }

    const type = clinicAct.act.type;
    const priceApplied = data.priceApplied
      ? new Decimal(data.priceApplied)
      : clinicAct.price;

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

    const performedAt = animalMeeting.meeting?.date ?? data.performedAt;
    if (!performedAt) throw new BadRequestError("performedAt est obligatoire");

    return await this.repository.create({
      data: {
        ...data,
        performedById: veterinarianClinic.id as VeterinarianClinicId,
      },
      animalMeetingId: animalMeeting.id,
      animalId: animalMeeting.animalId,
      actId: clinicAct.actId,
      priceApplied,
      performedAt,
      type,
    });
  }

  // ── Update / Delete ─────────────────────────────────────────────────────

  async update(
    id: string,
    data: UpdateMedicalHistory,
    role: UserRole,
    userId: string,
  ) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Acte");

    await this.assertCanMutate(existing, role, userId);

    if (data.clinicActId && data.clinicActId !== existing.clinicActId) {
      if (!isStaff(role)) throw new ForbiddenError();
      const clinicAct = await this.clinicActRepository.findById(
        data.clinicActId,
      );
      if (!clinicAct) throw new NotFoundError("clinic act");
      await this.assertStaffBelongsToClinic(userId, clinicAct.clinicId);
    }

    const act = await this.repository.update(id, data);
    return this.formatMedicalHistory(act);
  }

  async delete(id: string, role: UserRole, userId: string) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Acte");

    await this.assertCanMutate(existing, role, userId);

    return this.repository.delete(id);
  }

  private async assertCanMutate(
    existing: { animalId: string; clinicActId?: string | null },
    role: UserRole,
    userId: string,
  ) {
    if (role === "CLIENT") {
      if (existing.clinicActId) {
        throw new ForbiddenError();
      }
      const animal = await this.animalRepository.findById(existing.animalId);
      if (animal?.clientId !== userId) throw new ForbiddenError();
      return;
    }

    if (isStaff(role)) {
      if (existing.clinicActId) {
        const clinicAct = await this.clinicActRepository.findById(
          existing.clinicActId,
        );
        if (clinicAct) {
          await this.assertStaffBelongsToClinic(userId, clinicAct.clinicId);
          return;
        }
      }
      const animal = await this.animalRepository.findById(existing.animalId);
      if (animal?.attendingVeterinarianClinic) {
        await this.assertStaffBelongsToClinic(
          userId,
          animal.attendingVeterinarianClinic.clinicId,
        );
      }
      return;
    }

    throw new ForbiddenError();
  }

  // ── Lectures ────────────────────────────────────────────────────────────

  async getByMeeting(meetingId: string, role: UserRole, userId: string) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();

    const animalMeeting =
      await this.animalMeetingRepository.findById(meetingId);
    if (!animalMeeting) throw new NotFoundError("animalMeeting");

    if (role === "CLIENT") {
      const animal = await this.animalRepository.findById(
        animalMeeting.animalId,
      );
      if (animal?.clientId !== userId) throw new ForbiddenError();
    } else if (isStaff(role) && animalMeeting.veterinarianClinicId) {
      const veterinarianClinic =
        await this.veterinarianClinicRepository.findById(
          animalMeeting.veterinarianClinicId as VeterinarianClinicId,
        );
      if (!veterinarianClinic) throw new NotFoundError("veterinarian clinic");
      await this.assertStaffBelongsToClinic(
        userId,
        veterinarianClinic.clinicId,
      );
    }

    const acts = await this.repository.findByMeeting(meetingId);
    if (!acts) throw new NotFoundError("acts historys");
    return this.formatMedicalHistories(acts);
  }

  async getByClinic(clinicId: string, role: UserRole, userId: string) {
    if (!isStaff(role)) throw new ForbiddenError();
    await this.assertStaffBelongsToClinic(userId, clinicId);

    const acts = await this.repository.findByClinic(clinicId);
    if (!acts) throw new NotFoundError("acts historys");
    return this.formatMedicalHistories(acts);
  }

  async getByAnimal(animalId: AnimalId, role: UserRole, userId: string) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();

    const animal = await this.animalRepository.findById(animalId);
    if (!animal) throw new NotFoundError("Animal");

    if (role === "CLIENT") {
      if (animal.clientId !== userId) throw new ForbiddenError();
    } else if (isStaff(role)) {
      if (!animal.attendingVeterinarianClinic) throw new ForbiddenError();
      await this.assertStaffBelongsToClinic(
        userId,
        animal.attendingVeterinarianClinic.clinicId,
      );
    }

    const acts = await this.repository.findByAnimalId(animalId);
    if (!acts) throw new NotFoundError("acts historys");
    return this.formatMedicalHistories(acts);
  }
}
