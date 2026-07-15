import { NotFoundError, ForbiddenError } from "@api/errors";
import { AnimalRepository } from "@api/animals/animal.repository";
import { AnimalMeetingRepository } from "@api/meetings/animal-meeting/animal-meeting.repository";
import { ProductClinicRepository } from "@api/products/product-clinic.repository";
import { AnimalHealthConditionRepository } from "@api/health-conditions/health-condition.repository";

// ── Calcul du grammage journalier ────────────────────────────────────────────
const ACTIVITY_FACTORS: Record<number, number> = {
  1: 1.2,
  2: 1.4,
  3: 1.6,
  4: 1.8,
  5: 2.0,
};

function computeDailyGrams({
  weightKg,
  activity,
  ageYears,
  caloriesPer100,
}: {
  weightKg: number;
  activity: number | null;
  ageYears: number;
  caloriesPer100: number | null;
}): number | null {
  if (!caloriesPer100 || caloriesPer100 <= 0) return null;

  const rer = 70 * Math.pow(weightKg, 0.75);
  const activityFactor = ACTIVITY_FACTORS[activity ?? 3] ?? 1.6;
  const ageFactor = ageYears < 1 ? 2 : ageYears >= 7 ? 0.9 : 1;
  const mer = rer * activityFactor * ageFactor;

  return Math.round((mer / caloriesPer100) * 100);
}

function ageInYears(dateOfBirth: Date): number {
  const diffMs = Date.now() - dateOfBirth.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

export class ClientShopService {
  constructor(
    private animalRepository: AnimalRepository,
    private animalMeetingRepository: AnimalMeetingRepository,
    private productClinicRepository: ProductClinicRepository,
    private animalHealthConditionRepository: AnimalHealthConditionRepository,
  ) {}

  async getProducts(clientUserId: string) {
    const clinicIds =
      await this.animalRepository.findClinicIdsForClient(clientUserId);
    if (clinicIds.length === 0) return [];
    return this.productClinicRepository.findByClinics(clinicIds);
  }

  async getProductById(clientUserId: string, clinicProductId: string) {
    const clinicIds =
      await this.animalRepository.findClinicIdsForClient(clientUserId);

    const clinicProduct =
      await this.productClinicRepository.findByIdWithClinic(clinicProductId);

    if (!clinicProduct) throw new NotFoundError("Produit");
    if (!clinicIds.includes(clinicProduct.clinicId)) {
      throw new ForbiddenError();
    }
    return clinicProduct;
  }

  // ── Animaux du client (pour le sélecteur/filtre côté boutique) ────────────

  async getAnimals(clientUserId: string) {
    return this.animalRepository.findNamesByClientId(clientUserId);
  }

  // ── Recommandations alimentaires + grammage pour un animal donné ─────────

  async getFoodRecommendations(clientUserId: string, animalId: string) {
    const animal = await this.animalRepository.findOwnershipInfo(animalId);
    if (!animal) throw new NotFoundError("Animal");
    if (animal.clientId !== clientUserId) throw new ForbiddenError();

    const [latestWeightMeeting, animalConditions, clinicIds] =
      await Promise.all([
        this.animalMeetingRepository.findLatestWeight(animalId),
        this.animalHealthConditionRepository.findByAnimal(animalId),
        this.animalRepository.findClinicIdsForClient(clientUserId),
      ]);

    if (clinicIds.length === 0) return [];

    const conditionIds = new Set(
      animalConditions.map((c) => c.healthConditionId),
    );
    const conditionNames = new Map(
      animalConditions.map((c) => [
        c.healthConditionId,
        c.healthCondition.name,
      ]),
    );

    const foodClinicProducts =
      await this.productClinicRepository.findFoodProductsByClinics(clinicIds);

    const weightKg = latestWeightMeeting?.petWeight
      ? Number(latestWeightMeeting.petWeight)
      : null;
    const ageYears = ageInYears(animal.dateOfBirth);

    return foodClinicProducts.map((cp) => {
      const food = cp.product.Food;
      const matched = (food?.foodHealthConditions ?? []).filter((fhc) =>
        conditionIds.has(fhc.healthConditionId),
      );

      const hasAvoid = matched.some((m) => m.recommendation === "AVOID");
      const hasRecommended = matched.some(
        (m) => m.recommendation === "RECOMMENDED",
      );
      const recommendation = hasAvoid
        ? "AVOID"
        : hasRecommended
          ? "RECOMMENDED"
          : null;

      const dailyGrams =
        weightKg && food
          ? computeDailyGrams({
              weightKg,
              activity: animal.activity,
              ageYears,
              caloriesPer100: food.caloriesPer100
                ? Number(food.caloriesPer100)
                : null,
            })
          : null;

      return {
        clinicProductId: cp.id,
        recommendation,
        matchedConditions: matched.map(
          (m) => conditionNames.get(m.healthConditionId) ?? "",
        ),
        dailyGrams,
      };
    });
  }
}
