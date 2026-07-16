import { hash, compare } from "bcryptjs";
import {
  baseUserSchema,
  ClinicId,
  Login,
  Register,
  UpdateAccount,
  RegisterDirectorSchema,
} from "@armali/schemas";
import type {
  ForgotPassword,
  ResetPassword,
  VerifyLoginTwoFactor,
} from "@armali/schemas";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@api/utils";
import { prisma } from "@api/lib/prisma";
import { Prisma } from "../../prisma/generated/prisma/client";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@api/errors";
import { EmailService } from "@api/emails/email.service";
import type { RegisterDirector } from "@api/types/auth.types";
import { withAvatarUrl } from "@api/users/user.utils";

const emailService = new EmailService();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const isTwoFactorEnabled = process.env.NODE_ENV === "production";
const MAX_FAILED_LOGIN_ATTEMPTS = 5;

// Comptes de démo (seed) — exemptés de la 2FA en prod pour garder l'accès
// rapide par rôle fonctionnel (démo/évaluation).
const SEED_ACCOUNT_EMAILS = new Set([
  "admin@gmail.com",
  "directeur@gmail.com",
  "referent@gmail.com",
  "veto@gmail.com",
  "secretaire@gmail.com",
  "client@gmail.com",
  "pending@gmail.fr",
  "rejected@gmail.fr",
]);
const ACCOUNT_LOCKED_MESSAGE =
  "Compte bloqué après plusieurs tentatives échouées. Réinitialisez votre mot de passe pour le débloquer.";
const PASSWORD_EXPIRY_DAYS = 60;

const loginUserInclude = {
  avatar: true,
  secretaryProfile: true,
  directorClinicProfile: {
    select: { clinic: { select: { id: true } } },
  },
  referentClinicProfile: true,
  veterinarianProfile: {
    include: {
      veterinarianClinics: true,
    },
  },
} satisfies Prisma.UserInclude;

type LoginUser = Prisma.UserGetPayload<{ include: typeof loginUserInclude }>;

export class AuthService {
  private async issueLoginSession(user: LoginUser) {
    const clinicId = this.getClinicId(user);
    const withAvatar = withAvatarUrl(user);
    const parsedUser = baseUserSchema.parse(withAvatar);
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

    return {
      user: { ...parsedUser, clinicId },
      accessToken,
      refreshToken,
      passwordExpired: this.isPasswordExpired(user.passwordChangedAt),
    };
  }

  private isPasswordExpired(passwordChangedAt: Date): boolean {
    const expiryMs = PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - passwordChangedAt.getTime() > expiryMs;
  }

  private getClinicId(user: {
    role: string;
    secretaryProfile?: { clinicId: string } | null;
    directorClinicProfile?: {
      clinic?: { id: string } | null;
    } | null;
    referentClinicProfile?: { clinicId: string } | null;
    veterinarianProfile?: {
      veterinarianClinics: { clinicId: string }[];
    } | null;
  }): ClinicId | null {
    switch (user.role) {
      case "SECRETARY":
        return (user.secretaryProfile?.clinicId as ClinicId) ?? null;
      case "DIRECTOR":
        return (user.directorClinicProfile?.clinic?.id as ClinicId) ?? null;
      case "REFERENT":
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
      data: { ...data, password: hashedPassword, clientProfile: { create: {} } },
      include: { avatar: true },
    });
    const validUser = withAvatarUrl(user);
    const parsedUser = baseUserSchema.parse(validUser);
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

