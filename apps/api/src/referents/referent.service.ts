import { hash } from "bcryptjs";
import { prisma } from "@api/lib/prisma";
import { BadRequestError, NotFoundError, ForbiddenError } from "@api/errors";
import type {
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
  UpdateClinicReferent,
  UpdateClinicSpecialities,
} from "@armali/schemas";

export class ReferentService {
  private async getClinicId(referentUserId: string): Promise<string> {
    const profile = await prisma.referentClinicProfile.findUnique({
      where: { id: referentUserId },
    });
    if (!profile)
      throw new BadRequestError(
        "Aucune clinique associée à ce compte référent"
      );
    return profile.clinicId;
  }

  async getClinicStaff(referentUserId: string) {
    const clinicId = await this.getClinicId(referentUserId);

    const [directorProfile, referents, vets, secretaries] = await Promise.all([
      prisma.directorClinicProfile.findFirst({
        where: { clinicId },
        include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
      }),
      prisma.referentClinicProfile.findMany({
        where: { clinicId },
        include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
      }),
      prisma.veterinarianClinic.findMany({
        where: { clinicId },
        include: {
          veterinarian: {
            include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
          },
        },
      }),
      prisma.secretaryProfile.findMany({
        where: { clinicId },
        include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
      }),
    ]);

    return {
      director: directorProfile ? { ...directorProfile.user, role: "DIRECTOR" as const } : null,
      referents: referents.map((r) => ({ ...r.user, role: "REFERANT" as const })),
      veterinarians: vets.map((v) => ({ ...v.veterinarian.user, role: "VETERINARIAN" as const, licenseNumber: v.veterinarian.licenseNumber })),
      secretaries: secretaries.map((s) => ({ ...s.user, role: "SECRETARY" as const })),
    };
  }

  // ── Fiche détail d'un membre du personnel ─────────────────────────────────
  // Vérifie que le membre appartient bien à la clinique du référent avant de renvoyer le détail
  async getStaffMemberDetail(referentUserId: string, memberId: string) {
    const clinicId = await this.getClinicId(referentUserId);

    const user = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        veterinarianProfile: {
          include: {
            veterinarianIdentity: true,
            bankingInfo: true,
            speciality: true,
            veterinarianClinic: true,
          },
        },
        secretaryProfile: {
          include: { bankingInfo: true },
        },
        directorClinicProfile: true,
        referentClinicProfile: true,
      },
    });

    if (!user) throw new NotFoundError("Membre du personnel");

    const belongsToClinic =
      (user.veterinarianProfile?.veterinarianClinic ?? []).some(
        (vc) => vc.clinicId === clinicId,
      ) ||
      user.secretaryProfile?.clinicId === clinicId ||
      user.directorClinicProfile?.clinicId === clinicId ||
      user.referentClinicProfile?.clinicId === clinicId;

    if (!belongsToClinic) throw new ForbiddenError();

    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  async createVeterinarian(referentUserId: string, data: CreateVeterinarianStaff) {
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
            veterinarianClinic: {
              create: { clinicId },
            },
            ...(data.identity && {
              veterinarianIdentity: { create: data.identity },
            }),
            ...(data.bankingInfo && {
              bankingInfo: { create: data.bankingInfo },
            }),
            ...(data.specialityIds &&
              data.specialityIds.length > 0 && {
                speciality: {
                  connect: data.specialityIds.map((id) => ({ id })),
                },
              }),
          },
        },
      },
      include: {
        veterinarianProfile: {
          include: {
            veterinarianIdentity: true,
            bankingInfo: true,
            speciality: true,
          },
        },
      },
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
          create: {
            clinicId,
            ...(data.bankingInfo && {
              bankingInfo: { create: data.bankingInfo },
            }),
          },
        },
      },
      include: { secretaryProfile: { include: { bankingInfo: true } } },
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

  // ── Spécialités de la clinique (relation many-to-many implicite) ─────────

  async getClinicSpecialities(referentUserId: string) {
    const clinicId = await this.getClinicId(referentUserId);
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { speciality: true },
    });
    return clinic?.speciality ?? [];
  }

  async updateClinicSpecialities(
    referentUserId: string,
    data: UpdateClinicSpecialities,
  ) {
    const clinicId = await this.getClinicId(referentUserId);
    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        speciality: {
          set: data.specialityIds.map((id) => ({ id })),
        },
      },
      include: { speciality: true },
    });
    return clinic.speciality;
  }
}