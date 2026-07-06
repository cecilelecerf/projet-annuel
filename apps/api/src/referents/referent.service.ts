import { hash } from "bcryptjs";
import { prisma } from "@api/lib/prisma";
import { BadRequestError } from "@api/errors";
import type {
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
  UpdateClinicReferent,
} from "@armali/schemas";

export class ReferentService {
  private async getClinicId(referentUserId: string): Promise<string> {
    const profile = await prisma.referentClinicProfile.findUnique({
      where: { id: referentUserId },
    });
    if (!profile)
      throw new BadRequestError(
        "Aucune clinique associée à ce compte référent",
      );
    return profile.clinicId;
  }

  async getClinicStaff(referentUserId: string) {
    const clinicId = await this.getClinicId(referentUserId);

    const [directorProfile, referents, vets, secretaries] = await Promise.all([
      prisma.directorClinicProfile.findFirst({
        where: { clinicId },
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      }),
      prisma.referentClinicProfile.findMany({
        where: { clinicId },
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      }),
      prisma.veterinarianClinic.findMany({
        where: { clinicId },
        include: {
          veterinarian: {
            include: {
              user: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.secretaryProfile.findMany({
        where: { clinicId },
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      }),
    ]);

    return {
      director: directorProfile
        ? { ...directorProfile.user, role: "DIRECTOR" as const }
        : null,
      referents: referents.map((r) => ({
        ...r.user,
        role: "REFERANT" as const,
      })),
      veterinarians: vets.map((v) => ({
        ...v.veterinarian.user,
        role: "VETERINARIAN" as const,
        licenseNumber: v.veterinarian.licenseNumber,
      })),
      secretaries: secretaries.map((s) => ({
        ...s.user,
        role: "SECRETARY" as const,
      })),
    };
  }

  async createVeterinarian(
    referentUserId: string,
    data: CreateVeterinarianStaff,
  ) {
    const clinicId = await this.getClinicId(referentUserId);
    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        password: hashedPassword,
        role: "VETERINARIAN",
        veterinarianProfile: {
          create: {
            licenseNumber: data.licenseNumber,
            bio: data.bio,
            veterinarianClinics: {
              create: { clinicId },
            },
          },
        },
      },
      include: { veterinarianProfile: true },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createSecretary(referentUserId: string, data: CreateSecretaryStaff) {
    const clinicId = await this.getClinicId(referentUserId);
    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        password: hashedPassword,
        role: "SECRETARY",
        secretaryProfile: {
          create: { clinicId },
        },
      },
      include: { secretaryProfile: true },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateClinic(referentUserId: string, data: UpdateClinicReferent) {
    const clinicId = await this.getClinicId(referentUserId);

    return prisma.clinic.update({
      where: { id: clinicId },
      data,
    });
  }
}
