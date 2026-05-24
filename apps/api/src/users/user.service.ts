import { UserRepository } from "@api/users/user.repository";
import { ForbiddenError, NotFoundError } from "@api/errors";
import { UserRole } from "../../prisma/generated/prisma/enums";
import { User } from "../../prisma/generated/prisma/client";
import { flatClinicId } from "./user.utils";
import { isStaff } from "@api/utils";
const userRepository = new UserRepository();

export class UserService {
  async getAllUsers(): Promise<Omit<User, "password">[]> {
    return await userRepository.getAllUsers();
  }

  async getClinicId({
    userId,
    role,
  }: {
    userId: string;
    role: UserRole;
  }): Promise<string> {
    const clinicId = await userRepository.getClinicIdByUserId({
      id: userId,
      role,
    });
    if (!clinicId) throw new ForbiddenError();
    return clinicId;
  }

  async getUsers(userId: string, role: UserRole) {
    const clinicId = await this.getClinicId({ userId, role });
    return userRepository.getUsersByClinic({ clinicId });
  }

  async getUsersByRoles(
    userId: string,
    role: UserRole,
    targetRole: UserRole[],
  ) {
    if (role === "ADMIN") {
      const users = await userRepository.getAllUsersByRole({
        roles: targetRole,
      });
      return users.map(flatClinicId);
    }

    const clinicId = await this.getClinicId({ userId, role });
    console.log(clinicId);
    const nonClientRoles = targetRole.filter((r) => r !== "CLIENT");
    const [clients, staffs] = await Promise.all([
      targetRole.includes("CLIENT")
        ? userRepository.getAllUsersByRole({ roles: ["CLIENT"] })
        : Promise.resolve([]),
      nonClientRoles.length > 0
        ? userRepository.getUsersByRoleAndClinic({
            clinicId,
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
    const user = await userRepository.getUserById({ id: targetId });
    if (!user) throw new NotFoundError("Utilisateur");

    // ADMIN voit tout
    if (requesterRole === "ADMIN") return user;

    // Personne ne peut voir un ADMIN
    if (user.role === "ADMIN") throw new ForbiddenError();

    // Staff → vérifie que le user cible est dans la même clinique
    if (isStaff(user.role)) {
      const clinicId = await this.getClinicId({
        userId: requesterId,
        role: requesterRole,
      });
      const usersInClinic = await userRepository.getUsersByClinic({ clinicId });
      if (!usersInClinic.some((u) => u.id === targetId))
        throw new NotFoundError("Utilisateur");
    }

    // CLIENT → accessible par tout staff
    return user;
  }
}
