import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestError } from "@api/errors";

const mockService = vi.hoisted(() => ({
  getPets: vi.fn(),
  setPets: vi.fn(),
}));

const mockSafeParse = vi.hoisted(() => vi.fn());

vi.mock(
  "../../../../../packages/schemas/src/veterinarians/veterinarian-pet.schema",
  () => ({
    updateVeterinarianPetsSchema: { safeParse: mockSafeParse },
  }),
);

vi.mock("@armali/schemas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@armali/schemas")>();
  return {
    ...actual,
    petSchema: {
      array: () => ({ parse: (x: unknown) => x }),
    },
  };
});

const { VeterinarianPetController } =
  await import("@api/veterinarians/veterinarian-pets/veterinarian-pet.controller");

const controller = new VeterinarianPetController(mockService as any);

beforeEach(() => vi.clearAllMocks());

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const makeReq = (overrides = {}) => ({
  params: { id: "vet-1" },
  user: { id: "vet-1", role: "VETERINARIAN" },
  body: {},
  ...overrides,
});

// ── getAcceptedPets ────────────────────────────────────────────────────────

describe("VeterinarianPetController.getAcceptedPets", () => {
  it("retourne 200 avec les espèces du service", async () => {
    mockService.getPets.mockResolvedValue([{ id: "pet-1", name: "Chien" }]);
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    await controller.getAcceptedPets(req as any, res, next);

    expect(mockService.getPets).toHaveBeenCalledWith("vet-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: "pet-1", name: "Chien" }]);
    expect(next).not.toHaveBeenCalled();
  });

  it("propage l'erreur du service via next()", async () => {
    const error = new Error("boom");
    mockService.getPets.mockRejectedValue(error);
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    await controller.getAcceptedPets(req as any, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ── setAcceptedPets ───────────────────────────────────────────────────────

describe("VeterinarianPetController.setAcceptedPets", () => {
  it("400 — BadRequestError transmis à next() si safeParse échoue", async () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: { message: "invalid" },
    });
    const req = makeReq({ body: {} });
    const res = makeRes();
    const next = vi.fn();

    await controller.setAcceptedPets(req as any, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockService.setPets).not.toHaveBeenCalled();
  });

  it("200 — délègue au service avec les bons arguments et retourne le résultat", async () => {
    mockSafeParse.mockReturnValue({
      success: true,
      data: { petIds: ["pet-1"] },
    });
    mockService.setPets.mockResolvedValue([{ id: "pet-1", name: "Chien" }]);
    const req = makeReq({
      body: { petIds: ["pet-1"] },
      user: { id: "vet-1", role: "VETERINARIAN" },
    });
    const res = makeRes();
    const next = vi.fn();

    await controller.setAcceptedPets(req as any, res, next);

    expect(mockService.setPets).toHaveBeenCalledWith(
      "vet-1",
      ["pet-1"],
      "VETERINARIAN",
      "vet-1",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: "pet-1", name: "Chien" }]);
  });

  it("propage l'erreur du service (ex: ForbiddenError) via next()", async () => {
    mockSafeParse.mockReturnValue({
      success: true,
      data: { petIds: ["pet-1"] },
    });
    const error = new Error("forbidden");
    mockService.setPets.mockRejectedValue(error);
    const req = makeReq({ body: { petIds: ["pet-1"] } });
    const res = makeRes();
    const next = vi.fn();

    await controller.setAcceptedPets(req as any, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
