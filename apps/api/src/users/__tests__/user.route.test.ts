// src/tests/routes/user.route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import request from "supertest";
import {
  PrismaClient,
  UserRole,
} from "../../../prisma/generated/prisma/client";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockUserService = vi.hoisted(() => ({
  getAllUsers: vi.fn(),
  getUsers: vi.fn(),
  getUsersByRole: vi.fn(),
  getUserById: vi.fn(),
  getClinicId: vi.fn(),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@api/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock("@api/utils/jwt", () => ({
  verifyAccessToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
  generateAccessToken: vi.fn().mockReturnValue("access_token"),
  generateRefreshToken: vi.fn().mockReturnValue("refresh_token"),
}));

vi.mock("@api/users/user.service", () => ({
  UserService: vi.fn(function () {
    return mockUserService;
  }),
}));

vi.mock("@armali/schemas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@armali/schemas")>();
  return { ...actual };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const { app } = await import("@api/app");

const makeBearer = (role: string) => `Bearer token_${role.toLowerCase()}`;

const mockUser = {
  id: "user-1",
  email: "user@test.com",
  firstname: "Alice",
  lastname: "Dupont",
  role: UserRole.VETERINARIAN,
  picture: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const setRole = async (payload: object) => {
  const { verifyAccessToken } = await import("@api/utils/jwt");
  vi.mocked(verifyAccessToken).mockReturnValue(payload as never);
};

beforeEach(() => vi.clearAllMocks());

// ── GET /api/users ─────────────────────────────────────────────────────────────

describe("GET /api/users", () => {
  describe("auth & role guards", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
    });

    it("401 — token invalide", async () => {
      await setRole(null as never);
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", "Bearer invalid");
      expect(res.status).toBe(401);
    });

    it("403 — rôle VETERINARIAN non autorisé", async () => {
      await setRole({ id: "u1", email: "v@test.com", role: "VETERINARIAN" });
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", makeBearer("VETERINARIAN"));
      expect(res.status).toBe(403);
    });

    it("403 — rôle SECRETARY non autorisé", async () => {
      await setRole({ id: "u1", email: "s@test.com", role: "SECRETARY" });
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", makeBearer("SECRETARY"));
      expect(res.status).toBe(403);
    });
  });

  describe("ADMIN", () => {
    beforeEach(async () => {
      await setRole({ id: "admin-1", email: "admin@test.com", role: "ADMIN" });
    });

    it("200 — retourne tous les utilisateurs", async () => {
      mockUserService.getAllUsers.mockResolvedValue([mockUser]);

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", makeBearer("ADMIN"));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(mockUserService.getAllUsers).toHaveBeenCalledOnce();
    });
  });

  describe("DIRECTOR", () => {
    beforeEach(async () => {
      await setRole({ id: "dir-1", email: "dir@test.com", role: "DIRECTOR" });
    });

    it("200 — retourne les utilisateurs de la clinique", async () => {
      mockUserService.getUsers.mockResolvedValue([mockUser]);

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", makeBearer("DIRECTOR"));

      expect(res.status).toBe(200);
      expect(mockUserService.getUsers).toHaveBeenCalledWith(
        "dir-1",
        "DIRECTOR",
      );
    });

    it("403 — clinique introuvable", async () => {
      const { ForbiddenError } = await import("@api/errors");
      mockUserService.getUsers.mockRejectedValue(new ForbiddenError());

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", makeBearer("DIRECTOR"));

      expect(res.status).toBe(403);
    });
  });
});

// ── GET /api/users/:role ───────────────────────────────────────────────────────

describe("GET /api/users/roles/:role", () => {
  describe("auth & role guards", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/users/roles/veterinarian");
      expect(res.status).toBe(401);
    });

    it("403 — rôle CLIENT non autorisé", async () => {
      await setRole({ id: "c1", email: "c@test.com", role: "CLIENT" });
      const res = await request(app)
        .get("/api/users/roles/veterinarian")
        .set("Authorization", makeBearer("CLIENT"));
      expect(res.status).toBe(403);
    });
  });

  describe("ADMIN", () => {
    beforeEach(async () => {
      await setRole({
        id: "admin-1",
        email: "admin@test.com",
        role: UserRole.ADMIN,
      });
    });

    it("200 — retourne les utilisateurs par rôle", async () => {
      mockUserService.getUsersByRole.mockResolvedValue([mockUser]);

      const res = await request(app)
        .get("/api/users/roles/veterinarian")
        .set("Authorization", makeBearer("ADMIN"));

      expect(res.status).toBe(200);
      expect(mockUserService.getUsersByRole).toHaveBeenCalledWith(
        "admin-1",
        "ADMIN",
        "VETERINARIAN",
      );
    });

    it("400 — rôle invalide", async () => {
      const res = await request(app)
        .get("/api/users/roles/INVALID_ROLE")
        .set("Authorization", makeBearer("ADMIN"));

      expect(res.status).toBe(400);
    });
  });

  describe("DIRECTOR", () => {
    beforeEach(async () => {
      await setRole({ id: "dir-1", email: "dir@test.com", role: "DIRECTOR" });
    });

    it("200 — retourne les vétérinaires de la clinique", async () => {
      mockUserService.getUsersByRole.mockResolvedValue([mockUser]);

      const res = await request(app)
        .get("/api/users/roles/veterinarian")
        .set("Authorization", makeBearer("DIRECTOR"));

      expect(res.status).toBe(200);
      expect(mockUserService.getUsersByRole).toHaveBeenCalledWith(
        "dir-1",
        "DIRECTOR",
        "VETERINARIAN",
      );
    });
  });
});

