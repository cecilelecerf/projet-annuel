import { UserService } from "@api/services/user.service";
import { BadRequestError } from "@api/errors";
import type { NextFunction, Response } from "express";
import { UserRole } from "apps/api/prisma/generated/prisma/enums";
import { AuthenticatedRequest } from "@api/middlewares/auth.middleware";

const userService = new UserService();

const VALID_ROLES: UserRole[] = [
  "CLIENT",
  "SECRETARY",
  "VETERINARIAN",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
];

export class UserController {
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, role } = req.user;
      const users =
        role === "ADMIN"
          ? await userService.getAllUsers()
          : await userService.getUsers(id, role);
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  async getUsersByRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id, role } = req.user;
      const targetRole = Array.isArray(req.params.role)
        ? (req.params.role[0].toUpperCase() as UserRole)
        : (req.params.role.toUpperCase() as UserRole);

      if (!VALID_ROLES.includes(targetRole)) {
        throw new BadRequestError(`Rôle invalide : ${targetRole}`);
      }

      const users = await userService.getUsersByRole(id, role, targetRole);

      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  async getUserById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id, role } = req.user;
      const targetId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const user = await userService.getUserById({
        requesterId: id,
        requesterRole: role,
        targetId,
      });
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }
}
