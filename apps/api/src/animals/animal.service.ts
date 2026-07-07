import { ForbiddenError, NotFoundError } from "@api/errors";
import { AnimalRepository } from "./animal.repository";
import type {
  CreateAnimal,
  UpdateAnimal,
  UserId,
  UserRole,
} from "@armali/schemas";
import { isStaff } from "@api/utils";
import dayjs from "dayjs";
import { VaccineRepository } from "@api/vaccines/vaccine.repository";
import { withUserAvatar } from "@api/users/user.utils";

export class AnimalService {
  constructor(
    private repository: AnimalRepository,
    private vaccineRepository: VaccineRepository,
  ) {}

  private async assertOwner({
    petId,
    userId,
  }: {
    petId: string;
    userId: string;
  }) {
    const pet = await this.repository.findById(petId);
    if (!pet) throw new NotFoundError("Animal");
    if (pet.clientId !== userId) throw new ForbiddenError();
  }
  private async assertAccess({
    petId,
    userId,
    role,
  }: {
    petId: string;
    userId: string;
    role: UserRole;
  }) {
    if (isStaff(role)) return;

    await this.assertOwner({ petId, userId });
    return;
  }

  async getAll({ userId, role }: { userId: string; role: UserRole }) {
    if (isStaff(role)) return this.repository.findAll();
    return this.repository.findByClientId(userId);
  }
  async getByUser({
    targetUserId,
    requesterId,
    role,
  }: {
    targetUserId: string;
    requesterId: string;
    role: UserRole;
  }) {
    if (!isStaff(role) && targetUserId !== requesterId)
      throw new ForbiddenError();
    return this.repository.findByClientId(targetUserId);
  }

  async getById({
    id,
    userId,
    role,
  }: {
    id: string;
    userId: string;
    role: UserRole;
  }) {
    const pet = await this.repository.findById(id);
    if (!pet) throw new NotFoundError("Animal");
    if (!isStaff(role) && pet.clientId !== userId) throw new ForbiddenError();
    return { ...pet, client: withUserAvatar(pet.client) };
  }

  async create({
    data,
    userId,
    role,
  }: {
    data: CreateAnimal;
    userId: UserId;
    role: UserRole;
  }) {
    const clientId: UserId = isStaff(role) ? (data.clientId ?? userId) : userId;

    return this.repository.create({ ...data, clientId });
  }

  async update({
    id,
    data,
    userId,
    role,
  }: {
    id: string;
    data: UpdateAnimal;
    userId: string;
    role: UserRole;
  }) {
    await this.assertAccess({ petId: id, userId, role });
    const pet = await this.repository.findById(id);
    if (!pet) throw new NotFoundError("animal");
    return this.repository.update(pet.id, data);
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    await this.assertOwner({ petId: id, userId });
    return this.repository.delete(id);
  }

  async getVaccinesByAnimal(animalId: string) {
    const animal = await this.repository.findById(animalId);
    if (!animal) throw new NotFoundError("Animal");

    const country = animal.client.country ?? "FR";
    const animalAgeInWeeks = dayjs().diff(dayjs(animal.dateOfBirth), "week"); // ← manquant

    const [vaccinesEffectued, allVaccines] = await Promise.all([
      this.repository.findVaccinesByAnimal(animalId),
      this.vaccineRepository.findByPetId(animal.race.petId),
    ]);

    const effectuedMap = new Map(
      vaccinesEffectued.map((v) => [v.vaccineId, v]),
    );

    return allVaccines.map((vaccine) => {
      const done = effectuedMap.get(vaccine.id);

      if (done) {
        const nextDue = dayjs(done.medicalHistory?.performedAt).add(
          vaccine.boosterInterval,
          "week",
        );
        const isUpToDate = nextDue.isAfter(dayjs());
        return {
          ...done,
          status: isUpToDate ? "UP_TO_DATE" : "OVERDUE",
          nextDue: nextDue.toDate(),
          isUpToDate,
          daysUntilDue: nextDue.diff(dayjs(), "day"),
        };
      }

      const rule = vaccine.countryRules.find((r) => r.country === country);
      const isMandatory =
        rule?.type === "MANDATORY" && animalAgeInWeeks >= rule.minAge;
      const isRecommended =
        rule?.type === "RECOMMENDED" && animalAgeInWeeks >= rule.minAge;

      return {
        id: null,
        vaccineId: vaccine.id,
        animalId,
        vaccine,
        medicalHistory: null,
        vaccinatedAt: null,
        nextDue: null,
        isUpToDate: false,
        daysUntilDue: null,
        status: isMandatory
          ? "MANDATORY_MISSING"
          : isRecommended
            ? "RECOMMENDED_MISSING"
            : "NOT_APPLICABLE",
      };
    });
  }
}
