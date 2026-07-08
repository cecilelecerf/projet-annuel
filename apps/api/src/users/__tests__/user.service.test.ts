import { FileRepository } from "@api/files/file.repository";
import { FileService } from "@api/files/file.service";
import { UserId } from "@armali/schemas";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserRepository = vi.hoisted(() => ({
  getAllUsers: vi.fn(),
  getUsersByClinic: vi.fn(),
  getAllUsersByRole: vi.fn(),
  getUserById: vi.fn(),
  updateAvatar: vi.fn(),
}));

const mockClinicRepository = vi.hoisted(() => ({
  findClinicIdByUser: vi.fn(),
  findClinicByUserId: vi.fn(),
}));

const mockStaffRepository = vi.hoisted(() => ({
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

vi.mock("@api/staffs/staff.repository", () => ({
  StaffRepository: vi.fn(function () {
    return mockStaffRepository;
  }),
}));

const mockFileRepository = vi.hoisted(() => ({}));

vi.mock("@api/files/file.repository", () => ({
  FileRepository: vi.fn(function () {
    return mockFileRepository;
  }),
}));
const mockFileService = vi.hoisted(() => ({
  createUpload: vi.fn(),
  confirmUpload: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock("@api/files/file.service", () => ({
  FileService: vi.fn(function () {
    return mockFileService;
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

const { UserRepository } = await import("@api/users/user.repository");
const { ClinicRepository } = await import("@api/clinics/clinic.repository");
const { ClinicService } = await import("@api/clinics/clinic.service");
const { StaffRepository } = await import("@api/staffs/staff.repository");
const { StaffService } = await import("@api/staffs/staff.service");
const { UserService } = await import("@api/users/user.service");

const clinicService = new ClinicService(new ClinicRepository({} as any));
const staffService = new StaffService(
  new StaffRepository({} as any),
  clinicService,
);
const fileService = new FileService(new FileRepository({} as any));
const userService = new UserService(
  new UserRepository({} as any),
  clinicService,
  staffService,
  fileService,
);

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
    mockStaffRepository.findStaff.mockResolvedValue({
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
// ── fileUpload ────────────────────────────────────────────────────────────────

describe("UserService.fileUpload", () => {
  it("lève NotFoundError si l'utilisateur n'existe pas", async () => {
    const { NotFoundError } = await import("@api/errors");
    mockUserRepository.getUserById.mockResolvedValue(null);

    await expect(
      userService.fileUpload({
        authorId: "user-1" as UserId,
        mimeType: "image/png",
      }),
    ).rejects.toThrow(NotFoundError);

    expect(mockFileService.createUpload).not.toHaveBeenCalled();
  });

  it("délègue la création d'upload à FileService avec le bon entityType/entityId", async () => {
    mockUserRepository.getUserById.mockResolvedValue(mockUser);
    mockFileService.createUpload.mockResolvedValue({
      fileId: "file-1",
      uploadUrl: "https://signed-upload-url",
    });

    const result = await userService.fileUpload({
      authorId: "user-1" as UserId,
      mimeType: "image/png",
    });

    expect(mockFileService.createUpload).toHaveBeenCalledWith({
      entityType: "USER",
      entityId: "user-1",
      mimeType: "image/png",
      type: "IMAGE",
    });
    expect(result).toEqual({
      fileId: "file-1",
      uploadUrl: "https://signed-upload-url",
    });
  });
});

// ── confirmAvatarUpload ──────────────────────────────────────────────────────

describe("UserService.confirmAvatarUpload", () => {
  it("lève NotFoundError si l'utilisateur n'existe pas", async () => {
    const { NotFoundError } = await import("@api/errors");
    mockUserRepository.getUserById.mockResolvedValue(null);

    await expect(
      userService.confirmAvatarUpload({
        userId: "user-1" as UserId,
        fileId: "file-1",
      }),
    ).rejects.toThrow(NotFoundError);

    expect(mockFileService.confirmUpload).not.toHaveBeenCalled();
  });

  it("confirme l'upload, met à jour l'avatar et retourne le user avec avatarUrl", async () => {
    mockUserRepository.getUserById.mockResolvedValue({
      ...mockUser,
      avatarId: null,
    });
    mockFileService.confirmUpload.mockResolvedValue({ id: "file-1" });
    mockUserRepository.updateAvatar.mockResolvedValue({
      ...mockUser,
      avatarId: "file-1",
      avatar: {
        id: "file-1",
        storageKey: "users/user-1/uuid-abc",
        mimeType: "image/png",
        size: 2048,
        type: "IMAGE",
        entityType: "USER",
        entityId: "user-1",
      },
    });

    const result = await userService.confirmAvatarUpload({
      userId: "user-1" as UserId,
      fileId: "file-1",
    });

    expect(mockFileService.confirmUpload).toHaveBeenCalledWith({
      fileId: "file-1",
      expectedEntityType: "USER",
      expectedEntityId: "user-1",
    });
    expect(mockUserRepository.updateAvatar).toHaveBeenCalledWith({
      userId: "user-1",
      avatarId: "file-1",
    });
    expect(result.avatarUrl).toContain("users/user-1/uuid-abc");
    expect(mockFileService.deleteFile).not.toHaveBeenCalled();
  });

  it("supprime l'ancien avatar après avoir confirmé le nouveau", async () => {
    mockUserRepository.getUserById.mockResolvedValue({
      ...mockUser,
      avatarId: "old-file-id",
    });
    mockFileService.confirmUpload.mockResolvedValue({ id: "new-file-id" });
    mockUserRepository.updateAvatar.mockResolvedValue({
      ...mockUser,
      avatarId: "new-file-id",
      avatar: {
        id: "new-file-id",
        storageKey: "users/user-1/uuid-new",
        mimeType: "image/png",
        size: 2048,
        type: "IMAGE",
        entityType: "USER",
        entityId: "user-1",
      },
    });
    mockFileService.deleteFile.mockResolvedValue(undefined); // 👈 ajouté

    await userService.confirmAvatarUpload({
      userId: "user-1" as UserId,
      fileId: "new-file-id",
    });

    expect(mockFileService.deleteFile).toHaveBeenCalledWith("old-file-id");
  });
  it("ne bloque pas la réponse si la suppression de l'ancien avatar échoue", async () => {
    mockUserRepository.getUserById.mockResolvedValue({
      ...mockUser,
      avatarId: "old-file-id",
    });
    mockFileService.confirmUpload.mockResolvedValue({ id: "new-file-id" });
    mockUserRepository.updateAvatar.mockResolvedValue({
      ...mockUser,
      avatarId: "new-file-id",
      avatar: {
        id: "new-file-id",
        storageKey: "users/user-1/uuid-new",
        mimeType: "image/png",
        size: 2048,
        type: "IMAGE",
        entityType: "USER",
        entityId: "user-1",
      },
    });
    mockFileService.deleteFile.mockRejectedValue(new Error("S3 down"));

    const result = await userService.confirmAvatarUpload({
      userId: "user-1" as UserId,
      fileId: "new-file-id",
    });

    expect(result.avatarUrl).toContain("users/user-1/uuid-new");
  });

  it("ne tente pas de suppression si l'utilisateur n'avait pas d'ancien avatar", async () => {
    mockUserRepository.getUserById.mockResolvedValue({
      ...mockUser,
      avatarId: null,
    });
    mockFileService.confirmUpload.mockResolvedValue({ id: "file-1" });
    mockUserRepository.updateAvatar.mockResolvedValue({
      ...mockUser,
      avatarId: "file-1",
      avatar: {
        id: "file-1",
        storageKey: "users/user-1/uuid-abc",
        mimeType: "image/png",
        size: 2048,
        type: "IMAGE",
        entityType: "USER",
        entityId: "user-1",
      },
    });

    await userService.confirmAvatarUpload({
      userId: "user-1" as UserId,
      fileId: "file-1",
    });

    expect(mockFileService.deleteFile).not.toHaveBeenCalled();
  });
});
