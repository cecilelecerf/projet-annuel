import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { PetId, UserId, UserRole, VeterinarianId } from "@armali/schemas";
import { VeterinarianProfileRepository } from "../veterinarian-profile.repository";
import { PetRepository } from "@api/pets/pet.repository";

export class VeterinarianPetService {
  constructor(
    private veterinarianRepository: VeterinarianProfileRepository,
    private petRepository: PetRepository,
  ) {}

  async getPets(veterinarianId: VeterinarianId) {
    const pets =
      await this.veterinarianRepository.getAcceptedPets(veterinarianId);
    if (pets === null) throw new NotFoundError("Vétérinaire");
    return pets;
  }

  async setPets(
    veterinarianId: VeterinarianId,
    petIds: PetId[],
    role: UserRole,
    userId: UserId,
  ) {
    if (role !== "VETERINARIAN") throw new ForbiddenError();
    if (userId !== veterinarianId) {
      throw new ForbiddenError();
    }

    if (petIds.length > 0) {
      const uniqueIds = new Set(petIds);
      if (uniqueIds.size !== petIds.length) {
        throw new BadRequestError("La liste contient des doublons");
      }
      const found = await Promise.all(
        petIds.map((id) => this.petRepository.findById(id)),
      );
      if (found.some((p) => !p))
        throw new NotFoundError("Une ou plusieurs espèces sont introuvables");
    }

    return this.veterinarianRepository.setAcceptedPets(veterinarianId, petIds);
  }
}
