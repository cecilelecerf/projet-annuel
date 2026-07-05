import { hash } from "bcryptjs";
import { prisma } from "@api/lib/prisma";
import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
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

    let targetClinicId: string | undefined;
    if (target.role === "SECRETARY") {
      targetClinicId = (
        await prisma.secretaryProfile.findUnique({ where: { id: targetId } })
      )?.clinicId;
    } else if (target.role === "VETERINARIAN") {
      targetClinicId = (
        await prisma.veterinarianClinic.findFirst({ where: { veterinarianId: targetId } })
      )?.clinicId;
    }

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
