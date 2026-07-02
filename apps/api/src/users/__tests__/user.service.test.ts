import { userService } from "@api/instances";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserRepository = vi.hoisted(() => ({
  getAllUsers: vi.fn(),
  getClinicIdByUserId: vi.fn(),
  getUsersByClinic: vi.fn(),
  getAllUsersByRole: vi.fn(),
  getUsersByRoleAndClinic: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("@api/users/user.repository", () => ({
  UserRepository: vi.fn(function () {
    return mockUserRepository;
  }),
}));

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

// ── getClinicId ───────────────────────────────────────────────────────────────

describe("UserService.getClinicId", () => {
  it("retourne le clinicId si trouvé", async () => {
    mockUserRepository.getClinicIdByUserId.mockResolvedValue("clinic-1");

    const result = await userService.getClinicId({
      userId: "user-1",
      role: "DIRECTOR",
    });

    expect(result).toBe("clinic-1");
  });

  it("lève ForbiddenError si clinicId introuvable", async () => {
    const { ForbiddenError } = await import("@api/errors");
    mockUserRepository.getClinicIdByUserId.mockResolvedValue(null);

    await expect(
      userService.getClinicId({ userId: "user-1", role: "DIRECTOR" }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ── getUsers ──────────────────────────────────────────────────────────────────

describe("UserService.getUsers", () => {
  it("retourne les utilisateurs de la clinique", async () => {
    mockUserRepository.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockUserRepository.getUsersByClinic.mockResolvedValue([mockUser]);

    const result = await userService.getUsers("user-1", "DIRECTOR");

    expect(result).toHaveLength(1);
    expect(mockUserRepository.getUsersByClinic).toHaveBeenCalledWith({
      clinicId: "clinic-1",
    });
  });

  it("lève ForbiddenError si pas de clinique", async () => {
    const { ForbiddenError } = await import("@api/errors");
    mockUserRepository.getClinicIdByUserId.mockResolvedValue(null);

    await expect(userService.getUsers("user-1", "DIRECTOR")).rejects.toThrow(
      ForbiddenError,
    );
  });
});

// ── getUsersByRole ────────────────────────────────────────────────────────────

describe("UserService.getUsersByRoles", () => {
  it("ADMIN — retourne tous les utilisateurs du rôle cible", async () => {
    mockUserRepository.getAllUsersByRole.mockResolvedValue([mockUser]);

    const result = await userService.getUsersByRoles("admin-1", "ADMIN", [
      "VETERINARIAN",
    ]);

    expect(mockUserRepository.getAllUsersByRole).toHaveBeenCalledWith({
      roles: ["VETERINARIAN"],
    });
    expect(result).toHaveLength(1);
  });

  it("non-ADMIN — retourne les utilisateurs du rôle dans la clinique", async () => {
    mockUserRepository.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockUserRepository.getUsersByRoleAndClinic.mockResolvedValue([mockUser]);

    const result = await userService.getUsersByRoles("dir-1", "DIRECTOR", [
      "VETERINARIAN",
    ]);

    expect(mockUserRepository.getUsersByRoleAndClinic).toHaveBeenCalledWith({
      clinicId: "clinic-1",
      roles: ["VETERINARIAN"],
    });
    expect(result).toHaveLength(1);
  });

  it("non-ADMIN — lève ForbiddenError si pas de clinique", async () => {
    const { ForbiddenError } = await import("@api/errors");
    mockUserRepository.getClinicIdByUserId.mockResolvedValue(null);

    await expect(
      userService.getUsersByRoles("dir-1", "DIRECTOR", ["VETERINARIAN"]),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ── getUserById ───────────────────────────────────────────────────────────────

describe("UserService.getUserById", () => {
  it("ADMIN — retourne l'utilisateur directement", async () => {
    mockUserRepository.getUserById.mockResolvedValue(mockUser);

    const result = await userService.getUserById({
      requesterId: "admin-1",
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
        requesterId: "admin-1",
        requesterRole: "ADMIN",
        targetId: "unknown",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("non-ADMIN — retourne l'utilisateur s'il est dans la clinique", async () => {
    mockUserRepository.getUserById.mockResolvedValue(mockUser);
    mockUserRepository.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockUserRepository.getUsersByClinic.mockResolvedValue([mockUser]);

    const result = await userService.getUserById({
      requesterId: "dir-1",
      requesterRole: "DIRECTOR",
      targetId: "user-1",
    });
    expect(result).toEqual(mockUser);
  });

  it("non-ADMIN — lève NotFoundError si l'utilisateur n'est pas dans la clinique", async () => {
    const { NotFoundError } = await import("@api/errors");
    mockUserRepository.getUserById.mockResolvedValue(mockUser);
    mockUserRepository.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockUserRepository.getUsersByClinic.mockResolvedValue([
      { ...mockUser, id: "other-user" },
    ]);

    await expect(
      userService.getUserById({
        requesterId: "dir-1",
        requesterRole: "DIRECTOR",
        targetId: "user-1",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("non-ADMIN — lève ForbiddenError si pas de clinique", async () => {
    const { ForbiddenError } = await import("@api/errors");
    mockUserRepository.getUserById.mockResolvedValue(mockUser);
    mockUserRepository.getClinicIdByUserId.mockResolvedValue(null);

    await expect(
      userService.getUserById({
        requesterId: "dir-1",
        requesterRole: "DIRECTOR",
        targetId: "user-1",
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