  async registerDirector(data: RegisterDirectorSchema) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) throw new ConflictError("Cet email est déjà utilisé");

    const existingClinic = await prisma.clinic.findUnique({
      where: { siret: data.clinic.siret },
    });
    if (existingClinic)
      throw new ConflictError("Une clinique avec ce numéro SIRET existe déjà");

    const existingRequest = await prisma.clinicRequest.findFirst({
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
          directorClinicProfile: { create: {} },
        },
        include: { avatar: true },
      });

      await tx.clinicRequest.create({
        data: {
          name: clinic.name,
          street: clinic.street,
          postalCode: clinic.postalCode,
          city: clinic.city,
          country: clinic.country,
          siret: clinic.siret,
          phone: clinic.phone,
          website: clinic.website,
          description: clinic.description,
          directorId: createdUser.id,
        },
      });

      return createdUser;
    });

    const validUser = withAvatarUrl(user);
    const parsedUser = baseUserSchema.parse(validUser);
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
      include: loginUserInclude,
    });
    if (!user) throw new UnauthorizedError("Email ou mot de passe incorrect");

    if (user.lockedAt) throw new UnauthorizedError(ACCOUNT_LOCKED_MESSAGE);

    const isPasswordValid = await compare(data.password, user.password);
    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          ...(shouldLock && { lockedAt: new Date() }),
        },
      });
      throw new UnauthorizedError(
        shouldLock ? ACCOUNT_LOCKED_MESSAGE : "Email ou mot de passe incorrect",
      );
    }

    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0 },
      });
    }

    if (!isTwoFactorEnabled || SEED_ACCOUNT_EMAILS.has(user.email)) {
      return this.issueLoginSession(user);
    }

    await prisma.otpCode.deleteMany({
      where: { userId: user.id, action: "LOGIN_2FA" },
    });

    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        code,
        action: "LOGIN_2FA",
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await emailService.sendLoginTwoFactorCode(user.email, code);

    return { twoFactorRequired: true as const, email: user.email };
  }

  async verifyLoginTwoFactor(data: VerifyLoginTwoFactor) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: loginUserInclude,
    });
    if (!user) throw new UnauthorizedError("Code invalide");

    const otp = await prisma.otpCode.findFirst({
      where: { userId: user.id, action: "LOGIN_2FA", code: data.code },
    });
    if (!otp) throw new UnauthorizedError("Code invalide");

    if (otp.expiresAt < new Date()) {
      await prisma.otpCode.delete({ where: { id: otp.id } });
      throw new UnauthorizedError("Code expiré");
    }

    await prisma.otpCode.delete({ where: { id: otp.id } });

    return this.issueLoginSession(user);
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

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { avatar: true },
    });
    if (!user) throw new NotFoundError("Utilisateur");

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const validUser = withAvatarUrl(user);
    const parsedUser = baseUserSchema.parse(validUser);
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
        directorClinicProfile: { include: { clinic: true } },
        referentClinicProfile: true,
        veterinarianProfile: {
          include: {
            veterinarianClinics: true,
          },
        },
        clientProfile: true,
        avatar: true,
      },
      omit: { password: true },
    });
    if (!user) throw new NotFoundError("Utilisateur");

    const clinicId = this.getClinicId(user);
    const passwordExpired = this.isPasswordExpired(user.passwordChangedAt);

    return { ...user, clinicId, passwordExpired };
  }

  async updateAccount(userId: string, data: UpdateAccount) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("Utilisateur");

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) throw new ConflictError("Cet email est déjà utilisé");
    }

    let hashedPassword: string | undefined;
    if (data.newPassword) {
      if (!data.currentPassword)
        throw new BadRequestError("Mot de passe actuel requis");
      const isValid = await compare(data.currentPassword, user.password);
      if (!isValid)
        throw new UnauthorizedError("Mot de passe actuel incorrect");
      hashedPassword = await hash(data.newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstname && { firstname: data.firstname }),
        ...(data.lastname && { lastname: data.lastname }),
        ...(data.email && { email: data.email }),
        ...(hashedPassword && {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        }),
      },
    });

    let clientProfile;
    if (
      user.role === "CLIENT" &&
      (data.phone !== undefined ||
        data.address !== undefined ||
        data.dateOfBirth !== undefined)
    ) {
      clientProfile = await prisma.clientProfile.update({
        where: { id: userId },
        data: {
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.dateOfBirth !== undefined && {
            dateOfBirth: data.dateOfBirth,
          }),
        },
      });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    return { ...userWithoutPassword, ...(clientProfile && { clientProfile }) };
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

  async forgotPassword(data: ForgotPassword) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user) {
      await prisma.otpCode.deleteMany({
        where: { userId: user.id, action: "RESET_PASSWORD" },
      });

      const code = generateOtp();
      await prisma.otpCode.create({
        data: {
          code,
          action: "RESET_PASSWORD",
          userId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      await emailService.sendResetPassword(user.email, code);
    }

    return { message: "Si un compte existe, un email a été envoyé" };
  }

  async resetPassword(data: ResetPassword) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) throw new UnauthorizedError("Code invalide");

    const otp = await prisma.otpCode.findFirst({
      where: { userId: user.id, action: "RESET_PASSWORD", code: data.code },
    });
    if (!otp) throw new UnauthorizedError("Code invalide");

    if (otp.expiresAt < new Date()) {
      await prisma.otpCode.delete({ where: { id: otp.id } });
      throw new UnauthorizedError("Code expiré");
    }

    const hashedPassword = await hash(data.newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedAt: null,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.otpCode.delete({ where: { id: otp.id } }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
  }
}
