import { BaseUser, ClinicId, UserId, UserRole } from "@armali/schemas";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JwtPayload {
  id: UserId;
  email: BaseUser["email"];
  role: UserRole;
  clinicId?: ClinicId;
}

export const generateAccessToken = (user: JwtPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    },
    ACCESS_SECRET,
    { expiresIn: "15m" },
  );
};

export const generateRefreshToken = (user: JwtPayload): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, jti: randomUUID() },
    REFRESH_SECRET,
    { expiresIn: "7d" },
  );
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};
