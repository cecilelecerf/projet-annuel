import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, BadRequestError } from "@api/errors";
import type { JwtPayload } from "@api/utils/jwt";
import { ClinicId, UserId } from "@armali/schemas";

const mockConversationRepository = vi.hoisted(() => ({
  findExistingDirect: vi.fn(),
  listForUser: vi.fn(),
  findById: vi.fn(),
  createDirect: vi.fn(),
  createGroup: vi.fn(),
  addMembers: vi.fn(),
  removeMember: vi.fn(),
  updateMemberRole: vi.fn(),
  rename: vi.fn(),
  touchLastMessageAt: vi.fn(),
  updateLastReadAt: vi.fn(),
  listConversationIdsForUser: vi.fn(),
}));

const mockMessageRepository = vi.hoisted(() => ({
  create: vi.fn(),
  listByConversation: vi.fn(),
  countUnread: vi.fn(),
}));

const mockContactsRepository = vi.hoisted(() => ({
  listClinicColleagues: vi.fn(),
  listDirectors: vi.fn(),
  findUsersWithClinicIds: vi.fn(),
  findClinicIdsForVeterinarian: vi.fn(),
}));

vi.mock("@api/messaging/conversation.repository", () => ({
  ConversationRepository: vi.fn(function (this: unknown) {
    return mockConversationRepository;
  }),
}));
vi.mock("@api/messaging/message.repository", () => ({
  MessageRepository: vi.fn(function (this: unknown) {
    return mockMessageRepository;
  }),
}));
vi.mock("@api/messaging/contacts.repository", () => ({
  ContactsRepository: vi.fn(function (this: unknown) {
    return mockContactsRepository;
  }),
}));

const { MessagingService } = await import("@api/messaging/messaging.service");
const { MessageRepository } = await import("@api/messaging/message.repository");
const { ConversationRepository } =
  await import("@api/messaging/conversation.repository");
const { ContactsRepository } =
  await import("@api/messaging/contacts.repository");

const messagingService = new MessagingService(
  new MessageRepository({} as any),
  new ConversationRepository({} as any),
  new ContactsRepository({} as any),
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeActor = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  id: "actor-1" as UserId,
  email: "actor@clinic.fr",
  role: "VETERINARIAN",
  clinicId: "clinic-1" as ClinicId,
  ...overrides,
});

const makeDirectorUser = (id: string, clinicId: string) => ({
  id,
  role: "DIRECTOR" as const,
  clinicIds: [clinicId],
});

const makeVetUser = (id: string, clinicIds: string[]) => ({
  id,
  role: "VETERINARIAN" as const,
  clinicIds,
});

const makeSecretaryUser = (id: string, clinicId: string) => ({
  id,
  role: "SECRETARY" as const,
  clinicIds: [clinicId],
});

type MemberOverrides = {
  id?: string;
  role?: "MEMBER" | "ADMIN";
  userId?: string;
  conversationId?: string;
  user?: { id: string; firstname: string; lastname: string; avatar: null };
};

const makeMember = (overrides: MemberOverrides = {}) => {
  const userId = overrides.userId ?? "actor-1";
  return {
    id: "member-1",
    role: "MEMBER" as const,
    userId,
    conversationId: "conv-1",
    user: {
      id: userId,
      firstname: "Jean",
      lastname: "Dupont",
      avatar: null,
    },
    ...overrides,
  };
};
const makeConversation = (overrides = {}) => ({
  id: "conv-1",
  type: "GROUP" as const,
  scope: "CLINIC" as const,
  clinicId: "clinic-1",
  conversationMembers: [makeMember({ role: "ADMIN" })],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockContactsRepository.findClinicIdsForVeterinarian.mockResolvedValue([
    "clinic-1",
  ]);
});

// ── Éligibilité CLINIC ────────────────────────────────────────────────────────

