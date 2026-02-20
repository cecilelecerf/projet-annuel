import { UserRole } from "api/prisma/generated/prisma/enums";
import type { Request, Response, NextFunction } from "express";

export const roleMiddleware = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Non authentifié" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Accès interdit" });
      return;
    }

    next();
  };
};
