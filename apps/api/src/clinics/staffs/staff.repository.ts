import type {
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
  CreateReferentStaff,
  ClinicId,
  UserId,
  UserRole,
} from "@armali/schemas";
import { PrismaClient } from "../../../prisma/generated/prisma/client";

export class StaffRepository {
  constructor(private prisma: PrismaClient) {}

  // ── Staff d'une clinique ──────────────────────────────────────────────────
  async findStaff(clinicId: string) {
    const [director, referents, vets, secretaries] = await Promise.all([
      this.prisma.directorClinicProfile.findFirst({
        where: { clinic: { id: clinicId } },
        include: { user: { include: { avatar: true } } },
      }),
      this.prisma.referentClinicProfile.findMany({
        where: { clinicId },
        include: { user: { include: { avatar: true } } },
      }),
      this.prisma.veterinarianClinic.findMany({
        where: { clinicId },
        include: {
          veterinarian: {
            include: { user: { include: { avatar: true } } },
          },
        },
      }),
      this.prisma.secretaryProfile.findMany({
        where: { clinicId },
        include: { user: { include: { avatar: true } } },
      }),
    ]);

    return {
      director: director
        ? { ...director.user, role: "DIRECTOR" as const }
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
  async findStaffIds(
    clinicId: ClinicId,
    roles?: UserRole[],
  ): Promise<UserId[]> {
    const wants = (role: UserRole) => !roles || roles.includes(role);

    const [director, referents, secretaries, vets] = await Promise.all([
      wants("DIRECTOR")
        ? this.prisma.directorClinicProfile.findFirst({
            where: { clinic: { id: clinicId } },
            select: { user: { select: { id: true } } },
          })
        : null,
      wants("REFERENT")
        ? this.prisma.referentClinicProfile.findMany({
            where: { clinicId },
            select: { user: { select: { id: true } } },
          })
        : [],
      wants("SECRETARY")
        ? this.prisma.secretaryProfile.findMany({
            where: { clinicId },
            select: { user: { select: { id: true } } },
          })
        : [],
      wants("VETERINARIAN")
        ? this.prisma.veterinarianClinic.findMany({
            where: { clinicId },
            select: {
              veterinarian: { select: { user: { select: { id: true } } } },
            },
          })
        : [],
    ]);

    return [
      director?.user.id,
      ...referents.map((referent) => referent.user.id),
      ...secretaries.map((secretary) => secretary.user.id),
      ...vets.map((vet) => vet.veterinarian.user.id),
    ].filter((id): id is UserId => id !== null && id !== undefined);
  }
  async countStaff(clinicId: ClinicId, roles?: UserRole[]) {
    const wants = (role: UserRole) => !roles || roles.includes(role);

    const [director, referents, secretaries, vets] = await Promise.all([
      wants("DIRECTOR")
        ? this.prisma.directorClinicProfile.count({
            where: { clinic: { id: clinicId } },
          })
        : 0,
      wants("REFERENT")
        ? this.prisma.referentClinicProfile.count({
            where: { clinicId },
          })
        : 0,
      wants("SECRETARY")
        ? this.prisma.secretaryProfile.count({
            where: { clinicId },
          })
        : 0,
      wants("VETERINARIAN")
        ? this.prisma.veterinarianClinic.count({
            where: { clinicId },
          })
        : 0,
    ]);
    return director + referents + vets + secretaries;
  }

  // ── Détail d'un membre du staff ──────────────────────────────────────────
  async findMemberDetailById(memberId: string) {
    return this.prisma.user.findUnique({
      where: { id: memberId },
      include: {
        avatar: true,
        veterinarianProfile: {
          include: {
            veterinarianIdentity: true,
            bankingInfo: true,
            specialities: true,
            veterinarianClinics: true,
          },
        },
        secretaryProfile: {
          include: { bankingInfo: true },
        },
        directorClinicProfile: { include: { clinic: true } },
        referentClinicProfile: true,
      },
    });
  }

  // ── Création d'un vétérinaire ─────────────────────────────────────────────
  async createVeterinarian({
    clinicId,
    data,
    hashedPassword,
  }: {
    clinicId: string;
    data: CreateVeterinarianStaff;
    hashedPassword: string;
  }) {
    const user = await this.prisma.user.create({
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
            ...(data.identity && {
              veterinarianIdentity: { create: data.identity },
            }),
            ...(data.bankingInfo && {
              bankingInfo: { create: data.bankingInfo },
            }),
            ...(data.specialityIds &&
              data.specialityIds.length > 0 && {
                specialities: {
                  connect: data.specialityIds.map((id) => ({ id })),
                },
              }),
          },
        },
      },
      include: {
        avatar: true,
        veterinarianProfile: {
          include: {
            veterinarianIdentity: true,
            bankingInfo: true,
            specialities: true,
          },
        },
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // ── Création d'une secrétaire ─────────────────────────────────────────────
  async createSecretary({
    clinicId,
    data,
    hashedPassword,
  }: {
    clinicId: string;
    data: CreateSecretaryStaff;
    hashedPassword: string;
  }) {
    const user = await this.prisma.user.create({
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
      include: {
        avatar: true,
        secretaryProfile: { include: { bankingInfo: true } },
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createReferent({
    clinicId,
    data,
    hashedPassword,
  }: {
    clinicId: ClinicId;
    data: CreateReferentStaff;
    hashedPassword: string;
  }) {
    const user = await this.prisma.user.create({
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
      include: { avatar: true, referentClinicProfile: true },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
