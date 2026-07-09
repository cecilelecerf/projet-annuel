import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ForbiddenError } from "@api/errors";

const mockRepository = vi.hoisted(() => ({
  findClinicIdsByClient: vi.fn(),
  findClinicProducts: vi.fn(),
  findClinicProductById: vi.fn(),
  findAnimalsByClient: vi.fn(),
  findAnimalOwnedByClient: vi.fn(),
  findLatestWeight: vi.fn(),
  findAnimalHealthConditions: vi.fn(),
  findFoodClinicProducts: vi.fn(),
}));

const { ClientShopService } = await import("../shop.service");

const service = new ClientShopService(mockRepository as any);

beforeEach(() => vi.clearAllMocks());

// ── getProducts ──────────────────────────────────────────────────────────────

describe("ClientShopService.getProducts", () => {
  it("retourne un tableau vide si le client n'a accès à aucune clinique", async () => {
    mockRepository.findClinicIdsByClient.mockResolvedValue([]);
    const result = await service.getProducts("client-1");
    expect(result).toEqual([]);
    expect(mockRepository.findClinicProducts).not.toHaveBeenCalled();
  });

  it("délègue au repository avec les cliniques accessibles", async () => {
    mockRepository.findClinicIdsByClient.mockResolvedValue(["clinic-1"]);
    mockRepository.findClinicProducts.mockResolvedValue([{ id: "cp-1" }]);
    const result = await service.getProducts("client-1");
    expect(mockRepository.findClinicProducts).toHaveBeenCalledWith(["clinic-1"]);
    expect(result).toHaveLength(1);
  });
});

// ── getProductById ───────────────────────────────────────────────────────────

