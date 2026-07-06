import { UserRepository } from "@api/users/user.repository";
import { ForbiddenError, NotFoundError } from "@api/errors";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { User } from "../../prisma/generated/prisma/client";
import { flatClinicId } from "./user.utils";
import { isStaff, STAFF_ROLES } from "@api/utils";
import { UserWithProfileAndClinicId } from "./user.types";
import { ClinicService } from "@api/clinics/clinic.service";
import { UserId } from "@armali/schemas";

export class UserService {
  constructor(
    private repository: UserRepository,
    private clinicService: ClinicService,
  ) {}

  async getAllUsers(): Promise<Omit<User, "password">[]> {
    return await this.repository.getAllUsers();
  }

  async getUsers(userId: string, role: UserRole) {
    const clinicIds = await this.clinicService.getClinicIdsByUserId({
      userId,
      role,
    });
    console.log(clinicIds);
    return this.repository.getUsersByClinic({ clinicIds });
  }

  async getUsersByRoles(
    userId: UserId,
    role: UserRole,
    targetRole: UserRole[],
  ) {
    if (role === "ADMIN") {
      const users = await this.repository.getAllUsersByRole({
        roles: targetRole,
      });
      return users.map(flatClinicId);
    }
    if (targetRole.includes("ADMIN")) throw new ForbiddenError();

    let clients: User[] = [];
    if (targetRole.includes("CLIENT")) {
      clients = await this.repository.getAllUsersByRole({ roles: ["CLIENT"] });
    }

    const nonClientRoles = targetRole.filter((r) => r !== "CLIENT");
    let staffs: User[] = [];

    if (nonClientRoles.length > 0) {
      const clinicIds = await this.clinicService.getClinicIdsByUserId({
        userId,
        role,
      });
      const staffsByClinic = await Promise.all(
        clinicIds.flatMap((id) =>
          this.clinicService.getStaffByClinicRole({
            clinicId: id,
            role,
            authorId: userId,
            targetRoles: nonClientRoles,
          }),
        ),
      );

      staffs = staffsByClinic.flat();
    }

    return [...clients, ...staffs];
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

    // CLIENT → accessible par tout staff
    return user;
  }
}
