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

vi.mock("@api/services/email.service", () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    sendWelcome: vi.fn().mockResolvedValue(undefined),
    sendOtpDeleteAccount: vi.fn().mockResolvedValue(undefined),
  })),
}));

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

const mockDirectorUser = {
  ...mockUser,
  id: "2",
  email: "director@test.com",
  role: UserRole.DIRECTOR,
};

const mockClinic = {
  id: "clinic-1",
  name: "Clinique Vétérinaire du Centre",
  address: "12 rue de la Paix, 75001 Paris",
  siret: "12345678901234",
  phone: "0102030405",
  website: "https://clinique-centre.fr",
  description: null,
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

const mockOtp = {
  id: "otp-1",
  code: "123456",
  action: "DELETE_ACCOUNT",
  userId: "1",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 15 * 60 * 1000),
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
describe("POST /api/auth/register-director", () => {
  const validDirectorPayload = {
    email: "director@test.com",
    password: "Password1!",
    firstname: "Jean",
    lastname: "Directeur",
    clinic: {
      name: "Clinique Vétérinaire du Centre",
      address: "12 rue de la Paix, 75001 Paris",
      siret: "12345678901234",
      phone: "0102030405",
      website: "https://clinique-centre.fr",
    },
  };

  it("201 — crée un directeur avec sa clinique", async () => {
    const prisma = await getPrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => {
        prisma.clinic.create.mockResolvedValue(mockClinic);
        prisma.user.create.mockResolvedValue({
          ...mockDirectorUser,
          directorClinicProfile: { id: "2", clinicId: "clinic-1" },
        });
        return fn(prisma);
      },
    );
    prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

    const res = await request(app)
      .post("/api/auth/register-director")
      .send(validDirectorPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("400 — clinic manquante", async () => {
    const res = await request(app).post("/api/auth/register-director").send({
      email: "director@test.com",
      password: "Password1!",
      firstname: "Jean",
      lastname: "Directeur",
    });

    expect(res.status).toBe(400);
  });

  it("400 — siret invalide (pas 14 chiffres)", async () => {
    const res = await request(app)
      .post("/api/auth/register-director")
      .send({
        ...validDirectorPayload,
        clinic: { ...validDirectorPayload.clinic, siret: "123" },
      });

    expect(res.status).toBe(400);
  });

  it("409 — email déjà utilisé", async () => {
    const prisma = await getPrisma();
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/register-director")
      .send(validDirectorPayload);

    expect(res.status).toBe(409);
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

// -------------------------------------------------------------------
describe("POST /api/auth/delete-account/request", () => {
  it("200 — envoie le code OTP", async () => {
    const prisma = await getPrisma();
    const { verifyAccessToken } = await import("@api/utils/jwt");
    vi.mocked(verifyAccessToken).mockReturnValue({ id: "1" } as never);

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.otpCode.deleteMany.mockResolvedValue({ count: 0 });
    prisma.otpCode.create.mockResolvedValue(mockOtp);

    const res = await request(app)
      .post("/api/auth/delete-account/request")
      .set("Authorization", "Bearer access_token");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("401 — sans token", async () => {
    const res = await request(app).post("/api/auth/delete-account/request");
    expect(res.status).toBe(401);
  });
});

// -------------------------------------------------------------------
describe("DELETE /api/auth/delete-account", () => {
  it("204 — supprime le compte avec code valide", async () => {
    const prisma = await getPrisma();
    const { verifyAccessToken } = await import("@api/utils/jwt");
    vi.mocked(verifyAccessToken).mockReturnValue({ id: "1" } as never);

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.otpCode.findFirst.mockResolvedValue(mockOtp);
    prisma.user.delete.mockResolvedValue(mockUser);

    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", "Bearer access_token")
      .send({ code: "123456" });

    expect(res.status).toBe(204);
  });

  it("401 — code invalide", async () => {
    const prisma = await getPrisma();
    const { verifyAccessToken } = await import("@api/utils/jwt");
    vi.mocked(verifyAccessToken).mockReturnValue({ id: "1" } as never);

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.otpCode.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", "Bearer access_token")
      .send({ code: "000000" });

    expect(res.status).toBe(401);
  });

  it("400 — code manquant", async () => {
    const { verifyAccessToken } = await import("@api/utils/jwt");
    vi.mocked(verifyAccessToken).mockReturnValue({ id: "1" } as never);

    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", "Bearer access_token")
      .send({});

    expect(res.status).toBe(400);
  });

  it("401 — sans token", async () => {
    const res = await request(app)
      .delete("/api/auth/delete-account")
      .send({ code: "123456" });
    expect(res.status).toBe(401);
  });
});
