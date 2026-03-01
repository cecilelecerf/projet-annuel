import { UserRepository } from "@api/repositories/user.repository";
import { ForbiddenError, NotFoundError } from "@api/errors";
import { UserRole } from "apps/api/prisma/generated/prisma/enums";
import { User } from "apps/api/prisma/generated/prisma/client";

const userRepository = new UserRepository();

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return await userRepository.getAllUsers();
  }

  async getClinicId(userId: string, role: UserRole): Promise<string> {
    const clinicId = await userRepository.getClinicIdByUserId({
      id: userId,
      role,
    });
    if (!clinicId) throw new ForbiddenError();
    return clinicId;
  }

  async getUsers(userId: string, role: UserRole) {
    const clinicId = await this.getClinicId(userId, role);
    return userRepository.getUsersByClinic({ clinicId });
  }

  async getUsersByRole(userId: string, role: UserRole, targetRole: UserRole) {
    if (role === "ADMIN") {
      return userRepository.getAllUsersByRole({ role });
    } else {
      const clinicId = await this.getClinicId(userId, role);
      return userRepository.getUsersByRoleAndClinic({
        clinicId,
        role: targetRole,
      });
    }
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
    // ADMIN voit tout
    if (requesterRole === "ADMIN") {
      const user = await userRepository.getUserById({ id: targetId });
      if (!user) throw new NotFoundError("Utilisateur");
      return user;
    }

    // Les autres vérifient que le user cible est dans leur clinic
    const clinicId = await this.getClinicId(requesterId, requesterRole);
    const usersInClinic = await userRepository.getUsersByClinic({ clinicId });
    const user = usersInClinic.find((u) => u.id === targetId);
    if (!user) throw new NotFoundError("Utilisateur");
    return user;
  }
}
