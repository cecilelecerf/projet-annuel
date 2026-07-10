import { hash, compare } from "bcryptjs";
import {
  baseUserSchema,
  ClinicId,
  Login,
  Register,
  UpdateAccount,
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

    return { user: { ...parsedUser, clinicId }, accessToken, refreshToken };
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
      data: { ...data, password: hashedPassword },
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

    const isPasswordValid = await compare(data.password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedError("Email ou mot de passe incorrect");

    if (!isTwoFactorEnabled) return this.issueLoginSession(user);

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
        avatar: true,
      },
      omit: { password: true },
    });
    if (!user) throw new NotFoundError("Utilisateur");

    const clinicId = this.getClinicId(user);

    return { ...user, clinicId };
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
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
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
        data: { password: hashedPassword },
      }),
      prisma.otpCode.delete({ where: { id: otp.id } }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
  }
}
