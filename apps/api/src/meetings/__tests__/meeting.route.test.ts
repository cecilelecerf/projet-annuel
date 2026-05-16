import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import request from "supertest";
import { PrismaClient } from "../../../prisma/generated/prisma/client";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockMeetingService = vi.hoisted(() => ({
  getMeetingsForVeterinarian: vi.fn(),
  getMeetingsForSecretary: vi.fn(),
  getMeetingsForReferant: vi.fn(),
  getAllAvailibilities: vi.fn(),
  getAvailibilitiesByClinic: vi.fn(),
}));

const mockUserService = vi.hoisted(() => ({
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

vi.mock("@api/meetings/meeting.service", () => ({
  MeetingService: vi.fn(function () {
    return mockMeetingService;
  }),
}));

vi.mock("@api/users/user.service", () => ({
  UserService: vi.fn(function () {
    return mockUserService;
  }),
}));

vi.mock("@armali/schemas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@armali/schemas")>();
  return {
    ...actual,
    calendarSchema: { parse: vi.fn((data) => data) },
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const getPrisma = async () => {
  const { prisma } = await import("@api/lib/prisma");
  return prisma as DeepMockProxy<PrismaClient>;
};

const { app } = await import("@api/app");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeToken = (role: string) => `Bearer token_${role.toLowerCase()}`;

const jwtPayloadVeto = {
  id: "veto-1",
  email: "veto@test.com",
  role: "VETERINARIAN",
};
const jwtPayloadSecretary = {
  id: "sec-1",
  email: "sec@test.com",
  role: "SECRETARY",
};

const mockFlatMeeting = {
  id: "meeting-1",
  type: "SPECIFIED",
  kind: "ANIMAL",
  exceptions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAvailability = {
  id: "avail-1",
  type: "SPECIFIED",
  kind: "AVAILABILITY",
  exceptions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validQuery = "startDate=2026-01-01&endDate=2026-01-31";

beforeEach(() => vi.clearAllMocks());

// ── GET /api/meetings ─────────────────────────────────────────────────────────

describe("GET /api/meetings", () => {
  describe("auth & role guards", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(`/api/meetings?${validQuery}`);
      expect(res.status).toBe(401);
    });

    it("401 — token invalide", async () => {
      const { verifyAccessToken } = await import("@api/utils/jwt");
      vi.mocked(verifyAccessToken).mockReturnValue(null);

      const res = await request(app)
        .get(`/api/meetings?${validQuery}`)
        .set("Authorization", "Bearer invalid");

      expect(res.status).toBe(401);
    });

    it("403 — rôle non autorisé (CLIENT)", async () => {
      const { verifyAccessToken } = await import("@api/utils/jwt");
      vi.mocked(verifyAccessToken).mockReturnValue({
        id: "client-1",
        email: "client@test.com",
        role: "CLIENT",
      } as never);

      const res = await request(app)
        .get(`/api/meetings?${validQuery}`)
        .set("Authorization", "Bearer token_client");

      expect(res.status).toBe(403);
    });
  });

  describe("VETERINARIAN", () => {
    beforeEach(async () => {
      const { verifyAccessToken } = await import("@api/utils/jwt");
      vi.mocked(verifyAccessToken).mockReturnValue(jwtPayloadVeto as never);
    });

    it("200 — retourne le calendrier du vétérinaire", async () => {
      mockMeetingService.getMeetingsForVeterinarian.mockResolvedValue([
        mockFlatMeeting,
      ]);
      mockMeetingService.getAllAvailibilities.mockResolvedValue([
        mockAvailability,
      ]);

      const res = await request(app)
        .get(`/api/meetings?${validQuery}`)
        .set("Authorization", makeToken("VETERINARIAN"));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("meetings");
      expect(res.body).toHaveProperty("availabilities");
      expect(
        mockMeetingService.getMeetingsForVeterinarian,
      ).toHaveBeenCalledWith("veto-1", expect.any(Date), expect.any(Date));
    });

    it("404 — profil vétérinaire introuvable", async () => {
      mockMeetingService.getMeetingsForVeterinarian.mockResolvedValue(null);
      mockMeetingService.getAllAvailibilities.mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/meetings?${validQuery}`)
        .set("Authorization", makeToken("VETERINARIAN"));

      expect(res.status).toBe(404);
    });

    it("400 — dates manquantes", async () => {
      const res = await request(app)
        .get("/api/meetings")
        .set("Authorization", makeToken("VETERINARIAN"));

      expect(res.status).toBe(400);
    });
  });

  describe("SECRETARY", () => {
    beforeEach(async () => {
      const { verifyAccessToken } = await import("@api/utils/jwt");
      vi.mocked(verifyAccessToken).mockReturnValue(
        jwtPayloadSecretary as never,
      );
    });

    it("200 — retourne le calendrier de la secrétaire", async () => {
      mockMeetingService.getMeetingsForSecretary.mockResolvedValue([
        mockFlatMeeting,
      ]);
      mockMeetingService.getAllAvailibilities.mockResolvedValue([
        mockAvailability,
      ]);

      const res = await request(app)
        .get(`/api/meetings?${validQuery}`)
        .set("Authorization", makeToken("SECRETARY"));

      expect(res.status).toBe(200);
      expect(mockMeetingService.getMeetingsForSecretary).toHaveBeenCalledWith(
        "sec-1",
        expect.any(Date),
        expect.any(Date),
      );
    });

    it("404 — profil secrétaire introuvable", async () => {
      mockMeetingService.getMeetingsForSecretary.mockResolvedValue(null);
      mockMeetingService.getAllAvailibilities.mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/meetings?${validQuery}`)
        .set("Authorization", makeToken("SECRETARY"));

      expect(res.status).toBe(404);
    });
  });
});

// ── GET /api/meetings/:veterinarianId ─────────────────────────────────────────

describe("GET /api/meetings/:veterinarianId", () => {
  const veterinarianId = "veto-profile-1";

  describe("auth & role guards", () => {
    it("401 — sans token", async () => {
      const res = await request(app).get(
        `/api/meetings/${veterinarianId}?${validQuery}`,
      );
      expect(res.status).toBe(401);
    });

    it("403 — rôle VETERINARIAN non autorisé sur cette route", async () => {
      const { verifyAccessToken } = await import("@api/utils/jwt");
      vi.mocked(verifyAccessToken).mockReturnValue(jwtPayloadVeto as never);

      const res = await request(app)
        .get(`/api/meetings/${veterinarianId}?${validQuery}`)
        .set("Authorization", makeToken("VETERINARIAN"));

      expect(res.status).toBe(403);
    });
  });

  describe("SECRETARY", () => {
    beforeEach(async () => {
      const { verifyAccessToken } = await import("@api/utils/jwt");
      vi.mocked(verifyAccessToken).mockReturnValue(
        jwtPayloadSecretary as never,
      );
    });

    it("200 — retourne le calendrier d'un vétérinaire", async () => {
      const prisma = await getPrisma();

      prisma.veterinarianProfile.findUnique.mockResolvedValue({
        id: veterinarianId,
        userId: "user-veto-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      mockUserService.getClinicId.mockResolvedValue("clinic-1");
      mockMeetingService.getMeetingsForVeterinarian.mockResolvedValue([
        mockFlatMeeting,
      ]);
      mockMeetingService.getAvailibilitiesByClinic.mockResolvedValue([
        mockAvailability,
      ]);

      const res = await request(app)
        .get(`/api/meetings/${veterinarianId}?${validQuery}`)
        .set("Authorization", makeToken("SECRETARY"));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("meetings");
      expect(res.body).toHaveProperty("availabilities");
    });

    it("404 — vétérinaire introuvable", async () => {
      const prisma = await getPrisma();

      prisma.veterinarianProfile.findUnique.mockResolvedValue(null);
      mockUserService.getClinicId.mockResolvedValue("clinic-1");

      const res = await request(app)
        .get(`/api/meetings/${veterinarianId}?${validQuery}`)
        .set("Authorization", makeToken("SECRETARY"));

      expect(res.status).toBe(404);
    });

    it("400 — dates manquantes", async () => {
      const res = await request(app)
        .get(`/api/meetings/${veterinarianId}`)
        .set("Authorization", makeToken("SECRETARY"));

      expect(res.status).toBe(400);
    });
  });
});
