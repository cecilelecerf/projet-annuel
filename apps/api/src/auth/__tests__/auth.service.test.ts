import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import {
  PrismaClient,
  UserRole,
} from "../../../prisma/generated/prisma/client";

vi.mock("@api/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
  compare: vi.fn(),
}));

vi.mock("@api/utils/jwt", () => ({
  generateAccessToken: vi.fn().mockReturnValue("access_token"),
  generateRefreshToken: vi.fn().mockReturnValue("refresh_token"),
  verifyAccessToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock("@armali/schemas", () => ({
  baseUserSchema: {
    parse: vi.fn((user) => {
      const { password, clinicId, ...parsedUser } = user;
      return parsedUser;
    }),
  },
}));

const getPrisma = async () => {
  const { prisma } = await import("@api/lib/prisma");
  return prisma as DeepMockProxy<PrismaClient>;
};

const { AuthService } = await import("@api/auth/auth.service");
const authService = new AuthService();

const mockUser = {
  id: "user-1",
  email: "test@test.com",
  firstname: "Alice",
  lastname: "Dupont",
  password: "hashed_password",
  picture: null,
  clinicId: null,
  role: UserRole.CLIENT,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRefreshToken = {
  id: "token-1",
  token: "refresh_token",
  userId: "user-1",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

beforeEach(() => vi.clearAllMocks());

// ── register ──────────────────────────────────────────────────────────────────

describe("AuthService.register", () => {
  it("crée un utilisateur et retourne les tokens", async () => {
    const prisma = await getPrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

    const result = await authService.register({
      email: "test@test.com",
      password: "Password1!",
      firstname: "Alice",
      lastname: "Dupont",
    });

    expect(result.accessToken).toBe("access_token");
    expect(result.refreshToken).toBe("refresh_token");
    expect(result.user).not.toHaveProperty("password");
    expect(prisma.user.create).toHaveBeenCalledOnce();
  });

  it("lève ConflictError si l'email existe déjà", async () => {
    const prisma = await getPrisma();
    const { ConflictError } = await import("@api/errors");
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.register({
        email: "test@test.com",
        password: "Password1!",
        firstname: "Alice",
        lastname: "Dupont",
      }),
    ).rejects.toThrow(ConflictError);
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe("AuthService.login", () => {
  it("retourne les tokens si les credentials sont valides", async () => {
    const prisma = await getPrisma();
    const { compare } = await import("bcryptjs");
    vi.mocked(compare).mockResolvedValue(true as never);

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

    const result = await authService.login({
      email: "test@test.com",
      password: "Password1!",
    });

    expect(result.accessToken).toBe("access_token");
    expect(result.user).not.toHaveProperty("password");
  });

  it("lève UnauthorizedError si l'utilisateur n'existe pas", async () => {
    const prisma = await getPrisma();
    const { UnauthorizedError } = await import("@api/errors");
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({ email: "inconnu@test.com", password: "Password1!" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("lève UnauthorizedError si le mot de passe est incorrect", async () => {
    const prisma = await getPrisma();
    const { compare } = await import("bcryptjs");
    const { UnauthorizedError } = await import("@api/errors");
    vi.mocked(compare).mockResolvedValue(false as never);
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.login({
        email: "test@test.com",
        password: "WrongPassword1!",
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

// ── refresh ───────────────────────────────────────────────────────────────────

describe("AuthService.refresh", () => {
  it("retourne de nouveaux tokens si le refresh token est valide", async () => {
    const prisma = await getPrisma();
    const { verifyRefreshToken } = await import("@api/utils/jwt");
    vi.mocked(verifyRefreshToken).mockReturnValue({ id: "user-1" } as never);

    prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.refreshToken.delete.mockResolvedValue(mockRefreshToken);
    prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

    const result = await authService.refresh("refresh_token");

    expect(result.accessToken).toBe("access_token");
    expect(result.refreshToken).toBe("refresh_token");
    expect(prisma.refreshToken.delete).toHaveBeenCalledOnce();
  });

  it("lève UnauthorizedError si le token n'existe pas en base", async () => {
    const prisma = await getPrisma();
    const { UnauthorizedError } = await import("@api/errors");
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(authService.refresh("invalid_token")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("lève UnauthorizedError si le token est expiré", async () => {
    const prisma = await getPrisma();
    const { UnauthorizedError } = await import("@api/errors");

    prisma.refreshToken.findUnique.mockResolvedValue({
      ...mockRefreshToken,
      expiresAt: new Date(Date.now() - 1000),
    });
    prisma.refreshToken.delete.mockResolvedValue(mockRefreshToken);

    await expect(authService.refresh("refresh_token")).rejects.toThrow(
      UnauthorizedError,
    );
    expect(prisma.refreshToken.delete).toHaveBeenCalledOnce();
  });

  it("lève UnauthorizedError si verifyRefreshToken retourne null", async () => {
    const prisma = await getPrisma();
    const { verifyRefreshToken } = await import("@api/utils/jwt");
    const { UnauthorizedError } = await import("@api/errors");
    vi.mocked(verifyRefreshToken).mockReturnValue(null);

    prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);

    await expect(authService.refresh("refresh_token")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("lève NotFoundError si l'utilisateur n'existe pas", async () => {
    const prisma = await getPrisma();
    const { verifyRefreshToken } = await import("@api/utils/jwt");
    const { NotFoundError } = await import("@api/errors");
    vi.mocked(verifyRefreshToken).mockReturnValue({ id: "user-1" } as never);

    prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(authService.refresh("refresh_token")).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe("AuthService.logout", () => {
  it("supprime le refresh token", async () => {
    const prisma = await getPrisma();
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

    await authService.logout("refresh_token");

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { token: "refresh_token" },
    });
  });

  it("ne lève pas d'erreur si le token n'existe déjà plus", async () => {
    const prisma = await getPrisma();
    // deleteMany ne lève jamais si rien ne matche, contrairement à delete — count: 0 est le comportement normal
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      authService.logout("token_inexistant"),
    ).resolves.toBeUndefined();
  });
});
// ── me ────────────────────────────────────────────────────────────────────────

describe("AuthService.me", () => {
  it("retourne l'utilisateur si le token est valide", async () => {
    const prisma = await getPrisma();
    const { verifyAccessToken } = await import("@api/utils/jwt");
    vi.mocked(verifyAccessToken).mockReturnValue({ id: "user-1" } as never);
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await authService.me("access_token");
    expect(result).toEqual(mockUser);
  });

  it("lève UnauthorizedError si le token est invalide", async () => {
    const { verifyAccessToken } = await import("@api/utils/jwt");
    const { UnauthorizedError } = await import("@api/errors");
    vi.mocked(verifyAccessToken).mockReturnValue(null);

    await expect(authService.me("invalid_token")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("lève NotFoundError si l'utilisateur n'existe pas", async () => {
    const prisma = await getPrisma();
    const { verifyAccessToken } = await import("@api/utils/jwt");
    const { NotFoundError } = await import("@api/errors");
    vi.mocked(verifyAccessToken).mockReturnValue({ id: "user-1" } as never);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(authService.me("access_token")).rejects.toThrow(NotFoundError);
  });
});