describe("createConversation — scope CLINIC", () => {
  it("crée un groupe quand tous les membres appartiennent à la clinique ciblée", async () => {
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeSecretaryUser("sec-1", "clinic-1"),
      makeVetUser("vet-2", ["clinic-1"]),
    ]);
    mockConversationRepository.createGroup.mockResolvedValue(
      makeConversation(),
    );

    await messagingService.createConversation(makeActor(), {
      type: "GROUP",
      scope: "CLINIC",
      clinicId: "clinic-1" as ClinicId,
      name: "Équipe",
      memberIds: ["sec-1" as UserId, "vet-2" as UserId],
    });

    expect(mockConversationRepository.createGroup).toHaveBeenCalledWith(
      expect.objectContaining({ clinicId: "clinic-1", scope: "CLINIC" }),
    );
  });

  it("rejette si un membre appartient à une autre clinique", async () => {
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeSecretaryUser("sec-1", "clinic-2"),
    ]);

    await expect(
      messagingService.createConversation(makeActor(), {
        type: "GROUP",
        scope: "CLINIC",
        clinicId: "clinic-1" as ClinicId,
        name: "Équipe",
        memberIds: ["sec-1"] as UserId[],
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockConversationRepository.createGroup).not.toHaveBeenCalled();
  });

  it("accepte un véto qui exerce dans plusieurs cliniques dont celle ciblée", async () => {
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeVetUser("vet-multi", ["clinic-2", "clinic-1"]),
    ]);
    mockConversationRepository.createGroup.mockResolvedValue(
      makeConversation(),
    );

    await messagingService.createConversation(makeActor(), {
      type: "GROUP",
      scope: "CLINIC",
      clinicId: "clinic-1" as ClinicId,
      name: "Équipe",
      memberIds: ["vet-multi" as UserId],
    });

    expect(mockConversationRepository.createGroup).toHaveBeenCalledWith(
      expect.objectContaining({ clinicId: "clinic-1", scope: "CLINIC" }),
    );
  });

  it("rejette si l'acteur n'a pas accès à la clinique ciblée (véto sans cette clinique)", async () => {
    mockContactsRepository.findClinicIdsForVeterinarian.mockResolvedValue([
      "clinic-9",
    ]);

    await expect(
      messagingService.createConversation(makeActor(), {
        type: "GROUP",
        scope: "CLINIC",
        clinicId: "clinic-1" as ClinicId,
        name: "Équipe",
        memberIds: ["sec-1"] as UserId[],
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(
      mockContactsRepository.findUsersWithClinicIds,
    ).not.toHaveBeenCalled();
  });

  it("rejette un acteur (rôle mono-clinique) sans clinique du tout", async () => {
    await expect(
      messagingService.createConversation(
        makeActor({ role: "SECRETARY", clinicId: undefined }),
        {
          type: "GROUP",
          scope: "CLINIC",
          clinicId: "clinic-1" as ClinicId,
          name: "Équipe",
          memberIds: ["sec-1"] as UserId[],
        },
      ),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ── Éligibilité DIRECTOR_NETWORK ──────────────────────────────────────────────

describe("createConversation — scope DIRECTOR_NETWORK", () => {
  it("rejette un acteur qui n'est pas directeur", async () => {
    await expect(
      messagingService.createConversation(makeActor({ role: "VETERINARIAN" }), {
        type: "GROUP",
        scope: "DIRECTOR_NETWORK",
        name: "Réseau",
        memberIds: ["dir-2", "dir-3"] as UserId[],
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(
      mockContactsRepository.findUsersWithClinicIds,
    ).not.toHaveBeenCalled();
  });

  it("rejette si un membre n'est pas directeur", async () => {
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeDirectorUser("dir-2", "clinic-2"),
      makeVetUser("vet-3", ["clinic-3"]),
    ]);

    await expect(
      messagingService.createConversation(
        makeActor({ role: "DIRECTOR", clinicId: "clinic-1" as ClinicId }),
        {
          type: "GROUP",
          scope: "DIRECTOR_NETWORK",
          name: "Réseau",
          memberIds: ["dir-2", "vet-3"] as UserId[],
        },
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("accepte des directeurs de cliniques différentes", async () => {
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeDirectorUser("dir-2", "clinic-2"),
      makeDirectorUser("dir-3", "clinic-3"),
    ]);
    mockConversationRepository.createGroup.mockResolvedValue(
      makeConversation({ scope: "DIRECTOR_NETWORK", clinicId: null }),
    );

    await messagingService.createConversation(
      makeActor({ role: "DIRECTOR", clinicId: "clinic-1" as ClinicId }),
      {
        type: "GROUP",
        scope: "DIRECTOR_NETWORK",
        name: "Réseau",
        memberIds: ["dir-2", "dir-3"] as UserId[],
      },
    );

    expect(mockConversationRepository.createGroup).toHaveBeenCalledWith(
      expect.objectContaining({ clinicId: null, scope: "DIRECTOR_NETWORK" }),
    );
  });
});

// ── Éligibilité VETERINARIAN_NETWORK ──────────────────────────────────────────

describe("createConversation — scope VETERINARIAN_NETWORK", () => {
  it("rejette un acteur qui n'est pas vétérinaire", async () => {
    await expect(
      messagingService.createConversation(
        makeActor({ role: "DIRECTOR", clinicId: "clinic-1" as ClinicId }),
        {
          type: "GROUP",
          scope: "VETERINARIAN_NETWORK",
          name: "Vétos",
          memberIds: ["vet-2", "vet-3"] as UserId[],
        },
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("rejette si un membre n'est pas vétérinaire", async () => {
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeSecretaryUser("sec-1", "clinic-1"),
    ]);

    await expect(
      messagingService.createConversation(makeActor(), {
        type: "GROUP",
        scope: "VETERINARIAN_NETWORK",
        name: "Vétos",
        memberIds: ["sec-1"] as UserId[],
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("rejette un vétérinaire qui ne partage aucune clinique avec l'acteur", async () => {
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeVetUser("vet-isole", ["clinic-9"]),
    ]);

    await expect(
      messagingService.createConversation(makeActor(), {
        type: "GROUP",
        scope: "VETERINARIAN_NETWORK",
        name: "Vétos",
        memberIds: ["vet-isole"] as UserId[],
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("accepte des vétérinaires partageant au moins une clinique avec l'acteur, même multi-cliniques", async () => {
    mockContactsRepository.findClinicIdsForVeterinarian.mockResolvedValue([
      "clinic-1",
      "clinic-2",
    ]);
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeVetUser("vet-a", ["clinic-2", "clinic-5"]),
      makeVetUser("vet-b", ["clinic-1"]),
    ]);
    mockConversationRepository.createGroup.mockResolvedValue(
      makeConversation({ scope: "VETERINARIAN_NETWORK", clinicId: null }),
    );

    await messagingService.createConversation(makeActor(), {
      type: "GROUP",
      scope: "VETERINARIAN_NETWORK",
      name: "Vétos",
      memberIds: ["vet-a", "vet-b"] as UserId[],
    });

    expect(mockConversationRepository.createGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: null,
        scope: "VETERINARIAN_NETWORK",
      }),
    );
  });
});

// ── Dédoublonnage des conversations DIRECT ───────────────────────────────────

describe("createConversation — type DIRECT", () => {
  it("retourne la conversation existante (avec avatars formatés) au lieu d'en créer une nouvelle", async () => {
    const existing = makeConversation({ type: "DIRECT" });
    mockConversationRepository.findExistingDirect.mockResolvedValue(existing);

    const result = await messagingService.createConversation(makeActor(), {
      type: "DIRECT",
      userId: "other-user" as UserId,
    });

    expect(result.id).toBe(existing.id);
    expect(mockConversationRepository.createDirect).not.toHaveBeenCalled();
  });

  it("rejette si l'utilisateur essaie de se parler à lui-même", async () => {
    await expect(
      messagingService.createConversation(makeActor(), {
        type: "DIRECT",
        userId: "actor-1" as UserId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it("infère le scope DIRECTOR_NETWORK pour un directeur d'une autre clinique", async () => {
    mockConversationRepository.findExistingDirect.mockResolvedValue(null);
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeDirectorUser("dir-2", "clinic-2"),
    ]);
    mockConversationRepository.createDirect.mockResolvedValue(
      makeConversation(),
    );

    await messagingService.createConversation(
      makeActor({ role: "DIRECTOR", clinicId: "clinic-1" as ClinicId }),
      { type: "DIRECT", userId: "dir-2" as UserId },
    );

    expect(mockConversationRepository.createDirect).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "DIRECTOR_NETWORK", clinicId: null }),
    );
  });

  it("infère le scope VETERINARIAN_NETWORK entre deux vétérinaires sans clinique commune", async () => {
    mockConversationRepository.findExistingDirect.mockResolvedValue(null);
    mockContactsRepository.findClinicIdsForVeterinarian.mockResolvedValue([
      "clinic-1",
    ]);
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeVetUser("vet-autre", ["clinic-9"]),
    ]);
    mockConversationRepository.createDirect.mockResolvedValue(
      makeConversation({ scope: "VETERINARIAN_NETWORK", clinicId: null }),
    );

    await messagingService.createConversation(makeActor(), {
      type: "DIRECT",
      userId: "vet-autre" as UserId,
    });

    expect(mockConversationRepository.createDirect).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "VETERINARIAN_NETWORK",
        clinicId: null,
      }),
    );
  });

  it("un directeur peut écrire à un véto qui exerce dans sa clinique parmi d'autres", async () => {
    mockConversationRepository.findExistingDirect.mockResolvedValue(null);
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeVetUser("vet-multi", ["clinic-2", "clinic-1"]),
    ]);
    mockConversationRepository.createDirect.mockResolvedValue(
      makeConversation(),
    );

    await messagingService.createConversation(
      makeActor({ role: "DIRECTOR", clinicId: "clinic-1" as ClinicId }),
      { type: "DIRECT", userId: "vet-multi" as UserId },
    );

    expect(mockConversationRepository.createDirect).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "CLINIC", clinicId: "clinic-1" }),
    );
  });

  it("rejette deux utilisateurs sans clinique commune ni relation directeur/vétérinaire", async () => {
    mockConversationRepository.findExistingDirect.mockResolvedValue(null);
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeSecretaryUser("sec-isolee", "clinic-9"),
    ]);

    await expect(
      messagingService.createConversation(makeActor(), {
        type: "DIRECT",
        userId: "sec-isolee" as UserId,
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ── Droits admin ──────────────────────────────────────────────────────────────

describe("droits admin d'un groupe", () => {
  it("refuse à un MEMBER de renommer le groupe", async () => {
    mockConversationRepository.findById.mockResolvedValue(
      makeConversation({
        conversationMembers: [makeMember({ role: "MEMBER" })],
      }),
    );

    await expect(
      messagingService.rename("conv-1", "actor-1", "Nouveau nom"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("refuse à un MEMBER d'ajouter des membres", async () => {
    mockConversationRepository.findById.mockResolvedValue(
      makeConversation({
        conversationMembers: [makeMember({ role: "MEMBER" })],
      }),
    );

    await expect(
      messagingService.addMembers(
        "conv-1",
        "actor-1",
        "VETERINARIAN",
        ["new-user"],
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("un ADMIN de clinique peut ajouter un membre de la même clinique", async () => {
    mockConversationRepository.findById.mockResolvedValue(
      makeConversation({
        conversationMembers: [makeMember({ role: "ADMIN" })],
      }),
    );
    mockContactsRepository.findUsersWithClinicIds.mockResolvedValue([
      makeSecretaryUser("sec-nouveau", "clinic-1"),
    ]);
    mockConversationRepository.addMembers.mockResolvedValue(
      makeConversation({
        conversationMembers: [
          makeMember({ role: "ADMIN" }),
          makeMember({ id: "member-2", userId: "sec-nouveau" }),
        ],
      }),
    );

    await messagingService.addMembers(
      "conv-1",
      "actor-1",
      "VETERINARIAN",
      ["sec-nouveau"],
    );

    expect(mockConversationRepository.addMembers).toHaveBeenCalledWith(
      "conv-1",
      ["sec-nouveau"],
    );
  });

  it("refuse à un MEMBER de retirer un autre membre", async () => {
    mockConversationRepository.findById.mockResolvedValue(
      makeConversation({
        conversationMembers: [
          makeMember({ role: "MEMBER", userId: "actor-1" }),
          makeMember({ id: "member-2", role: "MEMBER", userId: "target-1" }),
        ],
      }),
    );

    await expect(
      messagingService.removeMember("conv-1", "actor-1", "target-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("autorise un membre à quitter lui-même le groupe", async () => {
    mockConversationRepository.findById.mockResolvedValue(
      makeConversation({
        conversationMembers: [
          makeMember({ role: "MEMBER", userId: "actor-1" }),
        ],
      }),
    );
    mockConversationRepository.removeMember.mockResolvedValue(undefined);

    await messagingService.removeMember("conv-1", "actor-1", "actor-1");

    expect(mockConversationRepository.removeMember).toHaveBeenCalledWith(
      "conv-1",
      "actor-1",
    );
  });

  it("refuse de promouvoir un membre dans une discussion privée (DIRECT)", async () => {
    mockConversationRepository.findById.mockResolvedValue(
      makeConversation({
        type: "DIRECT",
        conversationMembers: [makeMember({ role: "ADMIN" })],
      }),
    );

    await expect(
      messagingService.updateMemberRole(
        "conv-1",
        "actor-1",
        "target-1",
        "ADMIN",
      ),
    ).rejects.toThrow(BadRequestError);
  });
});

// ── Marquage de lecture à l'envoi ─────────────────────────────────────────────

describe("sendMessage — marque sa propre lecture", () => {
  it("met à jour son propre lastReadAt après avoir envoyé un message", async () => {
    mockConversationRepository.findById.mockResolvedValue(
      makeConversation({
        conversationMembers: [makeMember({ role: "ADMIN" })],
      }),
    );
    mockMessageRepository.create.mockResolvedValue({
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "actor-1",
      content: "Bonjour",
      createdAt: new Date("2026-01-01T10:00:00Z"),
      sender: {
        id: "actor-1",
        firstname: "Jean",
        lastname: "Dupont",
        avatar: null,
      },
    });

    await messagingService.sendMessage(makeActor(), "conv-1", "Bonjour");

    expect(mockConversationRepository.updateLastReadAt).toHaveBeenCalledWith(
      "conv-1",
      "actor-1",
      new Date("2026-01-01T10:00:00Z"),
    );
  });
});