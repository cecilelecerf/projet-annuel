import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "@api/errors";

const mockAnimalRepository = vi.hoisted(() => ({
  findClinicIdsForClient: vi.fn(),
  findNamesByClientId: vi.fn(),
  findOwnershipInfo: vi.fn(),
}));
const mockAnimalMeetingRepository = vi.hoisted(() => ({
  findLatestWeight: vi.fn(),
}));
const mockProductClinicRepository = vi.hoisted(() => ({
  findByClinics: vi.fn(),
  findByIdWithClinic: vi.fn(),
  findFoodProductsByClinics: vi.fn(),
}));
const mockAnimalHealthConditionRepository = vi.hoisted(() => ({
  findByAnimal: vi.fn(),
}));

const { ClientShopService } = await import("../shop.service");

const service = new ClientShopService(
  mockAnimalRepository as any,
  mockAnimalMeetingRepository as any,
  mockProductClinicRepository as any,
  mockAnimalHealthConditionRepository as any,
);

beforeEach(() => vi.clearAllMocks());

// ── getProducts ──────────────────────────────────────────────────────────────

describe("ClientShopService.getProducts", () => {
  it("retourne un tableau vide si le client n'a accès à aucune clinique", async () => {
    mockAnimalRepository.findClinicIdsForClient.mockResolvedValue([]);
    const result = await service.getProducts("client-1");
    expect(result).toEqual([]);
    expect(mockProductClinicRepository.findByClinics).not.toHaveBeenCalled();
  });

  it("délègue au repository avec les cliniques accessibles", async () => {
    mockAnimalRepository.findClinicIdsForClient.mockResolvedValue(["clinic-1"]);
    mockProductClinicRepository.findByClinics.mockResolvedValue([{ id: "cp-1" }]);
    const result = await service.getProducts("client-1");
    expect(mockProductClinicRepository.findByClinics).toHaveBeenCalledWith(["clinic-1"]);
    expect(result).toHaveLength(1);
  });
});

// ── getProductById ───────────────────────────────────────────────────────────

