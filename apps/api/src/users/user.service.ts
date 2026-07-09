import { UserRepository } from "@api/users/user.repository";
import { ForbiddenError, NotFoundError } from "@api/errors";
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
    if (role !== "ADMIN") throw new ForbiddenError();
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

    if (requesterRole === "ADMIN") return user;
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
    return user;
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
