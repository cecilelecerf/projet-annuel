import { PetId, SpecialityId, UserId } from "@armali/schemas";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export class VeterinarianProfileRepository {
  constructor(private prisma: PrismaClient) {}

  async getAcceptedPets(userId: UserId) {
    const veterinarian = await this.prisma.veterinarianProfile.findUnique({
      where: { id: userId },
      include: { pets: { orderBy: { name: "asc" } } },
    });
    return veterinarian?.pets ?? null;
  }

  async setAcceptedPets(userId: UserId, petIds: PetId[]) {
    const veterinarian = await this.prisma.veterinarianProfile.update({
      where: { id: userId },
      data: {
        pets: {
          set: petIds.map((id) => ({ id })),
        },
      },
      include: { pets: { orderBy: { name: "asc" } } },
    });
    return veterinarian.pets;
  }

  async getAcceptedSpecialities(userId: UserId) {
    const veterinarian = await this.prisma.veterinarianProfile.findUnique({
      where: { id: userId },
      include: { specialities: { orderBy: { name: "asc" } } },
    });
    return veterinarian?.specialities ?? null;
  }

  async setAcceptedSpecialities(userId: UserId, specialityIds: SpecialityId[]) {
    const veterinarian = await this.prisma.veterinarianProfile.update({
      where: { id: userId },
      data: {
        specialities: {
          set: specialityIds.map((id) => ({ id })),
        },
      },
      include: { specialities: { orderBy: { name: "asc" } } },
    });
    return veterinarian.specialities;
  }

  async findClinicIds(userId: string): Promise<string[]> {
    const profile = await this.prisma.veterinarianProfile.findUnique({
      where: { id: userId },
      include: { veterinarianClinics: { select: { clinicId: true } } },
    });
    return profile?.veterinarianClinics.map((vc) => vc.clinicId) ?? [];
  }
}