import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/errors";
import type {
  CreateAnimalMeeting,
  AnimalId,
  UpdateAnimalMeeting,
} from "@armali/schemas";
import { AnimalMeetingRepository } from "./animal-meeting.repository";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { prisma } from "@api/lib/prisma";
import { flatUser, withAvatarUrl, withUserAvatar } from "@api/users/user.utils";
import { calculateAge, isStaff } from "@api/utils";
import { EmailService } from "@api/emails/email.service";
import dayjs from "dayjs";
import { UserRepository } from "@api/users/user.repository";

// ── Combine une date (jour) avec une heure (time) en un seul instant ──────────
function combineDateTime(date: Date, time: Date) {
  return dayjs(date)
    .hour(dayjs(time).hour())
    .minute(dayjs(time).minute())
    .second(0)
    .millisecond(0);
}

export class AnimalMeetingService {
  constructor(
    private repository: AnimalMeetingRepository,
    private userRepository: UserRepository,
    private emailService: EmailService,
  ) {}

  // ── Helper partagé create/update ─────────────────────────────────────────────
  private async assertVeterinarianAvailable({
    veterinarianId,
    date,
    startTime,
    endTime,
    excludeMeetingId,
  }: {
    veterinarianId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    excludeMeetingId?: string;
  }) {
    const timeOverlapFilter = {
      OR: [
        { startTime: { lte: startTime }, endTime: { gt: startTime } },
        { startTime: { lt: endTime }, endTime: { gte: endTime } },
        { startTime: { gte: startTime }, endTime: { lte: endTime } },
      ],
    };

    const meetingConflict = await prisma.meetingBase.findFirst({
      where: {
        date,
        ...(excludeMeetingId && { id: { not: excludeMeetingId } }),
        animalMeeting: { veterinarianClinic: { veterinarianId } },
        ...timeOverlapFilter,
      },
    });
    if (meetingConflict) {
      throw new ConflictError(
        "Le vétérinaire a déjà un rendez-vous sur ce créneau",
      );
    }

    const availability = await prisma.meetingBase.findFirst({
      where: {
        date,
        kind: "AVAILABILITY",
        availabilty: { user: { veterinarianProfile: { id: veterinarianId } } },
        startTime: { lte: startTime },
        endTime: { gte: endTime },
      },
    });
    const recurringAvailability =
      availability ??
      (await prisma.meetingReccuring.findFirst({
        where: {
          kind: "AVAILABILITY",
          dateStart: { lte: date },
          dateEnd: { gte: date },
          // startTime: { lte: startTime },
          // endTime: { gte: endTime },
          // availabilty: {
          //   user: { veterinarianProfile: { user: { id: veterinarianId } } },
          // },
        },
      }));
    if (!recurringAvailability) {
      throw new ConflictError(
        "Le vétérinaire n'est pas disponible sur ce créneau",
      );
    }
  }
  private hasScheduleChanged(
    current: { date: Date; startTime: Date; endTime: Date },
    data: UpdateAnimalMeeting,
  ): boolean {
    const newDate = data.date ?? current.date;
    const newStart = data.startTime ?? current.startTime;
    const newEnd = data.endTime ?? current.endTime;

    return (
      !dayjs(newDate).isSame(current.date, "day") ||
      !dayjs(newStart).isSame(current.startTime, "minute") ||
      !dayjs(newEnd).isSame(current.endTime, "minute")
    );
  }

  // ── Vérifie que le créneau (date + startTime) est dans le futur ─────────────
  private assertIsFuture(date: Date, startTime: Date, message: string) {
    const meetingDateTime = combineDateTime(date, startTime);
    if (meetingDateTime.isBefore(dayjs())) {
      throw new BadRequestError(message);
    }
  }

  // ── Vérifie la règle des 48h pour les clients ────────────────────────────────
  private assertNotWithin48Hours(date: Date, startTime: Date, message: string) {
    const meetingDateTime = combineDateTime(date, startTime);
    const hoursUntilMeeting = meetingDateTime.diff(dayjs(), "hour", true);
    if (hoursUntilMeeting < 48) {
      throw new ForbiddenError(message);
    }
  }

