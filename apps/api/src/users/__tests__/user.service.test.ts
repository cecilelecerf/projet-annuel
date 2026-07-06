import { userService } from "@api/instances";
import { UserId } from "@armali/schemas";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserRepository = vi.hoisted(() => ({
  getAllUsers: vi.fn(),
  getClinicIdByUserId: vi.fn(),
  getUsersByClinic: vi.fn(),
  getAllUsersByRole: vi.fn(),
  getUsersByRoleAndClinic: vi.fn(),
  getUserById: vi.fn(),
}));

const mockClinicRepository = vi.hoisted(() => ({
  findClinicIdByUser: vi.fn(),
  findClinicByUserId: vi.fn(),
  findStaff: vi.fn(),
}));

vi.mock("@api/users/user.repository", () => ({
  UserRepository: vi.fn(function () {
    return mockUserRepository;
  }),
}));

vi.mock("@api/clinics/clinic.repository", () => ({
  ClinicRepository: vi.fn(function () {
    return mockClinicRepository;
  }),
}));

const CLINIC_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_ID = "22222222-2222-4222-8222-222222222222";
const DIRECTOR_ID = "33333333-3333-4333-8333-333333333333";

const mockUser = {
  id: "user-1",
  email: "test@test.com",
  firstname: "Alice",
  lastname: "Dupont",
  role: "VETERINARIAN",
  picture: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

// ── getAllUsers ────────────────────────────────────────────────────────────────

describe("UserService.getAllUsers", () => {
  it("retourne tous les utilisateurs", async () => {
    mockUserRepository.getAllUsers.mockResolvedValue([mockUser]);

    const result = await userService.getAllUsers();

    expect(result).toHaveLength(1);
    expect(mockUserRepository.getAllUsers).toHaveBeenCalledOnce();
  });
});

// ── getUsers ──────────────────────────────────────────────────────────────────

describe("UserService.getUsers", () => {
  it("retourne les utilisateurs de la clinique", async () => {
    mockClinicRepository.findClinicIdByUser.mockResolvedValue([CLINIC_ID]);
    mockUserRepository.getUsersByClinic.mockResolvedValue([mockUser]);

    const result = await userService.getUsers("user-1", "DIRECTOR");

    expect(result).toHaveLength(1);
    expect(mockUserRepository.getUsersByClinic).toHaveBeenCalledWith({
      clinicIds: [CLINIC_ID],
    });
  });

  it("lève ForbiddenError si pas de clinique", async () => {
    const { ForbiddenError } = await import("@api/errors");
    mockClinicRepository.findClinicIdByUser.mockResolvedValue(null);

    await expect(userService.getUsers("user-1", "DIRECTOR")).rejects.toThrow(
      ForbiddenError,
    );
  });
});

// ── getUsersByRole ────────────────────────────────────────────────────────────

describe("UserService.getUsersByRoles", () => {
  it("ADMIN — retourne tous les utilisateurs du rôle cible", async () => {
    mockUserRepository.getAllUsersByRole.mockResolvedValue([mockUser]);

    const result = await userService.getUsersByRoles(
      ADMIN_ID as UserId,
      "ADMIN",
      ["VETERINARIAN"],
    );

    expect(mockUserRepository.getAllUsersByRole).toHaveBeenCalledWith({
      roles: ["VETERINARIAN"],
    });
    expect(result).toHaveLength(1);
  });

  it("non-ADMIN — retourne les utilisateurs du rôle dans la clinique", async () => {
    mockClinicRepository.findClinicIdByUser.mockResolvedValue([CLINIC_ID]);
    mockClinicRepository.findClinicByUserId.mockResolvedValue([
      { id: CLINIC_ID, name: "Clinique Test" },
    ]);
    mockClinicRepository.findStaff.mockResolvedValue({
      director: { ...mockUser, role: "DIRECTOR" },
      referents: [],
      secretaries: [],
      veterinarians: [mockUser],
    });

    const result = await userService.getUsersByRoles(
      DIRECTOR_ID as UserId,
      "DIRECTOR",
      ["VETERINARIAN"],
    );

    expect(result).toHaveLength(1);
  });

  it("non-ADMIN — lève ForbiddenError si pas de clinique", async () => {
    const { ForbiddenError } = await import("@api/errors");
    mockClinicRepository.findClinicIdByUser.mockResolvedValue(null);

    await expect(
      userService.getUsersByRoles(DIRECTOR_ID as UserId, "DIRECTOR", [
        "VETERINARIAN",
      ]),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ── getUserById ───────────────────────────────────────────────────────────────

describe("UserService.getUserById", () => {
  it("ADMIN — retourne l'utilisateur directement", async () => {
    mockUserRepository.getUserById.mockResolvedValue(mockUser);

    const result = await userService.getUserById({
      requesterId: ADMIN_ID,
      requesterRole: "ADMIN",
      targetId: "user-1",
    });

    expect(result).toEqual(mockUser);
    expect(mockUserRepository.getUserById).toHaveBeenCalledWith({
      id: "user-1",
    });
  });

  it("ADMIN — lève NotFoundError si l'utilisateur n'existe pas", async () => {
    const { NotFoundError } = await import("@api/errors");
    mockUserRepository.getUserById.mockResolvedValue(null);

    await expect(
      userService.getUserById({
        requesterId: ADMIN_ID,
        requesterRole: "ADMIN",
        targetId: "unknown",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("non-ADMIN — retourne l'utilisateur s'il est dans la clinique", async () => {
    mockUserRepository.getUserById.mockResolvedValue(mockUser);
    mockClinicRepository.findClinicIdByUser.mockResolvedValue([CLINIC_ID]);
    mockUserRepository.getUsersByClinic.mockResolvedValue([mockUser]);

    const result = await userService.getUserById({
      requesterId: DIRECTOR_ID,
      requesterRole: "DIRECTOR",
      targetId: "user-1",
    });
    expect(result).toEqual(mockUser);
  });

  it("non-ADMIN — lève NotFoundError si l'utilisateur n'est pas dans la clinique", async () => {
    const { NotFoundError } = await import("@api/errors");
    mockUserRepository.getUserById.mockResolvedValue(mockUser);
    mockClinicRepository.findClinicIdByUser.mockResolvedValue([CLINIC_ID]);
    mockUserRepository.getUsersByClinic.mockResolvedValue([
      { ...mockUser, id: "other-user" },
    ]);

    await expect(
      userService.getUserById({
        requesterId: DIRECTOR_ID,
        requesterRole: "DIRECTOR",
        targetId: "user-1",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("non-ADMIN — lève ForbiddenError si pas de clinique", async () => {
    const { ForbiddenError } = await import("@api/errors");
    mockUserRepository.getUserById.mockResolvedValue(mockUser);
    mockClinicRepository.findClinicIdByUser.mockResolvedValue(null);

    await expect(
      userService.getUserById({
        requesterId: DIRECTOR_ID,
        requesterRole: "DIRECTOR",
        targetId: "user-1",
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
