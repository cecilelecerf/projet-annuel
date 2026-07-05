import { UserRepository } from "@api/users/user.repository";
import { ForbiddenError, NotFoundError } from "@api/errors";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { User } from "../../prisma/generated/prisma/client";
import { flatClinicId } from "./user.utils";
import { isStaff } from "@api/utils";

export class UserService {
  constructor(private repository: UserRepository) {}

  async getAllUsers(): Promise<Omit<User, "password">[]> {
    return await this.repository.getAllUsers();
  }

  async getClinicId({
    userId,
    role,
  }: {
    userId: string;
    role: UserRole;
  }): Promise<string[]> {
    const clinicId = await this.repository.getClinicIdByUserId({
      id: userId,
      role,
    });
    if (!clinicId) throw new ForbiddenError();
    return clinicId;
  }

  async getUsers(userId: string, role: UserRole) {
    const clinicIds = await this.getClinicId({ userId, role });
    return this.repository.getUsersByClinic({ clinicIds });
  }

  async getUsersByRoles(
    userId: string,
    role: UserRole,
    targetRole: UserRole[],
  ) {
    if (role === "ADMIN") {
      const users = await this.repository.getAllUsersByRole({
        roles: targetRole,
      });
      return users.map(flatClinicId);
    }

    const clinicIds = await this.getClinicId({ userId, role });
    const nonClientRoles = targetRole.filter((r) => r !== "CLIENT");
    const [clients, staffs] = await Promise.all([
      targetRole.includes("CLIENT")
        ? this.repository.getAllUsersByRole({ roles: ["CLIENT"] })
        : Promise.resolve([]),
      nonClientRoles.length > 0
        ? this.repository.getUsersByRoleAndClinic({
            clinicIds,
            roles: nonClientRoles,
          })
        : Promise.resolve([]),
    ]);

    return [...clients, ...staffs].map(flatClinicId);
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
      const clinicIds = await this.getClinicId({
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
