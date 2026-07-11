import { hash } from "bcryptjs";
import { prisma } from "@api/lib/prisma";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";
import { generateTemporaryPassword } from "@api/utils/password";
import { EmailService } from "@api/emails/email.service";
import { VeterinarianClinicService } from "@api/clinics/veterinarian-clinics/veterinarian-clinic.service";
import type {
  CreateReferentStaff,
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
  CreateClinicRequest,
} from "@armali/schemas";
import { UserRole } from "../../prisma/generated/prisma/enums";

const DELETABLE_ROLES: UserRole[] = ["REFERANT", "VETERINARIAN", "SECRETARY"];

const emailService = new EmailService();
const veterinarianClinicService = new VeterinarianClinicService();

export class DirectorService {
  private async getClinic(
    directorUserId: string,
  ): Promise<{ id: string; name: string }> {
    const profile = await prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
      include: { clinic: { select: { id: true, name: true } } },
    });
    if (!profile)
      throw new BadRequestError(
        "Aucune clinique associée à ce compte directeur",
      );
    return profile.clinic;
  }

  private async getClinicId(directorUserId: string): Promise<string> {
    return (await this.getClinic(directorUserId)).id;
  }

  async createReferent(directorUserId: string, data: CreateReferentStaff) {
    const clinic = await this.getClinic(directorUserId);
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hash(temporaryPassword, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        password: hashedPassword,
        role: "REFERANT",
        referentClinicProfile: {
          create: { clinicId: clinic.id },
        },
      },
      include: { referentClinicProfile: true },
    });

    emailService
      .sendStaffAccountCreated(
        user.email,
        user.firstname,
        temporaryPassword,
        "référent",
        clinic.name,
      )
      .catch(() => {});

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createVeterinarian(
    directorUserId: string,
    data: CreateVeterinarianStaff,
  ) {
    const clinic = await this.getClinic(directorUserId);
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hash(temporaryPassword, 10);

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
              create: { clinicId: clinic.id },
            },
          },
        },
      },
      include: { veterinarianProfile: true },
    });

    emailService
      .sendStaffAccountCreated(
        user.email,
        user.firstname,
        temporaryPassword,
        "vétérinaire",
        clinic.name,
      )
      .catch(() => {});

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createSecretary(directorUserId: string, data: CreateSecretaryStaff) {
    const clinic = await this.getClinic(directorUserId);
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hash(temporaryPassword, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        password: hashedPassword,
        role: "SECRETARY",
        secretaryProfile: {
          create: { clinicId: clinic.id },
        },
      },
      include: { secretaryProfile: true },
    });

    emailService
      .sendStaffAccountCreated(
        user.email,
        user.firstname,
        temporaryPassword,
        "secrétaire",
        clinic.name,
      )
      .catch(() => {});

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async searchVeterinarian(directorUserId: string, query: string) {
    const clinicId = await this.getClinicId(directorUserId);
    const q = query.trim();
    if (!q)
      throw new BadRequestError(
        "Veuillez indiquer un email ou un numéro de licence",
      );

    const profiles = await prisma.veterinarianProfile.findMany({
      where: {
        OR: [
          { licenseNumber: { equals: q, mode: "insensitive" } },
          { user: { email: { equals: q, mode: "insensitive" } } },
        ],
      },
      include: {
        user: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
        veterinarianClinic: { select: { clinicId: true } },
      },
      take: 10,
    });

    return profiles
      .filter((p) => !p.veterinarianClinic.some((vc) => vc.clinicId === clinicId))
      .map((p) => ({
        id: p.user.id,
        firstname: p.user.firstname,
        lastname: p.user.lastname,
        email: p.user.email,
        licenseNumber: p.licenseNumber,
      }));
  }

  async linkVeterinarian(directorUserId: string, veterinarianId: string) {
    const clinic = await this.getClinic(directorUserId);

    const vetProfile = await prisma.veterinarianProfile.findUnique({
      where: { id: veterinarianId },
      include: { user: { select: { firstname: true, email: true } } },
    });
    if (!vetProfile) throw new NotFoundError("Vétérinaire");

    const linked = await veterinarianClinicService.create({
      veterinarianId,
      clinicId: clinic.id,
      role: "DIRECTOR",
    });

    emailService
      .sendClinicLinked(vetProfile.user.email, vetProfile.user.firstname, clinic.name)
      .catch(() => {});

    return linked;
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

  async getClinicStatus(directorUserId: string) {
    const profile = await prisma.directorClinicProfile.findUnique({
      where: { id: directorUserId },
      include: { clinic: { include: { speciality: true } } },
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

  async linkSpeciality(directorUserId: string, specialityId: string) {
    const clinicId = await this.getClinicId(directorUserId);
    return prisma.clinic.update({
      where: { id: clinicId },
      data: { speciality: { connect: { id: specialityId } } },
      include: { speciality: true },
    });
  }

  async unlinkSpeciality(directorUserId: string, specialityId: string) {
    const clinicId = await this.getClinicId(directorUserId);
    return prisma.clinic.update({
      where: { id: clinicId },
      data: { speciality: { disconnect: { id: specialityId } } },
      include: { speciality: true },
    });
  }

  async deleteStaffMember(directorUserId: string, targetId: string) {
    const clinicId = await this.getClinicId(directorUserId);

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundError("Utilisateur");
    if (!DELETABLE_ROLES.includes(target.role)) throw new ForbiddenError();

    // Un vétérinaire peut travailler dans plusieurs cliniques : on ne
    // supprime que son rattachement à celle-ci, jamais son compte ni son
    // historique de rendez-vous/dossiers médicaux.
    if (target.role === "VETERINARIAN") {
      const link = await prisma.veterinarianClinic.findFirst({
        where: { veterinarianId: targetId, clinicId },
      });
      if (!link) throw new NotFoundError("Utilisateur");

      await prisma.veterinarianClinic.delete({ where: { id: link.id } });
      return { message: "Vétérinaire retiré de la clinique" };
    }

    let targetClinicId: string | undefined;
    if (target.role === "REFERANT") {
      targetClinicId = (
        await prisma.referentClinicProfile.findUnique({ where: { id: targetId } })
      )?.clinicId;
    } else if (target.role === "SECRETARY") {
      targetClinicId = (
        await prisma.secretaryProfile.findUnique({ where: { id: targetId } })
      )?.clinicId;
    }

    if (targetClinicId !== clinicId) throw new NotFoundError("Utilisateur");

    await prisma.user.delete({ where: { id: targetId } });
    return { message: "Compte supprimé" };
  }

  async getAnalyticsOverview(directorUserId: string) {
    const clinicId = await this.getClinicId(directorUserId);

    const meetings = await prisma.animalMeeting.findMany({
      where: { veterinarianClinic: { clinicId } },
      select: { animal: { select: { clientId: true } } },
    });

    const visitCountByClient = new Map<string, number>();
    for (const m of meetings) {
      visitCountByClient.set(
        m.animal.clientId,
        (visitCountByClient.get(m.animal.clientId) ?? 0) + 1,
      );
    }
    const totalClients = visitCountByClient.size;
    const returningClients = Array.from(visitCountByClient.values()).filter(
      (count) => count >= 2,
    ).length;
    const retentionRate =
      totalClients > 0 ? (returningClients / totalClients) * 100 : 0;

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

    const [vets, histories] = await Promise.all([
      prisma.veterinarianClinic.findMany({
        where: { clinicId },
        include: {
          veterinarian: {
            include: {
              user: { select: { firstname: true, lastname: true } },
            },
          },
        },
      }),
      prisma.animalMedicalHistory.findMany({
        where: {
          performedAt: { gte: twelveMonthsAgo },
          performedBy: { some: { clinicId } },
        },
        select: {
          priceApplied: true,
          performedBy: {
            where: { clinicId },
            select: { veterinarianId: true },
          },
        },
      }),
    ]);

    const revenueByVet = new Map<string, number>();
    for (const h of histories) {
      const price = h.priceApplied ? Number(h.priceApplied) : 0;
      for (const vc of h.performedBy) {
        revenueByVet.set(
          vc.veterinarianId,
          (revenueByVet.get(vc.veterinarianId) ?? 0) + price,
        );
      }
    }

    const profitabilityByVeterinarian = vets
      .map((vc) => ({
        veterinarianId: vc.veterinarianId,
        firstname: vc.veterinarian.user.firstname,
        lastname: vc.veterinarian.user.lastname,
        revenue: revenueByVet.get(vc.veterinarianId) ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      retention: { totalClients, returningClients, retentionRate },
      profitabilityByVeterinarian,
    };
  }
}