describe("ClientShopService.getProductById", () => {
  it("NotFoundError si le produit n'existe pas", async () => {
    mockAnimalRepository.findClinicIdsForClient.mockResolvedValue(["clinic-1"]);
    mockProductClinicRepository.findByIdWithClinic.mockResolvedValue(null);
    await expect(service.getProductById("client-1", "cp-1")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("ForbiddenError si le produit appartient à une clinique inaccessible", async () => {
    mockAnimalRepository.findClinicIdsForClient.mockResolvedValue(["clinic-1"]);
    mockProductClinicRepository.findByIdWithClinic.mockResolvedValue({
      id: "cp-1",
      clinicId: "clinic-AUTRE",
    });
    await expect(service.getProductById("client-1", "cp-1")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("retourne le produit si la clinique est accessible", async () => {
    mockAnimalRepository.findClinicIdsForClient.mockResolvedValue(["clinic-1"]);
    mockProductClinicRepository.findByIdWithClinic.mockResolvedValue({
      id: "cp-1",
      clinicId: "clinic-1",
    });
    const result = await service.getProductById("client-1", "cp-1");
    expect(result.id).toBe("cp-1");
  });
});

// ── getAnimals ───────────────────────────────────────────────────────────────

describe("ClientShopService.getAnimals", () => {
  it("délègue au repository", async () => {
    mockAnimalRepository.findNamesByClientId.mockResolvedValue([
      { id: "a1", name: "Rex" },
    ]);
    const result = await service.getAnimals("client-1");
    expect(result).toHaveLength(1);
  });
});

// ── getFoodRecommendations ────────────────────────────────────────────────

const makeAnimal = (overrides = {}) => ({
  id: "animal-1",
  clientId: "client-1",
  dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 3)),
  activity: 3,
  ...overrides,
});

describe("ClientShopService.getFoodRecommendations — accès", () => {
  it("NotFoundError si l'animal n'existe pas", async () => {
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(null);
    await expect(
      service.getFoodRecommendations("client-1", "unknown"),
    ).rejects.toThrow(NotFoundError);
  });

  it("ForbiddenError si l'animal appartient à un autre client", async () => {
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(
      makeAnimal({ clientId: "client-AUTRE" }),
    );
    await expect(
      service.getFoodRecommendations("client-1", "animal-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("retourne un tableau vide si aucune clinique accessible", async () => {
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(makeAnimal());
    mockAnimalMeetingRepository.findLatestWeight.mockResolvedValue(null);
    mockAnimalHealthConditionRepository.findByAnimal.mockResolvedValue([]);
    mockAnimalRepository.findClinicIdsForClient.mockResolvedValue([]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result).toEqual([]);
    expect(
      mockProductClinicRepository.findFoodProductsByClinics,
    ).not.toHaveBeenCalled();
  });
});

describe("ClientShopService.getFoodRecommendations — classification", () => {
  beforeEach(() => {
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(makeAnimal());
    mockAnimalRepository.findClinicIdsForClient.mockResolvedValue(["clinic-1"]);
    mockAnimalMeetingRepository.findLatestWeight.mockResolvedValue(null);
  });

  it("recommendation null si le produit n'a aucun lien avec les conditions de l'animal", async () => {
    mockAnimalHealthConditionRepository.findByAnimal.mockResolvedValue([
      { healthConditionId: "hc-1", healthCondition: { name: "Diabète" } },
    ]);
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      {
        id: "cp-1",
        product: {
          Food: { caloriesPer100: 350, foodHealthConditions: [] },
        },
      },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");

    expect(result[0].recommendation).toBeNull();
    expect(result[0].matchedConditions).toEqual([]);
  });

  it("recommendation RECOMMENDED si une condition correspond", async () => {
    mockAnimalHealthConditionRepository.findByAnimal.mockResolvedValue([
      { healthConditionId: "hc-1", healthCondition: { name: "Diabète" } },
    ]);
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      {
        id: "cp-1",
        product: {
          Food: {
            caloriesPer100: 350,
            foodHealthConditions: [
              { healthConditionId: "hc-1", recommendation: "RECOMMENDED" },
            ],
          },
        },
      },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");

    expect(result[0].recommendation).toBe("RECOMMENDED");
    expect(result[0].matchedConditions).toEqual(["Diabète"]);
  });

  it("AVOID prend le pas sur RECOMMENDED si le produit a les deux", async () => {
    mockAnimalHealthConditionRepository.findByAnimal.mockResolvedValue([
      { healthConditionId: "hc-1", healthCondition: { name: "Diabète" } },
      { healthConditionId: "hc-2", healthCondition: { name: "Obésité" } },
    ]);
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      {
        id: "cp-1",
        product: {
          Food: {
            caloriesPer100: 350,
            foodHealthConditions: [
              { healthConditionId: "hc-1", recommendation: "RECOMMENDED" },
              { healthConditionId: "hc-2", recommendation: "AVOID" },
            ],
          },
        },
      },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");

    expect(result[0].recommendation).toBe("AVOID");
  });

  it("ignore les produits qui ne sont pas des aliments (Food null)", async () => {
    mockAnimalHealthConditionRepository.findByAnimal.mockResolvedValue([]);
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      { id: "cp-1", product: { Food: null } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");

    expect(result[0].recommendation).toBeNull();
    expect(result[0].dailyGrams).toBeNull();
  });
});

describe("ClientShopService.getFoodRecommendations — calcul du grammage", () => {
  beforeEach(() => {
    mockAnimalRepository.findClinicIdsForClient.mockResolvedValue(["clinic-1"]);
    mockAnimalHealthConditionRepository.findByAnimal.mockResolvedValue([]);
  });

  it("dailyGrams null si le poids de l'animal est inconnu", async () => {
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(makeAnimal());
    mockAnimalMeetingRepository.findLatestWeight.mockResolvedValue(null);
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBeNull();
  });

  it("dailyGrams null si les calories du produit sont inconnues", async () => {
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(makeAnimal());
    mockAnimalMeetingRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: null, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBeNull();
  });

  it("calcule correctement le grammage pour un adulte (RER × 1.6 × 1)", async () => {
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(
      makeAnimal({ activity: 3 }),
    );
    mockAnimalMeetingRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBe(180);
  });

  it("applique un facteur x2 pour un chiot/chaton (< 1 an)", async () => {
    const puppyBirthDate = new Date();
    puppyBirthDate.setMonth(puppyBirthDate.getMonth() - 6);
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(
      makeAnimal({ dateOfBirth: puppyBirthDate, activity: 3 }),
    );
    mockAnimalMeetingRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBe(360);
  });

  it("applique un facteur x0.9 pour un senior (≥ 7 ans)", async () => {
    const seniorBirthDate = new Date();
    seniorBirthDate.setFullYear(seniorBirthDate.getFullYear() - 8);
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(
      makeAnimal({ dateOfBirth: seniorBirthDate, activity: 3 }),
    );
    mockAnimalMeetingRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBe(162);
  });

  it("utilise le facteur d'activité par défaut (3) si activity est null", async () => {
    mockAnimalRepository.findOwnershipInfo.mockResolvedValue(
      makeAnimal({ activity: null }),
    );
    mockAnimalMeetingRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockProductClinicRepository.findFoodProductsByClinics.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBe(180);
  });
});