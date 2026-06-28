import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import type { JwtPayload } from "../utils/jwt";
export type AuthenticatedRequest = Request & { user: JwtPayload };

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token manquant" });
    return;
  }

  const token = authorization.split(" ")[1];
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ message: "Token invalide ou expiré" });
    return;
  }
  req.user = payload;
  next();
};
