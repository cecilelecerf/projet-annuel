import { ForbiddenError, NotFoundError } from "@api/errors";
import { AnimalRepository } from "./animal.repository";
import type { CreateAnimal, UpdateAnimal, UserRole } from "@armali/schemas";
import { isStaff } from "@api/utils";
import dayjs from "dayjs";
import { prisma } from "@api/lib/prisma";

const animalRepository = new AnimalRepository();

export class AnimalService {
  private async assertOwner({
    petId,
    userId,
  }: {
    petId: string;
    userId: string;
  }) {
    const pet = await animalRepository.findById(petId);
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
    if (isStaff(role)) return animalRepository.findAll();
    return animalRepository.findByClientId(userId);
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
    return animalRepository.findByClientId(targetUserId);
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
    const pet = await animalRepository.findById(id);
    if (!pet) throw new NotFoundError("Animal");
    if (!isStaff(role) && pet.clientId !== userId) throw new ForbiddenError();
    return pet;
  }

  async create({
    data,
    userId,
    role,
  }: {
    data: CreateAnimal;
    userId: string;
    role: UserRole;
  }) {
    const clientId = isStaff(role)
      ? ((data as any).clientId ?? userId)
      : userId;

    return animalRepository.create({ ...data, clientId });
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
    const pet = await animalRepository.findById(id);
    if (!pet) throw new NotFoundError("animal");
    return animalRepository.update(pet.id, data);
  }

  async delete({
    id,
    userId,
    role,
  }: {
    id: string;
    userId: string;
    role: UserRole;
  }) {
    await this.assertOwner({ petId: id, userId });
    return animalRepository.delete(id);
  }

  async getVaccinesByAnimal(animalId: string) {
    const animal = await animalRepository.findById(animalId);
    if (!animal) throw new NotFoundError("Animal");

    const country = animal.client.country ?? "FR";
    const animalAgeInWeeks = dayjs().diff(dayjs(animal.dateOfBirth), "week"); // ← manquant

    const [vaccinesEffectued, allVaccines] = await Promise.all([
      animalRepository.findVaccinesByAnimal(animalId),
      prisma.vaccine.findMany({
        where: { petId: animal.race.petId },
        include: { act: true, countryRules: true },
      }),
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
