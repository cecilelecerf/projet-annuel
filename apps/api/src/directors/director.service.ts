import { hash } from "bcryptjs";
import { prisma } from "@api/lib/prisma";
import { BadRequestError, ConflictError } from "@api/errors";
import type {
  CreateReferentStaff,
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
  CreateClinicRequest,
} from "@armali/schemas";

export class DirectorService {
  private async getClinicId(directorUserId: string): Promise<string> {
    const profile = await prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
    });
    if (!profile)
      throw new BadRequestError(
        "Aucune clinique associée à ce compte directeur",
      );
    return profile.clinicId;
  }

  async createReferent(directorUserId: string, data: CreateReferentStaff) {
    const clinicId = await this.getClinicId(directorUserId);
    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        password: hashedPassword,
        role: "REFERENT",
        referentClinicProfile: {
          create: { clinicId },
        },
      },
      include: { referentClinicProfile: true },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createVeterinarian(
    directorUserId: string,
    data: CreateVeterinarianStaff,
  ) {
    const clinicId = await this.getClinicId(directorUserId);
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
            veterinarianClinic: {
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

  async createSecretary(directorUserId: string, data: CreateSecretaryStaff) {
    const clinicId = await this.getClinicId(directorUserId);
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

  async getClinicStaff(directorUserId: string) {
    const clinicId = await this.getClinicId(directorUserId);

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
        role: "REFERENT" as const,
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

  async getClinicStatus(directorUserId: string) {
    const profile = await prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
      include: { clinic: true },
    });
    if (profile) return { status: "APPROVED" as const, clinic: profile.clinic };

    const latestRequest = await prisma.clinicCreationRequest.findFirst({
      where: { directorId: directorUserId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestRequest) return { status: "NONE" as const };
    if (latestRequest.status === "PENDING")
      return { status: "PENDING" as const, request: latestRequest };
    if (latestRequest.status === "REJECTED")
      return { status: "REJECTED" as const, request: latestRequest };

    return { status: "NONE" as const };
  }

  async requestClinic(directorUserId: string, data: CreateClinicRequest) {
    const profile = await prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
    });
    if (profile)
      throw new BadRequestError("Vous avez déjà une clinique approuvée");

    const pendingRequest = await prisma.clinicCreationRequest.findFirst({
      where: { directorId: directorUserId, status: "PENDING" },
    });
    if (pendingRequest)
      throw new ConflictError(
        "Vous avez déjà une demande en attente de validation",
      );

    const existingClinic = await prisma.clinic.findUnique({
      where: { siret: data.siret },
    });
    if (existingClinic)
      throw new ConflictError("Une clinique avec ce numéro SIRET existe déjà");

    const siretPending = await prisma.clinicCreationRequest.findFirst({
      where: { siret: data.siret, status: "PENDING" },
    });
    if (siretPending)
      throw new ConflictError(
        "Une demande avec ce numéro SIRET est déjà en attente",
      );

    return prisma.clinicCreationRequest.create({
      data: { ...data, directorId: directorUserId },
    });
  }

  async getMyRequests(directorUserId: string) {
    return prisma.clinicCreationRequest.findMany({
      where: { directorId: directorUserId },
      orderBy: { createdAt: "desc" },
    });
  }
}
