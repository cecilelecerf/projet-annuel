import { UserService } from "@api/users/user.service";
import { BadRequestError } from "@api/errors";
import type { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "@api/middlewares";
import { UserRole } from "../../prisma/generated/prisma/enums";

const VALID_ROLES: UserRole[] = [
  "CLIENT",
  "SECRETARY",
  "VETERINARIAN",
  "DIRECTOR",
  "REFERENT",
  "ADMIN",
];

export class UserController {
  constructor(private service: UserService) {}
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, role } = req.user;
      const users =
        role === "ADMIN"
          ? await this.service.getAllUsers()
          : await this.service.getUsers(id, role);
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
      const targetRoles = (
        Array.isArray(req.params.role) ? req.params.role : [req.params.role]
      ).map((r) => r.toUpperCase()) as (UserRole | "STAFF")[];

      if (
        !targetRoles.every(
          (targetRole) =>
            targetRole === "STAFF" || VALID_ROLES.includes(targetRole),
        )
      ) {
        throw new BadRequestError(`Rôle invalide`);
      }
      const rolesToSearch: UserRole[] = targetRoles.includes("STAFF")
        ? ["DIRECTOR", "REFERENT", "SECRETARY", "VETERINARIAN"]
        : (targetRoles as UserRole[]);
      const users = await this.service.getUsersByRoles(id, role, rolesToSearch);
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

      const user = await this.service.getUserById({
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
