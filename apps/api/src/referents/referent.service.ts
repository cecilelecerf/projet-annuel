import { hash } from "bcryptjs";
import { prisma } from "@api/lib/prisma";
import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { generateTemporaryPassword } from "@api/utils/password";
import { EmailService } from "@api/emails/email.service";
import { VeterinarianClinicService } from "@api/clinics/veterinarian-clinics/veterinarian-clinic.service";
import type {
  CreateVeterinarianStaff,
  CreateSecretaryStaff,
  UpdateClinicReferent,
} from "@armali/schemas";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { MeetingService } from "@api/meetings/meeting.service";
import { computeVisitsForecast } from "./visits-forecast.util";

const DELETABLE_ROLES: UserRole[] = ["VETERINARIAN", "SECRETARY"];
const VISITS_WEEKS_HISTORY = 16;
const VISITS_WEEKS_FORECAST = 4;

const meetingService = new MeetingService();

const emailService = new EmailService();
const veterinarianClinicService = new VeterinarianClinicService();

export class ReferentService {
  private async getClinic(
    referentUserId: string,
  ): Promise<{ id: string; name: string }> {
    const profile = await prisma.referentClinicProfile.findUnique({
      where: { id: referentUserId },
      include: { clinic: { select: { id: true, name: true } } },
    });
    if (!profile)
      throw new BadRequestError(
        "Aucune clinique associée à ce compte référent"
      );
    return profile.clinic;
  }

  private async getClinicId(referentUserId: string): Promise<string> {
    return (await this.getClinic(referentUserId)).id;
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

  async createVeterinarian(
    referentUserId: string,
    data: CreateVeterinarianStaff,
  ) {
    const clinic = await this.getClinic(referentUserId);
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

  async createSecretary(referentUserId: string, data: CreateSecretaryStaff) {
    const clinic = await this.getClinic(referentUserId);
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

  async searchVeterinarian(referentUserId: string, query: string) {
    const clinicId = await this.getClinicId(referentUserId);
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

  async linkVeterinarian(referentUserId: string, veterinarianId: string) {
    const clinic = await this.getClinic(referentUserId);

    const vetProfile = await prisma.veterinarianProfile.findUnique({
      where: { id: veterinarianId },
      include: { user: { select: { firstname: true, email: true } } },
    });
    if (!vetProfile) throw new NotFoundError("Vétérinaire");

    const linked = await veterinarianClinicService.create({
      veterinarianId,
      clinicId: clinic.id,
      role: "REFERANT",
    });

    emailService
      .sendClinicLinked(vetProfile.user.email, vetProfile.user.firstname, clinic.name)
      .catch(() => {});

    return linked;
  }

  async updateClinic(referentUserId: string, data: UpdateClinicReferent) {
    const clinicId = await this.getClinicId(referentUserId);

    return prisma.clinic.update({
      where: { id: clinicId },
      data,
    });
  }

  async linkSpeciality(referentUserId: string, specialityId: string) {
    const clinicId = await this.getClinicId(referentUserId);
    return prisma.clinic.update({
      where: { id: clinicId },
      data: { speciality: { connect: { id: specialityId } } },
      include: { speciality: true },
    });
  }

  async unlinkSpeciality(referentUserId: string, specialityId: string) {
    const clinicId = await this.getClinicId(referentUserId);
    return prisma.clinic.update({
      where: { id: clinicId },
      data: { speciality: { disconnect: { id: specialityId } } },
      include: { speciality: true },
    });
  }

  async deleteStaffMember(referentUserId: string, targetId: string) {
    const clinicId = await this.getClinicId(referentUserId);

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

    const targetClinicId = (
      await prisma.secretaryProfile.findUnique({ where: { id: targetId } })
    )?.clinicId;

    if (targetClinicId !== clinicId) throw new NotFoundError("Utilisateur");

    await prisma.user.delete({ where: { id: targetId } });
    return { message: "Compte supprimé" };
  }

  async getVisitsForecast(referentUserId: string) {
    const clinicId = await this.getClinicId(referentUserId);

    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - VISITS_WEEKS_HISTORY * 7);
    const end = now;

    const meetings = await meetingService.getAnimalMeetingsByClinic(
      clinicId,
      start,
      end,
    );

    return computeVisitsForecast(
      meetings.map((m) => new Date(m.date)),
      VISITS_WEEKS_HISTORY,
      VISITS_WEEKS_FORECAST,
    );
  }
}
