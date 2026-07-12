import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import {
  SpecialityId,
  UserId,
  UserRole,
  VeterinarianId,
} from "@armali/schemas";
import { VeterinarianProfileRepository } from "../veterinarian-profile.repository";
import { SpecialityRepository } from "@api/specialities/speciality.repository";

export class VeterinarianSpecialityService {
  constructor(
    private veterinarianRepository: VeterinarianProfileRepository,
    private specialityRepository: SpecialityRepository,
  ) {}

  async getSpecialities(veterinarianId: VeterinarianId) {
    const specialities =
      await this.veterinarianRepository.getAcceptedSpecialities(veterinarianId);
    if (specialities === null) throw new NotFoundError("Vétérinaire");
    return specialities;
  }

  async setSpecialities(
    veterinarianId: VeterinarianId,
    specialityIds: SpecialityId[],
    role: UserRole,
    userId: UserId,
  ) {
    if (role !== "VETERINARIAN") throw new ForbiddenError();
    if (userId !== veterinarianId) {
      throw new ForbiddenError();
    }

    if (specialityIds.length > 0) {
      const uniqueIds = new Set(specialityIds);
      if (uniqueIds.size !== specialityIds.length) {
        throw new BadRequestError("La liste contient des doublons");
      }
      const found = await Promise.all(
        specialityIds.map((id) => this.specialityRepository.findById(id)),
      );
      if (found.some((p) => !p))
        throw new NotFoundError("Une ou plusieurs espèces sont introuvables");
    }

    return this.veterinarianRepository.setAcceptedSpecialities(
      veterinarianId,
      specialityIds,
    );
  }
}