  async create({ data }: { data: CreateAnimalMeeting }) {
    this.assertIsFuture(
      data.date,
      data.startTime,
      "Impossible de créer un rendez-vous dans le passé",
    );

    const veterinarianClinic = await prisma.veterinarianClinic.findFirst({
      where: { clinicId: data.clinicId, veterinarianId: data.veterinarianId },
    });
    if (!veterinarianClinic) throw new NotFoundError("veterinarianClinic");

    const animal = await prisma.animal.findUnique({
      where: { id: data.animalId },
      include: { client: { include: { user: true } } },
    });
    if (!animal) throw new ForbiddenError("L'animal ne vous appartient pas");

    await this.assertVeterinarianAvailable({
      veterinarianId: data.veterinarianId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    const animalMeeting = await this.repository.create({
      data,
      veterinarianClinicId: veterinarianClinic.id,
    });
    if (!animalMeeting) throw new ConflictError("not created");

    await this.emailService.sendAppointmentEmail(
      "created",
      animal.client.user.email,
      {
        firstname: animal.client.user.firstname,
        animalName: animal.name,
        date: data.date,
        startTime: data.startTime,
      },
    );
    return animalMeeting;
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
    const meeting = await this.repository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");

    if (!isStaff(role)) {
      const isOwner = meeting.animal.client.id === userId;
      if (!isOwner) throw new ForbiddenError();
    }

    const user = flatUser(meeting.animal.client);
    return {
      ...meeting,

      veterinarianClinic: meeting.veterinarianClinic
        ? {
            ...meeting.veterinarianClinic,
            veterinarian: withUserAvatar(
              meeting.veterinarianClinic.veterinarian,
            ),
          }
        : null,
      animal: {
        ...meeting.animal,
        client: user,
        age: calculateAge(meeting.animal.dateOfBirth),
      },
    };
  }

  async update({
    id,
    data,
    userId,
    role,
  }: {
    id: string;
    data: UpdateAnimalMeeting;
    userId: string;
    role: UserRole;
  }) {
    const meeting = await this.repository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");

    // ── Vérification d'accès : client propriétaire ou staff ──────────────────
    const isOwner = meeting.animal.client.id === userId;
    if (!isStaff(role) && !isOwner) throw new ForbiddenError();
    const currentDate = meeting.meeting!.date;
    const currentStartTime = meeting.meeting!.startTime;
    const currentEndTime = meeting.meeting!.endTime;

    const isRescheduling = this.hasScheduleChanged(
      {
        date: currentDate,
        startTime: currentStartTime,
        endTime: currentEndTime,
      },
      data,
    );
    if (isRescheduling) {
      const currentDate = meeting.meeting!.date;
      const currentStartTime = meeting.meeting!.startTime;

      // ── Règle des 48h pour les clients, basée sur le créneau actuel ──────────
      if (!isStaff(role)) {
        this.assertNotWithin48Hours(
          currentDate,
          currentStartTime,
          "Modification impossible moins de 48h avant le rendez-vous",
        );
      }

      const newDate = data.date ?? currentDate;
      const newStart = data.startTime ?? currentStartTime;
      const newEnd = data.endTime ?? meeting.meeting!.endTime;

      // ── Le nouveau créneau doit lui aussi être dans le futur ─────────────────
      this.assertIsFuture(
        newDate,
        newStart,
        "Impossible de déplacer le rendez-vous dans le passé",
      );

      // ── Vérifie la dispo du véto sur le nouveau créneau ─────────────────────
      if (meeting.veterinarianClinic?.veterinarianId)
        await this.assertVeterinarianAvailable({
          veterinarianId: meeting.veterinarianClinic?.veterinarianId,
          date: newDate,
          startTime: newStart,
          endTime: newEnd,
          excludeMeetingId: id,
        });
    }

    const updated = await this.repository.update({
      id: meeting.id,
      data,
    });

    // ── Notification email si changement de créneau ────────────────────────────
    if (isRescheduling) {
      const clientUser = meeting.animal.client.user;
      const type = isOwner ? "updatedConfirmation" : "rescheduled";
      await this.emailService.sendAppointmentEmail(type, clientUser.email, {
        firstname: clientUser.firstname,
        animalName: meeting.animal.name,
        date: updated.meeting!.date,
        startTime: updated.meeting!.startTime,
      });
    }

    return updated;
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
    const meeting = await this.repository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");

    if (!isStaff(role) && meeting.animal.clientId !== userId) {
      throw new ForbiddenError();
    }

    const meetingDate = meeting.meeting!.date;
    const meetingStartTime = meeting.meeting!.startTime;

    this.assertIsFuture(
      meetingDate,
      meetingStartTime,
      "Ce rendez-vous est déjà passé",
    );

    // ── Règle des 48h pour les clients ──────────────────────────────────────────
    if (!isStaff(role)) {
      this.assertNotWithin48Hours(
        meetingDate,
        meetingStartTime,
        "Annulation impossible moins de 48h avant le rendez-vous",
      );
    }

    const deleted = await this.repository.delete(id);

    // ── Notification email ───────────────────────────────────────────────────────
    const clientUser = meeting.animal.client.user;
    await this.emailService.sendAppointmentEmail(
      "cancelled",
      clientUser.email,
      {
        firstname: clientUser.firstname,
        animalName: meeting.animal.name,
        date: meetingDate,
        startTime: meetingStartTime,
      },
    );

    return deleted;
  }

  async getByUser({
    id,
    userId,
    role,
  }: {
    id: string;
    userId: string;
    role: UserRole;
  }) {
    if (!id) throw new BadRequestError("L'id est obligatoire");
    const user = await this.userRepository.getUserById({ id });
    if (!user) throw new NotFoundError("Utilisateur");

    if (!isStaff(role) && id !== userId) throw new ForbiddenError();
    return this.repository.findByClient(id);
  }

  async getByAnimal({
    animalId,
    userId,
    role,
  }: {
    animalId: AnimalId;
    userId: string;
    role: UserRole;
  }) {
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      select: { clientId: true },
    });
    if (!animal) throw new NotFoundError("Animal");

    if (!isStaff(role) && animal.clientId !== userId)
      throw new ForbiddenError();

    return this.repository.findByAnimal(animalId);
  }
}
