import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { ClinicRepository } from "../clinic.repository";
import type { ClinicId, SpecialityId, UserId, UserRole } from "@armali/schemas";
import { SpecialityRepository } from "@api/specialities/speciality.repository";

const CLINIC_OWNER_ROLES: UserRole[] = ["DIRECTOR", "REFERENT"];

export class ClinicSpecialityService {
  constructor(
    private clinicRepository: ClinicRepository,
    private specialityRepository: SpecialityRepository,
  ) {}

  async getAcceptedSpecialities(clinicId: ClinicId) {
    const specialities =
      await this.clinicRepository.getAcceptedSpecialities(clinicId);
    if (specialities === null) throw new NotFoundError("Clinique");
    return specialities;
  }

  async setAcceptedSpecialities(
    clinicId: ClinicId,
    specialityIds: SpecialityId[],
    role: UserRole,
    userId: UserId,
  ) {
    if (!CLINIC_OWNER_ROLES.includes(role)) throw new ForbiddenError();
    //   TODO : avec le userId verifier si appartient à la clinic
    // if (userClinicId !== clinicId) throw new ForbiddenError();

    if (specialityIds.length > 0) {
      const uniqueIds = new Set(specialityIds);
      if (uniqueIds.size !== specialityIds.length) {
        throw new BadRequestError("La liste des espèces contient des doublons");
      }

      const foundSpecialities = await Promise.all(
        specialityIds.map((id) => this.specialityRepository.findById(id)),
      );
      if (foundSpecialities.some((p) => !p)) {
        throw new NotFoundError("Une ou plusieurs espèces sont introuvables");
      }
    }

    return this.clinicRepository.setAcceptedSpecialities(
      clinicId,
      specialityIds,
    );
  }
}
