import {
  ClinicId,
  clinicIdSchema,
  UpdateClinic,
  UserId,
} from "@armali/schemas";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";
import { ClinicRepository } from "./clinic.repository";
import { prisma } from "@api/lib/prisma";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { CLINIC_STAFF_ROLES } from "@api/utils";
import { Clinic } from "../../prisma/generated/prisma/client";
import { withUserAvatar } from "@api/users/user.utils";

export class ClinicService {
  constructor(private repository: ClinicRepository) {}

  async getClinicsByUser(userId: string): Promise<Clinic[]> {
    const clinics = await this.repository.findClinicByUserId(userId);
    if (!clinics) throw new NotFoundError("Clinique");
    if (clinics.some((clinic) => !clinic)) throw new NotFoundError("Clinique");
    return clinics as Clinic[];
  }

  async getClientsByClinic({
    role,
    clinicId,
    authorId,
  }: {
    clinicId: ClinicId;
    authorId: UserId;
    role: UserRole;
  }) {
    if (!CLINIC_STAFF_ROLES.includes(role)) throw new ForbiddenError();

    const clinics = await this.getClinicsByUser(authorId);
    if (!clinics.some(({ id }) => id === clinicId)) {
      throw new ForbiddenError();
    }
    return (await this.repository.findClientsById(clinicId)).map(
      withUserAvatar,
    );
  }
  async getClinicIdsByUserId({
    userId,
    role,
  }: {
    userId: string;
    role: UserRole;
  }): Promise<ClinicId[]> {
    const clinicIds = await this.repository.findClinicIdByUser({
      userId,
      role,
    });
    if (!clinicIds) throw new ForbiddenError();
    return clinicIdSchema.array().parse(clinicIds);
  }

  async getClinicIdByUserId({
    userId,
    role,
  }: {
    userId: string;
    role: UserRole;
  }): Promise<ClinicId> {
    if (role !== "DIRECTOR" && role !== "REFERENT" && role !== "SECRETARY")
      throw new ForbiddenError();
    const clinicIds = await this.repository.findClinicIdByUser({
      userId,
      role,
    });
    if (!clinicIds) throw new ForbiddenError();
    if (clinicIds.length !== 1)
      throw new ConflictError("Number of clinicId is not valid");
    return clinicIdSchema.parse(clinicIds[0]);
  }
  async updateClinic({
    userId,
    role,
    data,
  }: {
    userId: UserId;
    role: UserRole;
    data: UpdateClinic;
  }) {
    const clinicIds = await this.getClinicIdsByUserId({ userId, role });

    if (!clinicIds) throw new NotFoundError("clinic");
    if (clinicIds.length !== 1)
      throw new ConflictError("Multiple clinics associated with the user");

    return this.repository.update(clinicIds[0], data);
  }

  async getClinics() {
    return this.repository.findAll();
  }

  async deleteClinic(clinicId: string) {
    const clinic = await this.repository.findClinicById(clinicId);
    if (!clinic) throw new NotFoundError("Clinique");

    const { orderCount, meetingCount, appointmentCount, medicalHistoryCount } =
      await this.repository.countClinicDependencies(clinicId);

    const reasons: string[] = [];
    if (orderCount > 0)
      reasons.push(
        `${orderCount} commande${orderCount > 1 ? "s" : ""} en cours ou passée${orderCount > 1 ? "s" : ""}`,
      );
    if (meetingCount > 0)
      reasons.push(
        `${meetingCount} réunion${meetingCount > 1 ? "s" : ""} interne${meetingCount > 1 ? "s" : ""}`,
      );
    if (appointmentCount > 0)
      reasons.push(
        `${appointmentCount} rendez-vous vétérinaire${appointmentCount > 1 ? "s" : ""}`,
      );
    if (medicalHistoryCount > 0)
      reasons.push(
        `${medicalHistoryCount} entrée${medicalHistoryCount > 1 ? "s" : ""} d'historique médical`,
      );

    if (reasons.length > 0) {
      throw new BadRequestError(
        `Impossible de supprimer la clinique « ${clinic.name} » car elle a encore : ${reasons.join(", ")}. Veuillez d'abord supprimer ou transférer ces éléments.`,
      );
    }

    await this.repository.deleteClinicById(clinicId);
    return { message: "Clinique supprimée" };
  }

  private async getClinicIdForDirectorOrReferent(
    userId: string,
  ): Promise<string> {
    const director = await prisma.directorClinicProfile.findUnique({
      where: { id: userId },
      include: { clinic: true },
    });
    if (director?.clinic) return director.clinic.id;

    const referent = await prisma.referentClinicProfile.findUnique({
      where: { id: userId },
    });
    if (referent) return referent.clinicId;

    throw new BadRequestError("Aucune clinique associée à ce compte");
  }

  async updateClinicImage(userId: string, imagePath: string) {
    const clinicId = await this.getClinicIdForDirectorOrReferent(userId);

    return prisma.clinic.update({
      where: { id: clinicId },
      data: { image: imagePath },
    });
  }
}
