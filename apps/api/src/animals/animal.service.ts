import { ForbiddenError, NotFoundError } from "@api/errors";
import { AnimalRepository, AnimalWithMeta } from "./animal.repository";
import type {
  AnimalDeletionReason,
  ClinicId,
  CreateAnimal,
  UpdateAnimal,
  UserId,
  UserRole,
} from "@armali/schemas";
import { CLINIC_STAFF_ROLES, isStaff } from "@api/utils";
import dayjs from "dayjs";
import { VaccineRepository } from "@api/vaccines/vaccine.repository";
import { withAvatarUrl, withUserAvatar } from "@api/users/user.utils";
import { withPhotoUrl } from "./animal.utils";
import { ClinicService } from "@api/clinics/clinic.service";
import { PaginationQueryDto } from "../../../../packages/schemas/src/pagination.schema";
import { VeterinarianProfileRepository } from "@api/veterinarians/veterinarian-profile.repository";
import { Animal } from "../../prisma/generated/prisma/client";
import { FileService } from "@api/files/file.service";
import QRCode from "qrcode";

export class AnimalService {
  constructor(
    private repository: AnimalRepository,
    private vaccineRepository: VaccineRepository,
    private clinicService: ClinicService,
    private veterinarianRepository: VeterinarianProfileRepository,
    private fileService: FileService,
  ) {}

  private async formatWithClient(animal: Animal & AnimalWithMeta) {
    return { ...withPhotoUrl(animal), client: withUserAvatar(animal.client) };
  }

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
    const animals = isStaff(role)
      ? await this.repository.findAll()
      : await this.repository.findByClientId(userId);
    return animals.map((a) => withPhotoUrl(a));
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
    const animals = await this.repository.findByClientId(targetUserId);
    return Promise.all(animals.map(this.formatWithClient));
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

    const validVeterinarian = pet.attendingVeterinarianClinic
      ? {
          ...pet.attendingVeterinarianClinic.veterinarian,
          user: withAvatarUrl(
            pet.attendingVeterinarianClinic.veterinarian.user,
          ),
        }
      : null;
    return {
      ...withPhotoUrl(pet),
      attendingVeterinarianClinic: pet.attendingVeterinarianClinic
        ? {
            ...pet.attendingVeterinarianClinic,
            veterinarian: validVeterinarian,
          }
        : null,
      client: withUserAvatar(pet.client),
    };
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

    const created = await this.repository.create({ ...data, clientId });
    return withPhotoUrl(created);
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
    const updated = await this.repository.update(pet.id, data);
    return withPhotoUrl(updated);
  }

  async delete({
    id,
    userId,
    reasons,
  }: {
    id: string;
    userId: string;
    reasons: AnimalDeletionReason[];
  }) {
    await this.assertOwner({ petId: id, userId });

    // Décès : on garde la fiche (historique médical) plutôt que de la supprimer.
    if (reasons.includes("DECEASED")) {
      return this.repository.markDeceased(id);
    }

    return this.repository.delete(id);
  }

  async uploadPhoto({
    animalId,
    userId,
    role,
    mimeType,
  }: {
    animalId: string;
    userId: string;
    role: UserRole;
    mimeType: string;
  }) {
    await this.assertAccess({ petId: animalId, userId, role });
    return this.fileService.createUpload({
      entityType: "ANIMAL",
      entityId: animalId,
      mimeType,
      type: "IMAGE",
    });
  }

  async confirmPhotoUpload({
    animalId,
    userId,
    role,
    fileId,
  }: {
    animalId: string;
    userId: string;
    role: UserRole;
    fileId: string;
  }) {
    await this.assertAccess({ petId: animalId, userId, role });
    const pet = await this.repository.findById(animalId);
    if (!pet) throw new NotFoundError("Animal");

    const confirmedFile = await this.fileService.confirmUpload({
      fileId,
      expectedEntityType: "ANIMAL",
      expectedEntityId: animalId,
    });

    const previousPhotoId = pet.photoId;

    const updated = await this.repository.updatePhoto({
      animalId,
      photoId: confirmedFile.id,
    });

    // Nettoyage de l'ancienne photo, best-effort après le succès du swap
    if (previousPhotoId) {
      await this.fileService.deleteFile(previousPhotoId).catch(() => {});
    }

    return withPhotoUrl(updated);
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

  async getAnimalByVeterinarian(
    veterinarianId: UserId,
    role: UserRole,
    userId: UserId,
    pagination: PaginationQueryDto,
  ) {
    if (!CLINIC_STAFF_ROLES.includes(role)) throw new ForbiddenError();
    const veterinarian =
      await this.veterinarianRepository.findById(veterinarianId);

    const meClinicIds = await this.clinicService.getClinicIdsByUserId({
      userId,
      role,
    });

    if (
      !meClinicIds.some((id) =>
        veterinarian?.veterinarianClinics.some((vc) => vc.clinicId === id),
      )
    )
      throw new ForbiddenError();
    const animals = await this.repository.findPaginatedByAttendingVeterinarian(
      veterinarianId,
      pagination,
    );
    return Promise.all(animals.map((a) => this.formatWithClient(a)));
  }

  async getEmergencyCard(token: string) {
    const animal = await this.repository.findByEmergencyToken(token);
    if (!animal) throw new NotFoundError("Animal");

    const withPhoto = withPhotoUrl(animal);
    return {
      name: animal.name,
      photoUrl: withPhoto.photoUrl,
      species: animal.race.pet.name,
      breed: animal.race.name,
      dateOfBirth: animal.dateOfBirth,
      healthConditions: animal.animalConditionHealths.map((c) => ({
        name: c.healthCondition.name,
        notes: c.notes,
      })),
      owner: {
        name: `${animal.client.user.firstname} ${animal.client.user.lastname}`,
        phone: animal.client.phone,
      },
      clinic: animal.attendingVeterinarianClinic
        ? {
            name: animal.attendingVeterinarianClinic.clinic.name,
            phone: animal.attendingVeterinarianClinic.clinic.phone,
            address: animal.attendingVeterinarianClinic.clinic.address,
          }
        : null,
    };
  }

  // ── QR code de la carte d'urgence (propriétaire uniquement) ──────────────────
  async getEmergencyQr({
    id,
    userId,
    role,
  }: {
    id: string;
    userId: string;
    role: UserRole;
  }) {
    await this.assertAccess({ petId: id, userId, role });
    const pet = await this.repository.findById(id);
    if (!pet) throw new NotFoundError("Animal");

    const base = (process.env.CORS_ORIGIN || "http://localhost:5173").replace(
      /\/$/,
      "",
    );
    const url = `${base}/urgence/${pet.emergencyToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(url);

    return { url, qrCodeDataUrl };
  }

  async getAnimalByClinic(
    role: UserRole,
    userId: UserId,
    clinicId: ClinicId,
    pagination: PaginationQueryDto,
  ) {
    if (!CLINIC_STAFF_ROLES.includes(role)) throw new ForbiddenError();
    const clinicIds = await this.clinicService.getClinicIdsByUserId({
      userId,
      role,
    });
    if (clinicIds.every((id) => id !== clinicId)) throw new ForbiddenError();
    const animals = await this.repository.findPaginatedByAttendingClinic(
      clinicId,
      pagination,
    );
    return Promise.all(animals.map((a) => this.formatWithClient(a)));
  }
}
