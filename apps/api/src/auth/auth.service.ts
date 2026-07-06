import { hash, compare } from "bcryptjs";
import { baseUserSchema, ClinicId, Login, Register } from "@armali/schemas";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@api/utils";
import { prisma } from "@api/lib/prisma";
import { ConflictError, NotFoundError, UnauthorizedError } from "@api/errors";
import { EmailService } from "@api/emails/email.service";
import type { RegisterDirector } from "@api/types/auth.types";

const emailService = new EmailService();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class AuthService {
  private getClinicId(user: {
    role: string;
    secretaryProfile?: { clinicId: string } | null;
    directorClinicProfile?: { clinicId: string } | null;
    referentClinicProfile?: { clinicId: string } | null;
    veterinarianProfile?: {
      veterinarianClinics: { clinicId: string }[];
    } | null;
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
          (user.veterinarianProfile?.veterinarianClinics[0]
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

    emailService.sendWelcome(user.email, user.firstname).catch(() => {});

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async registerDirector(data: RegisterDirector) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) throw new ConflictError("Cet email est déjà utilisé");

    const existingClinic = await prisma.clinic.findUnique({
      where: { siret: data.clinic.siret },
    });
    if (existingClinic)
      throw new ConflictError("Une clinique avec ce numéro SIRET existe déjà");

    const existingRequest = await prisma.clinicCreationRequest.findFirst({
      where: { siret: data.clinic.siret, status: "PENDING" },
    });
    if (existingRequest)
      throw new ConflictError(
        "Une demande avec ce numéro SIRET est déjà en attente",
      );

    const hashedPassword = await hash(data.password, 10);

    const { clinic, email, password: _pw, firstname, lastname } = data;

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstname,
          lastname,
          role: "DIRECTOR",
        },
      });

      await tx.clinicCreationRequest.create({
        data: {
          name: clinic.name,
          address: clinic.address,
          siret: clinic.siret,
          phone: clinic.phone,
          website: clinic.website,
          description: clinic.description,
          directorId: createdUser.id,
        },
      });

      return createdUser;
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

    emailService.sendWelcome(user.email, user.firstname).catch(() => {});

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
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
            veterinarianClinics: true,
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
    try {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2025"
      ) {
        return;
      }
      throw err;
    }
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
            veterinarianClinics: true,
          },
        },
      },
      omit: { password: true },
    });
    if (!user) throw new NotFoundError("Utilisateur");

    const clinicId = this.getClinicId(user);

    return { ...user, clinicId };
  }

  async requestDeleteAccount(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("Utilisateur");

    await prisma.otpCode.deleteMany({
      where: { userId, action: "DELETE_ACCOUNT" },
    });

    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        code,
        action: "DELETE_ACCOUNT",
        userId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await emailService.sendOtpDeleteAccount(user.email, code);
    return { message: "Code envoyé par email" };
  }

  async confirmDeleteAccount(userId: string, code: string) {
    const otp = await prisma.otpCode.findFirst({
      where: { userId, action: "DELETE_ACCOUNT", code },
    });

    if (!otp) throw new UnauthorizedError("Code invalide");

    if (otp.expiresAt < new Date()) {
      await prisma.otpCode.delete({ where: { id: otp.id } });
      throw new UnauthorizedError("Code expiré");
    }

    await prisma.user.delete({ where: { id: userId } });
  }
}
