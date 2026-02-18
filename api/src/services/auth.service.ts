import { hash, compare } from "bcryptjs";

import { LoginInput, RegisterInput } from "@api/schemas/auth.schema";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@api/utils/jwt";
import { prisma } from "@api/lib/prisma";

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new Error("Cet email est déjà utilisé");
    }

    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error("Email ou mot de passe incorrect");
    }

    const isPasswordValid = await compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Email ou mot de passe incorrect");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const savedToken = await prisma.refreshToken.findUnique({
      where: { id: refreshToken },
    });
    if (!savedToken) {
      throw new Error("Refresh token invalide");
    }

    if (savedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: refreshToken } });
      throw new Error("Refresh token expiré");
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error("Refresh token invalide");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      throw new Error("Utilisateur introuvable");
    }

    await prisma.refreshToken.delete({ where: { id: refreshToken } });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
  }
}
