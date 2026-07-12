import { UserRepository } from "@api/users/user.repository";
import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { flatClinicId, withAvatarUrl } from "./user.utils";
import { isStaff } from "@api/utils";
import { ClinicService } from "@api/clinics/clinic.service";
import { UserId } from "@armali/schemas";
import { FileService } from "@api/files/file.service";

export class UserService {
  constructor(
    private repository: UserRepository,
    private clinicService: ClinicService,
    private fileService: FileService,
  ) {}

  async getUsersByRoles(
    userId: UserId,
    role: UserRole,
    targetRole?: UserRole[],
  ) {
    if (role !== "ADMIN" && role !== "VETERINARIAN" && role !== "SECRETARY")
      throw new ForbiddenError();
    if (targetRole?.includes("ADMIN") && role !== "ADMIN")
      throw new ForbiddenError();
    const users = await this.repository.getAllUsersByRole({
      roles: targetRole,
    });
    return users.map(flatClinicId);
  }

  async getUserById({
    requesterId,
    requesterRole,
    targetId,
  }: {
    requesterId: string;
    requesterRole: UserRole;
    targetId: string;
  }) {
    const user = await this.repository.getUserById({ id: targetId });
    if (!user) throw new NotFoundError("Utilisateur");

    if (requesterRole === "ADMIN") return withAvatarUrl(user);
    if (user.role === "ADMIN") throw new ForbiddenError();

    if (isStaff(user.role)) {
      const clinicIds = await this.clinicService.getClinicIdsByUserId({
        userId: requesterId,
        role: requesterRole,
      });
      const usersInClinic = await this.repository.getUsersByClinic({
        clinicIds,
      });
      if (!usersInClinic.some((u) => u.id === targetId))
        throw new NotFoundError("Utilisateur");
    }

    // TODO CLIENT → accessible par tout staff
    return withAvatarUrl(user);
  }

  async deleteUser(requesterId: UserId, targetId: string) {
    if (targetId === requesterId) {
      throw new BadRequestError(
        "Vous ne pouvez pas supprimer votre propre compte depuis cette page. Utilisez la suppression de compte depuis votre profil.",
      );
    }

    const user = await this.repository.getUserById({ id: targetId });
    if (!user) throw new NotFoundError("Utilisateur");

    const {
      conversationCount,
      internalMeetingParticipationCount,
      organizedMeetingCount,
      healthConditionCount,
      appointmentCount,
    } = await this.repository.countUserDependencies(targetId);

    const reasons: string[] = [];
    if (appointmentCount > 0)
      reasons.push(
        `${appointmentCount} rendez-vous vétérinaire${appointmentCount > 1 ? "s" : ""}`,
      );
    if (healthConditionCount > 0)
      reasons.push(
        `${healthConditionCount} entrée${healthConditionCount > 1 ? "s" : ""} d'historique médical renseignée${healthConditionCount > 1 ? "s" : ""}`,
      );
    if (organizedMeetingCount > 0)
      reasons.push(
        `${organizedMeetingCount} réunion${organizedMeetingCount > 1 ? "s" : ""} interne${organizedMeetingCount > 1 ? "s" : ""} organisée${organizedMeetingCount > 1 ? "s" : ""}`,
      );
    if (internalMeetingParticipationCount > 0)
      reasons.push(
        `${internalMeetingParticipationCount} participation${internalMeetingParticipationCount > 1 ? "s" : ""} à une réunion interne`,
      );
    if (conversationCount > 0)
      reasons.push(
        `${conversationCount} conversation${conversationCount > 1 ? "s" : ""}`,
      );

    if (reasons.length > 0) {
      throw new BadRequestError(
        `Impossible de supprimer le compte de ${user.firstname} ${user.lastname} car il est encore lié à : ${reasons.join(", ")}. Veuillez d'abord supprimer ou transférer ces éléments.`,
      );
    }

    await this.repository.deleteUserById(targetId);
    return { message: "Compte supprimé" };
  }

  async fileUpload({
    authorId,
    mimeType,
  }: {
    authorId: UserId;
    mimeType: string;
  }) {
    const user = await this.repository.getUserById({
      id: authorId,
    });

    if (!user) {
      throw new NotFoundError("Utilisateur");
    }
    return this.fileService.createUpload({
      entityType: "USER",
      entityId: authorId,
      mimeType,
      type: "IMAGE",
    });
  }

  async confirmAvatarUpload({
    userId,
    fileId,
  }: {
    userId: UserId;
    fileId: string;
  }) {
    const user = await this.repository.getUserById({ id: userId });
    if (!user) throw new NotFoundError("Utilisateur");

    const confirmedFile = await this.fileService.confirmUpload({
      fileId,
      expectedEntityType: "USER",
      expectedEntityId: userId,
    });

    const previousAvatarId = user.avatarId;

    const updatedUser = await this.repository.updateAvatar({
      userId,
      avatarId: confirmedFile.id,
    });
    // Nettoyage de l'ancien avatar, best-effort après le succès du swap
    if (previousAvatarId) {
      await this.fileService.deleteFile(previousAvatarId).catch(() => {
        // log l'échec, ne bloque pas la réponse : l'user a déjà son nouvel avatar
      });
    }
    return withAvatarUrl(updatedUser);
  }
}