describe("ClientShopService.getProductById", () => {
  it("NotFoundError si le produit n'existe pas", async () => {
    mockRepository.findClinicIdsByClient.mockResolvedValue(["clinic-1"]);
    mockRepository.findClinicProductById.mockResolvedValue(null);
    await expect(service.getProductById("client-1", "cp-1")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("ForbiddenError si le produit appartient à une clinique inaccessible", async () => {
    mockRepository.findClinicIdsByClient.mockResolvedValue(["clinic-1"]);
    mockRepository.findClinicProductById.mockResolvedValue({
      id: "cp-1",
      clinicId: "clinic-AUTRE",
    });
    await expect(service.getProductById("client-1", "cp-1")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("retourne le produit si la clinique est accessible", async () => {
    mockRepository.findClinicIdsByClient.mockResolvedValue(["clinic-1"]);
    mockRepository.findClinicProductById.mockResolvedValue({
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
    mockRepository.findAnimalsByClient.mockResolvedValue([{ id: "a1", name: "Rex" }]);
    const result = await service.getAnimals("client-1");
    expect(result).toHaveLength(1);
  });
});

// ── getFoodRecommendations ────────────────────────────────────────────────

const makeAnimal = (overrides = {}) => ({
  id: "animal-1",
  clientId: "client-1",
  dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 3)), // 3 ans
  activity: 3,
  ...overrides,
});

describe("ClientShopService.getFoodRecommendations — accès", () => {
  it("NotFoundError si l'animal n'existe pas", async () => {
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(null);
    await expect(
      service.getFoodRecommendations("client-1", "unknown"),
    ).rejects.toThrow(NotFoundError);
  });

  it("ForbiddenError si l'animal appartient à un autre client", async () => {
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(
      makeAnimal({ clientId: "client-AUTRE" }),
    );
    await expect(
      service.getFoodRecommendations("client-1", "animal-1"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("retourne un tableau vide si aucune clinique accessible", async () => {
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(makeAnimal());
    mockRepository.findLatestWeight.mockResolvedValue(null);
    mockRepository.findAnimalHealthConditions.mockResolvedValue([]);
    mockRepository.findClinicIdsByClient.mockResolvedValue([]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result).toEqual([]);
    expect(mockRepository.findFoodClinicProducts).not.toHaveBeenCalled();
  });
});

describe("ClientShopService.getFoodRecommendations — classification", () => {
  beforeEach(() => {
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(makeAnimal());
    mockRepository.findClinicIdsByClient.mockResolvedValue(["clinic-1"]);
    mockRepository.findLatestWeight.mockResolvedValue(null);
  });

  it("recommendation null si le produit n'a aucun lien avec les conditions de l'animal", async () => {
    mockRepository.findAnimalHealthConditions.mockResolvedValue([
      { healthConditionId: "hc-1", healthCondition: { name: "Diabète" } },
    ]);
    mockRepository.findFoodClinicProducts.mockResolvedValue([
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
    mockRepository.findAnimalHealthConditions.mockResolvedValue([
      { healthConditionId: "hc-1", healthCondition: { name: "Diabète" } },
    ]);
    mockRepository.findFoodClinicProducts.mockResolvedValue([
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
    mockRepository.findAnimalHealthConditions.mockResolvedValue([
      { healthConditionId: "hc-1", healthCondition: { name: "Diabète" } },
      { healthConditionId: "hc-2", healthCondition: { name: "Obésité" } },
    ]);
    mockRepository.findFoodClinicProducts.mockResolvedValue([
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
    mockRepository.findAnimalHealthConditions.mockResolvedValue([]);
    mockRepository.findFoodClinicProducts.mockResolvedValue([
      { id: "cp-1", product: { Food: null } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");

    expect(result[0].recommendation).toBeNull();
    expect(result[0].dailyGrams).toBeNull();
  });
});

describe("ClientShopService.getFoodRecommendations — calcul du grammage", () => {
  beforeEach(() => {
    mockRepository.findClinicIdsByClient.mockResolvedValue(["clinic-1"]);
    mockRepository.findAnimalHealthConditions.mockResolvedValue([]);
  });

  it("dailyGrams null si le poids de l'animal est inconnu", async () => {
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(makeAnimal());
    mockRepository.findLatestWeight.mockResolvedValue(null);
    mockRepository.findFoodClinicProducts.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBeNull();
  });

  it("dailyGrams null si les calories du produit sont inconnues", async () => {
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(makeAnimal());
    mockRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockRepository.findFoodClinicProducts.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: null, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBeNull();
  });

  it("calcule correctement le grammage pour un adulte (RER × 1.6 × 1)", async () => {
    // poids 10kg, activité 3 (facteur 1.6), 3 ans (facteur 1), 350 kcal/100g
    // RER = 70 × 10^0.75 ≈ 393.64 → MER ≈ 629.82 → 629.82/350×100 ≈ 180g
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(
      makeAnimal({ activity: 3 }),
    );
    mockRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockRepository.findFoodClinicProducts.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBe(180);
  });

  it("applique un facteur x2 pour un chiot/chaton (< 1 an)", async () => {
    const puppyBirthDate = new Date();
    puppyBirthDate.setMonth(puppyBirthDate.getMonth() - 6); // 6 mois
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(
      makeAnimal({ dateOfBirth: puppyBirthDate, activity: 3 }),
    );
    mockRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockRepository.findFoodClinicProducts.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    // Adulte = 180g, chiot devrait être ~2x plus (facteur 2 vs 1)
    expect(result[0].dailyGrams).toBe(360);
  });

  it("applique un facteur x0.9 pour un senior (≥ 7 ans)", async () => {
    const seniorBirthDate = new Date();
    seniorBirthDate.setFullYear(seniorBirthDate.getFullYear() - 8);
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(
      makeAnimal({ dateOfBirth: seniorBirthDate, activity: 3 }),
    );
    mockRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockRepository.findFoodClinicProducts.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    // Adulte = 180g, senior = 180 × 0.9 = 162g
    expect(result[0].dailyGrams).toBe(162);
  });

  it("utilise le facteur d'activité par défaut (3) si activity est null", async () => {
    mockRepository.findAnimalOwnedByClient.mockResolvedValue(
      makeAnimal({ activity: null }),
    );
    mockRepository.findLatestWeight.mockResolvedValue({ petWeight: 10 });
    mockRepository.findFoodClinicProducts.mockResolvedValue([
      { id: "cp-1", product: { Food: { caloriesPer100: 350, foodHealthConditions: [] } } },
    ]);

    const result = await service.getFoodRecommendations("client-1", "animal-1");
    expect(result[0].dailyGrams).toBe(180); // même résultat qu'activity=3
  });
});