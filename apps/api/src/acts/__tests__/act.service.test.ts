import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "@api/errors";

const mockActRepository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../act.repository", () => ({
  ActRepository: vi.fn(function () {
    return mockActRepository;
  }),
}));

const { ActRepository } = await import("../act.repository");
const { ActService } = await import("../act.service");

const service = new ActService(new ActRepository({} as any));

beforeEach(() => vi.clearAllMocks());

const makeAct = (overrides = {}) => ({
  id: "act-1",
  name: "Consultation",
  description: "Consultation standard",
  type: "CONSULTATION",
  basePrice: 45,
  ...overrides,
});

// ── getAll ───────────────────────────────────────────────────────────────────

describe("ActService.getAll", () => {
  it("délègue directement au repository", async () => {
    mockActRepository.findAll.mockResolvedValue([makeAct()]);

    const result = await service.getAll();

    expect(mockActRepository.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});

// ── getById ──────────────────────────────────────────────────────────────────

describe("ActService.getById", () => {
  it("retourne l'acte trouvé", async () => {
    mockActRepository.findById.mockResolvedValue(makeAct());

    const result = await service.getById("act-1");

    expect(result.id).toBe("act-1");
  });

  it("lève NotFoundError si absent", async () => {
    mockActRepository.findById.mockResolvedValue(null);

    await expect(service.getById("unknown")).rejects.toThrow(NotFoundError);
  });
});

// ── create ───────────────────────────────────────────────────────────────────

describe("ActService.create", () => {
  const data = {
    name: "Vaccination",
    description: "Vaccin annuel",
    type: "VACCINATION",
    basePrice: 30,
  } as any;

  it("ADMIN crée l'acte", async () => {
    mockActRepository.create.mockResolvedValue(makeAct(data));

    const result = await service.create(data, "ADMIN");

    expect(mockActRepository.create).toHaveBeenCalledWith(data);
    expect(result.name).toBe("Vaccination");
  });

  it.each(["DIRECTOR", "REFERENT", "SECRETARY", "VETERINARIAN", "CLIENT"])(
    "%s — ForbiddenError, aucune création",
    async (role) => {
      await expect(service.create(data, role as any)).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockActRepository.create).not.toHaveBeenCalled();
    },
  );
});

// ── update ───────────────────────────────────────────────────────────────────

describe("ActService.update", () => {
  it("rôle non-ADMIN — ForbiddenError avant toute lecture", async () => {
    await expect(
      service.update("act-1", { name: "X" } as any, "DIRECTOR"),
    ).rejects.toThrow(ForbiddenError);
    expect(mockActRepository.findById).not.toHaveBeenCalled();
  });

  it("acte introuvable — NotFoundError", async () => {
    mockActRepository.findById.mockResolvedValue(null);

    await expect(
      service.update("unknown", { name: "X" } as any, "ADMIN"),
    ).rejects.toThrow(NotFoundError);
    expect(mockActRepository.update).not.toHaveBeenCalled();
  });

  it("ADMIN met à jour l'acte", async () => {
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockActRepository.update.mockResolvedValue(makeAct({ name: "Modifié" }));

    const result = await service.update(
      "act-1",
      { name: "Modifié" } as any,
      "ADMIN",
    );

    expect(mockActRepository.update).toHaveBeenCalledWith("act-1", {
      name: "Modifié",
    });
    expect(result.name).toBe("Modifié");
  });
});

// ── delete ───────────────────────────────────────────────────────────────────

describe("ActService.delete", () => {
  it("rôle non-ADMIN — ForbiddenError", async () => {
    await expect(service.delete("act-1", "VETERINARIAN")).rejects.toThrow(
      ForbiddenError,
    );
    expect(mockActRepository.delete).not.toHaveBeenCalled();
  });

  it("acte introuvable — NotFoundError", async () => {
    mockActRepository.findById.mockResolvedValue(null);

    await expect(service.delete("unknown", "ADMIN")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockActRepository.delete).not.toHaveBeenCalled();
  });

  it("ADMIN supprime l'acte", async () => {
    mockActRepository.findById.mockResolvedValue(makeAct());
    mockActRepository.delete.mockResolvedValue(undefined);

    await service.delete("act-1", "ADMIN");

    expect(mockActRepository.delete).toHaveBeenCalledWith("act-1");
  });
});
