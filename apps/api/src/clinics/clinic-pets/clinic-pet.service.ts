import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { ClinicRepository } from "../clinic.repository";
import { PetRepository } from "@api/pets/pet.repository";
import type { ClinicId, PetId, UserId, UserRole } from "@armali/schemas";
import { ClinicService } from "../clinic.service";

const CLINIC_OWNER_ROLES: UserRole[] = ["DIRECTOR", "REFERENT"];

export class ClinicPetService {
  constructor(
    private clinicRepository: ClinicRepository,
    private petRepository: PetRepository,
    private clinicService: ClinicService,
  ) {}

  async getAcceptedPets(clinicId: ClinicId) {
    const pets = await this.clinicRepository.getAcceptedPets(clinicId);
    if (pets === null) throw new NotFoundError("Clinique");
    return pets;
  }

  private async assertClinicAccess(userId: UserId, clinicId: ClinicId) {
    const clinics = await this.clinicService.getClinicsByUser(userId);
    if (!clinics.some(({ id }) => id === clinicId)) {
      throw new ForbiddenError();
    }
  }

  async setAcceptedPets(
    clinicId: ClinicId,
    petIds: PetId[],
    role: UserRole,
    userId: UserId,
  ) {
    if (!CLINIC_OWNER_ROLES.includes(role)) throw new ForbiddenError();
    await this.assertClinicAccess(userId, clinicId);

    if (petIds.length > 0) {
      const uniqueIds = new Set(petIds);
      if (uniqueIds.size !== petIds.length) {
        throw new BadRequestError("La liste des espèces contient des doublons");
      }

      const foundPets = await Promise.all(
        petIds.map((id) => this.petRepository.findById(id)),
      );
      if (foundPets.some((p) => !p)) {
        throw new NotFoundError("Une ou plusieurs espèces sont introuvables");
      }
    }

    return this.clinicRepository.setAcceptedPets(clinicId, petIds);
  }
}
