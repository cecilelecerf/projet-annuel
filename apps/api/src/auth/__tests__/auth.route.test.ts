import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import request from "supertest";
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

vi.mock("@armali/schemas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@armali/schemas")>();
  return {
    ...actual,
    baseUserSchema: { parse: vi.fn((user) => user) },
  };
});

const getPrisma = async () => {
  const { prisma } = await import("@api/lib/prisma");
  return prisma as DeepMockProxy<PrismaClient>;
};

const { app } = await import("@api/app");

const mockUser = {
  id: "1",
  email: "test@test.com",
  firstname: "Alice",
  lastname: "Dupont",
  password: "hashed_password",
  picture: null,
  role: UserRole.CLIENT,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRefreshToken = {
  token: "refresh_token",
  userId: "1",
  id: "1",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

beforeEach(() => vi.clearAllMocks());

// -------------------------------------------------------------------
describe("POST /api/auth/register", () => {
  it("201 — crée un utilisateur", async () => {
    const prisma = await getPrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

    const res = await request(app).post("/api/auth/register").send({
      email: "test@test.com",
      password: "Password1!",
      firstname: "Alice",
      lastname: "Dupont",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken", "access_token");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("409 — email déjà utilisé", async () => {
    const prisma = await getPrisma();
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app).post("/api/auth/register").send({
      email: "test@test.com",
      password: "Password1!",
      firstname: "Alice",
      lastname: "Dupont",
    });

    expect(res.status).toBe(409);
  });

  it("400 — body invalide", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
    });

    expect(res.status).toBe(400);
  });
  it("400 — firstname manquant", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@test.com",
      password: "Password1!",
      lastname: "Dupont",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("firstname");
  });

  it("400 — lastname manquant", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@test.com",
      password: "Password1!",
      firstname: "Alice",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("lastname");
  });

  it("400 — mot de passe trop court", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@test.com",
      password: "short",
      firstname: "Alice",
      lastname: "Dupont",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("password");
  });
});

// -------------------------------------------------------------------
describe("POST /api/auth/login", () => {
  it("200 — login réussi", async () => {
    const prisma = await getPrisma();
    const { compare } = await import("bcryptjs");
    vi.mocked(compare).mockResolvedValue(true as never);

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

    const res = await request(app).post("/api/auth/login").send({
      email: "test@test.com",
      password: "Password1!",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("401 — utilisateur introuvable", async () => {
    const prisma = await getPrisma();
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/login").send({
      email: "inconnu@test.com",
      password: "Password1!",
    });

    expect(res.status).toBe(401);
  });

  it("401 — mauvais mot de passe", async () => {
    const prisma = await getPrisma();
    const { compare } = await import("bcryptjs");
    vi.mocked(compare).mockResolvedValue(false as never);

    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app).post("/api/auth/login").send({
      email: "test@test.com",
      password: "wrongeeee",
    });
    expect(res.status).toBe(401);
  });

  it("400 — body invalide", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
  it("400 — email invalide", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "not-an-email",
      password: "Password1!",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("email");
  });

  it("400 — mot de passe trop court", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@test.com",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("password");
  });

  it("400 — body vide", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("email");
    expect(res.body.errors).toHaveProperty("password");
  });
});

// -------------------------------------------------------------------
describe("POST /api/auth/logout", () => {
  it("204 — logout réussi", async () => {
    const prisma = await getPrisma();
    const { verifyAccessToken } = await import("@api/utils/jwt");
    vi.mocked(verifyAccessToken).mockReturnValue({ id: "1" } as never);

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.refreshToken.delete.mockResolvedValue(mockRefreshToken);

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", "Bearer access_token")
      .send({ refreshToken: "refresh_token" });

    expect(res.status).toBe(204);
  });

  it("401 — sans token", async () => {
    const { verifyAccessToken } = await import("@api/utils/jwt");
    vi.mocked(verifyAccessToken).mockReturnValue(null as never);

    const res = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: "refresh_token" });

    expect(res.status).toBe(401);
  });
});

// -------------------------------------------------------------------
describe("GET /api/auth/me", () => {
  it("200 — retourne l'utilisateur", async () => {
    const prisma = await getPrisma();
    const { verifyAccessToken } = await import("@api/utils/jwt");
    vi.mocked(verifyAccessToken).mockReturnValue({ id: "1" } as never);

    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer access_token");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "test@test.com");
  });

  it("401 — sans Authorization header", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("401 — token invalide", async () => {
    const { verifyAccessToken } = await import("@api/utils/jwt");
    vi.mocked(verifyAccessToken).mockReturnValue(null as never);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid_token");

    expect(res.status).toBe(401);
  });
});
