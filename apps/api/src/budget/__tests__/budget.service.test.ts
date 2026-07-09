import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestError } from "@api/errors";
import type { UserRole } from "@armali/schemas";

const mockRepository = vi.hoisted(() => ({
  create: vi.fn(),
  findByClinic: vi.fn(),
  getBalance: vi.fn(),
}));
const mockClinicService = vi.hoisted(() => ({ getClinicIdByUserId: vi.fn() }));

const { BudgetService } = await import("../budget.service");

const service = new BudgetService(mockRepository as any, mockClinicService as any);

beforeEach(() => vi.clearAllMocks());

const VIEW_FORBIDDEN_ROLES: UserRole[] = [
  "ADMIN",
  "SECRETARY",
  "VETERINARIAN",
  "CLIENT",
];
// Le référent peut CONSULTER le budget mais pas le créditer
const CREDIT_FORBIDDEN_ROLES: UserRole[] = [
  "ADMIN",
  "REFERENT",
  "SECRETARY",
  "VETERINARIAN",
  "CLIENT",
];

describe("BudgetService.getSummary — consultation (référent + directeur)", () => {
  it.each(VIEW_FORBIDDEN_ROLES)(
    "%s — BadRequestError, réservé référent/directeur",
    async (role) => {
      await expect(service.getSummary("user-1" as any, role)).rejects.toThrow(
        BadRequestError,
      );
      expect(mockClinicService.getClinicIdByUserId).not.toHaveBeenCalled();
    },
  );

  it("résout la clinique puis renvoie solde + historique", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockRepository.getBalance.mockResolvedValue(312.5);
    mockRepository.findByClinic.mockResolvedValue([
      {
        id: "tx-1",
        type: "CREDIT",
        amount: 500,
        createdAt: new Date("2026-01-01T10:00:00Z"),
        createdBy: { firstname: "Sophie", lastname: "Bernard" },
      },
    ]);

    const result = await service.getSummary("user-1" as any, "REFERENT");

    expect(mockClinicService.getClinicIdByUserId).toHaveBeenCalledWith({
      userId: "user-1",
      role: "REFERENT",
    });
    expect(result.balance).toBe(312.5);
    expect(result.transactions).toHaveLength(1);
  });

  it("convertit createdAt en ISO string (pas un objet Date brut)", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockRepository.getBalance.mockResolvedValue(0);
    mockRepository.findByClinic.mockResolvedValue([
      {
        id: "tx-1",
        type: "CREDIT",
        amount: 100,
        createdAt: new Date("2026-01-01T10:00:00Z"),
        createdBy: { firstname: "A", lastname: "B" },
      },
    ]);

    const result = await service.getSummary("user-1" as any, "DIRECTOR");

    expect(typeof result.transactions[0].createdAt).toBe("string");
    expect(result.transactions[0].createdAt).toBe("2026-01-01T10:00:00.000Z");
  });
});

describe("BudgetService.credit — directeur uniquement", () => {
  it.each(CREDIT_FORBIDDEN_ROLES)(
    "%s — BadRequestError, aucun crédit (référent inclus : consultation ≠ crédit)",
    async (role) => {
      await expect(
        service.credit("user-1" as any, role, { amount: 100 }),
      ).rejects.toThrow(BadRequestError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    },
  );

  it("DIRECTOR — crée une transaction CREDIT liée à la clinique résolue", async () => {
    mockClinicService.getClinicIdByUserId.mockResolvedValue("clinic-1");
    mockRepository.create.mockResolvedValue({ id: "tx-1" });

    await service.credit("user-1" as any, "DIRECTOR", {
      amount: 200,
      reason: "Réappro trimestriel",
    });

    expect(mockClinicService.getClinicIdByUserId).toHaveBeenCalledWith({
      userId: "user-1",
      role: "DIRECTOR",
    });
    expect(mockRepository.create).toHaveBeenCalledWith({
      clinicId: "clinic-1",
      createdById: "user-1",
      type: "CREDIT",
      amount: 200,
      reason: "Réappro trimestriel",
    });
  });
});