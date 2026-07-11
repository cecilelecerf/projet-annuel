import { UserService } from "@api/users/user.service";
import { BadRequestError } from "@api/errors";
import type { NextFunction, Response } from "express";
import { AuthenticatedRequest, RequestWithParams } from "@api/middlewares";
import { UserRole } from "../../prisma/generated/prisma/enums";
import {
  baseUserSchema,
  fileIdSchema,
  uploadResponseSchema,
  UserId,
  userRoleSchema,
} from "@armali/schemas";
import z from "zod";
const STAFF_ROLES: UserRole[] = [
  "DIRECTOR",
  "REFERENT",
  "SECRETARY",
  "VETERINARIAN",
];
const getUsersQuerySchema = z.object({
  role: z.preprocess(
    (val) =>
      val === undefined
        ? undefined
        : (Array.isArray(val) ? val : [val]).map((v) =>
            typeof v === "string" ? v.toUpperCase() : v,
          ),
    z
      .union([userRoleSchema, z.literal("STAFF")])
      .array()
      .optional(),
  ),
});
export class UserController {
  constructor(private service: UserService) {}
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = getUsersQuerySchema.safeParse(req.query);
      if (!query.success) throw new BadRequestError("Rôle invalide");

      const targetRoles = query.data.role ?? [];
      const rolesToSearch: UserRole[] = targetRoles.includes("STAFF")
        ? STAFF_ROLES
        : (targetRoles as UserRole[]);
      const { id, role } = req.user;
      const users = await this.service.getUsersByRoles(id, role, rolesToSearch);

      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  async getUserById(
    req: RequestWithParams<{ id: UserId }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = await this.service.getUserById({
        requesterId: req.user.id,
        requesterRole: req.user.role,
        targetId: req.params.id,
      });
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }
  async uploadAvatar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { mimeType } = req.body;
      const result = await this.service.fileUpload({
        authorId: req.user.id,
        mimeType,
      });
      res.json(uploadResponseSchema.parse(result));
    } catch (error) {
      next(error);
    }
  }
  async confirmAvatar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { fileId } = z.object({ fileId: fileIdSchema }).parse(req.body);
      const user = await this.service.confirmAvatarUpload({
        userId: req.user.id,
        fileId,
      });
      res.json(baseUserSchema.parse(user));
    } catch (error) {
      next(error); // pour retomber sur ton errorHandler centralisé plutôt qu'un catch local
    }
  }
}
