import { hash, compare } from "bcryptjs";
import {
  baseUserSchema,
  ClinicId,
  Login,
  ReferantClinic,
  Register,
  User,
} from "@armali/schemas";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@api/utils";
import { prisma } from "@api/lib/prisma";
import { ConflictError, NotFoundError, UnauthorizedError } from "@api/errors";
import {
  Clinic,
  DirectorClinicProfile,
  SecretaryProfile,
  VeterinarianClinic,
  VeterinarianProfile,
  User as UserPrisma,
} from "../../prisma/generated/prisma/client";

export class AuthService {
  private getClinicId(user: {
    role: string;
    secretaryProfile?: { clinicId: string } | null;
    directorClinicProfile?: { clinicId: string } | null;
    referentClinicProfile?: { clinicId: string } | null;
    veterinarianProfile?: { veterinarianClinic: { clinicId: string }[] } | null;
  }): ClinicId | null {
    switch (user.role) {
      case "SECRETARY":
        return (user.secretaryProfile?.clinicId as ClinicId) ?? null;
      case "DIRECTOR":
        return (user.directorClinicProfile?.clinicId as ClinicId) ?? null;
      case "REFERANT":
        return (user.referentClinicProfile?.clinicId as ClinicId) ?? null;
      case "VETERINARIAN":
        return (
          (user.veterinarianProfile?.veterinarianClinic[0]
            ?.clinicId as ClinicId) ?? null
        );
      default:
        return null;
    }
  }
  async register(data: Register) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) throw new ConflictError("Cet email est déjà utilisé");

    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword },
    });

    const parsedUser = baseUserSchema.parse(user);
    const accessToken = generateAccessToken(parsedUser);
    const refreshToken = generateRefreshToken(parsedUser);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user: parsedUser, accessToken, refreshToken };
  }

  async login(data: Login) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        secretaryProfile: true,
        directorClinicProfile: true,
        referentClinicProfile: true,
        veterinarianProfile: {
          include: {
            veterinarianClinic: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedError("Email ou mot de passe incorrect");

    const isPasswordValid = await compare(data.password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedError("Email ou mot de passe incorrect");
    const parsedUser = baseUserSchema.parse(user);
    const clinicId = this.getClinicId(user);
    const accessToken = generateAccessToken({
      ...parsedUser,
      clinicId: clinicId ?? undefined,
    });
    const refreshToken = generateRefreshToken({
      ...parsedUser,
      clinicId: clinicId ?? undefined,
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user: { ...parsedUser, clinicId }, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const savedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!savedToken) throw new UnauthorizedError("Refresh token invalide");

    if (savedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      throw new UnauthorizedError("Refresh token expiré");
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw new UnauthorizedError("Refresh token invalide");

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) throw new NotFoundError("Utilisateur");

    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const parsedUser = baseUserSchema.parse(user);
    const newAccessToken = generateAccessToken(parsedUser);
    const newRefreshToken = generateRefreshToken(parsedUser);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
  }

  async me(accessToken: string) {
    const payload = verifyAccessToken(accessToken);
    if (!payload) throw new UnauthorizedError("Token invalide");

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        secretaryProfile: true,
        directorClinicProfile: true,
        referentClinicProfile: true,
        veterinarianProfile: {
          include: {
            veterinarianClinic: true,
          },
        },
      },
      omit: { password: true },
    });
    if (!user) throw new NotFoundError("Utilisateur");

    const clinicId = this.getClinicId(user);

    return { ...user, clinicId };
  }
}
