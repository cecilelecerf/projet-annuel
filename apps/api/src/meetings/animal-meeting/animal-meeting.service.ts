import { ConflictError, ForbiddenError, NotFoundError } from "@api/errors";
import type {
  CreateAnimalMeeting,
  OwnedPet,
  OwnedPetId,
  UpdateAnimalMeeting,
} from "@armali/schemas";
import { AnimalMeetingRepository } from "./animal-meeting.repository";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { Clinic } from "../../../prisma/generated/prisma/client";
import { prisma } from "@api/lib/prisma";
import { UserService } from "@api/users";
import { flatUser } from "@api/users/user.utils";
import { calculateAge, isStaff } from "@api/utils";
import { UserRepository } from "@api/users/user.repository";

const animalMeetingRepository = new AnimalMeetingRepository();
const userRepository = new UserRepository();

export class AnimalMeetingService {
  async create({
    data,
    clinicId,
  }: {
    data: CreateAnimalMeeting;
    clinicId: Clinic["id"];
  }) {
    const veterinarianClinic = await prisma.veterinarianClinic.findFirst({
      where: { clinicId, veterinarianId: data.veterinarianId },
    });
    if (!veterinarianClinic) throw new NotFoundError("veterinarianClinic");

    const timeOverlapFilter = {
      OR: [
        { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
        { startTime: { lt: data.endTime }, endTime: { gte: data.endTime } },
        { startTime: { gte: data.startTime }, endTime: { lte: data.endTime } },
      ],
    };
    const meetingConflict = await prisma.meetingBase.findFirst({
      where: {
        date: data.date,
        animalMeeting: {
          veterinarianClinic: { veterinarianId: data.veterinarianId },
        },
        ...timeOverlapFilter,
      },
    });
    if (meetingConflict)
      throw new ConflictError(
        "Le vétérinaire a déjà un rendez-vous sur ce créneau",
      );

    // 2. Vérifie qu'il a une disponibilité qui couvre ce créneau
    const availability = await prisma.meetingBase.findFirst({
      where: {
        date: data.date,
        kind: "AVAILABILITY",
        availabilty: {
          user: { veterinarianProfile: { id: data.veterinarianId } },
        },
        startTime: { lte: data.startTime },
        endTime: { gte: data.endTime },
      },
    });
    // Vérifie aussi dans les récurrents
    const recurringAvailability = availability
      ? availability
      : await prisma.meetingReccuring.findFirst({
          where: {
            kind: "AVAILABILITY",
            dateStart: { lte: data.date },
            dateEnd: { gte: data.date },
            startTime: { lte: data.startTime },
            endTime: { gte: data.endTime },
            availabilty: {
              user: { veterinarianProfile: { id: data.veterinarianId } },
            },
          },
        });
    if (!recurringAvailability)
      throw new ConflictError(
        "Le vétérinaire n'est pas disponible sur ce créneau",
      );

    return animalMeetingRepository.create({
      data,
      veterinarianClinicId: veterinarianClinic.id,
    });
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
    const meeting = await animalMeetingRepository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");

    if (role === "CLIENT") {
      const isOwner = meeting.ownedPet.client.id === userId;
      if (!isOwner) throw new ForbiddenError();
    }
    const user = flatUser(meeting.ownedPet.client);
    return {
      ...meeting,
      ownedPet: {
        ...meeting.ownedPet,
        client: user,
        age: calculateAge(meeting.ownedPet.dateOfBirth),
      },
    };
  }

  async update({
    id,
    data,
    userId,
  }: {
    id: string;
    data: UpdateAnimalMeeting;
    userId: string;
  }) {
    const meeting = await animalMeetingRepository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");

    return animalMeetingRepository.update({ id: meeting.id, data });
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
    const meeting = await animalMeetingRepository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");

    const meetingDate = new Date(meeting.meeting!.date);
    if (meetingDate < new Date()) {
      throw new ForbiddenError();
    }

    if (!isStaff(role) && meeting.ownedPet.clientId !== userId) {
      throw new ForbiddenError();
    }

    return animalMeetingRepository.delete(id);
  }

  async getByClient({
    id,
    userId,
    role,
  }: {
    id: string;
    userId: string;
    role: UserRole;
  }) {
    const user = await userRepository.getUserById({ id });
    if (!user) throw new NotFoundError("Utilisateur");
    if (user.role !== "CLIENT") throw new ForbiddenError();

    if (!isStaff(role) && id !== userId) throw new ForbiddenError();

    return animalMeetingRepository.findByClient(id);
  }

  // TODO : add vérification
  async getByAnimal({
    ownedPetId,
    userId,
    role,
  }: {
    ownedPetId: OwnedPetId;
    userId: string;
    role: UserRole;
  }) {
    return animalMeetingRepository.findByAnimal(ownedPetId);
  }
}