// ── GET /api/users/:id ────────────────────────────────────────────────────────

describe("GET /api/users/:id", () => {
  describe("auth & role guards", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get("/api/users/user-1");
      expect(res.status).toBe(401);
    });

    it("403 — rôle CLIENT non autorisé", async () => {
      await setRole({ id: "c1", email: "c@test.com", role: "CLIENT" });
      const res = await request(app)
        .get("/api/users/user-1")
        .set("Authorization", makeBearer("CLIENT"));
      expect(res.status).toBe(403);
    });
  });

  describe("ADMIN", () => {
    beforeEach(async () => {
      await setRole({
        id: "admin-1",
        email: "admin@test.com",
        role: UserRole.ADMIN,
      });
    });

    it("200 — retourne l'utilisateur", async () => {
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const res = await request(app)
        .get("/api/users/user-1")
        .set("Authorization", makeBearer(UserRole.ADMIN));
      expect(res.status).toBe(200);
      expect(mockUserService.getUserById).toHaveBeenCalledWith({
        requesterId: "admin-1",
        requesterRole: "ADMIN",
        targetId: "user-1",
      });
    });

    it("404 — utilisateur introuvable", async () => {
      const { NotFoundError } = await import("@api/errors");
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundError("Utilisateur"),
      );

      const res = await request(app)
        .get("/api/users/unknown-id")
        .set("Authorization", makeBearer("ADMIN"));

      expect(res.status).toBe(404);
    });
  });

  describe("SECRETARY", () => {
    beforeEach(async () => {
      await setRole({ id: "sec-1", email: "sec@test.com", role: "SECRETARY" });
    });

    it("200 — retourne un utilisateur de la même clinique", async () => {
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const res = await request(app)
        .get("/api/users/user-1")
        .set("Authorization", makeBearer("SECRETARY"));

      expect(res.status).toBe(200);
    });

    it("404 — utilisateur hors clinique", async () => {
      const { NotFoundError } = await import("@api/errors");
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundError("Utilisateur"),
      );

      const res = await request(app)
        .get("/api/users/other-user")
        .set("Authorization", makeBearer("SECRETARY"));

      expect(res.status).toBe(404);
    });

    it("403 — clinique introuvable", async () => {
      const { ForbiddenError } = await import("@api/errors");
      mockUserService.getUserById.mockRejectedValue(new ForbiddenError());

      const res = await request(app)
        .get("/api/users/user-1")
        .set("Authorization", makeBearer("SECRETARY"));

      expect(res.status).toBe(403);
    });
  });
});
