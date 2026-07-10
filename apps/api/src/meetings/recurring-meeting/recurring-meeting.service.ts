import { NotFoundError } from "@api/errors";
import {
  RecurringRepository,
  RecurringWithRelations,
} from "./recurring-meeting.repository";
import { InternalMeetingRepository } from "../internal-meeting";
import { AvailabilityRepository } from "../availabilities/availability.repository";
import {
  MeetingRecurringId,
  UpdateRecurring,
  ClinicId,
  UserId,
} from "@armali/schemas";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export class RecurringService {
  constructor(
    private repository: RecurringRepository,
    private internalMeetingRepository: InternalMeetingRepository,
    private availabilityRepository: AvailabilityRepository,
  ) {}

  async getById(id: MeetingRecurringId) {
    const recurring = await this.repository.findById(id);
    if (!recurring) throw new NotFoundError("Récurrence introuvable");
    return recurring;
  }

  async update({
    id,
    data,
  }: {
    id: MeetingRecurringId;
    data: UpdateRecurring;
  }) {
    const current = await this.getById(id);

    const splitDate = dayjs.utc(data.dateToStartAction).startOf("day").toDate();
    if (current.dateStart >= splitDate) {
      if (current.internalMeeting && data.internal) {
        await this.internalMeetingRepository.update({
          id: current.internalMeeting.id,
          data: data.internal,
        });
      }
      const { dateToStartAction: _, ...d } = data;
      return this.repository.update(id, d);
    }

    return this.repository.splitFromDate(current, data, splitDate);
  }

  /**
   * Matérialise une occurrence virtuelle d'une récurrence en un MeetingBase
   * concret, et pose une exception sur la série pour empêcher RRule de
   * régénérer l'occurrence par défaut à cette date. Générique sur le kind
   * (INTERNAL ou AVAILABILITY) — le sous-objet imbriqué correct est
   * construit selon `recurring.kind`.
   */
  async materializeOccurrence({
    recurring,
    date,
  }: {
    recurring: RecurringWithRelations;
    date: Date;
  }) {
    await this.repository.createException({
      parentId: recurring.id as MeetingRecurringId,
      date,
      startTime: recurring.startTime,
      endTime: recurring.endTime,
      kind: recurring.kind,
    });

    if (recurring.kind === "INTERNAL" && recurring.internalMeeting) {
      return this.internalMeetingRepository.createPunctual({
        data: {
          title: recurring.internalMeeting.title,
          description: recurring.internalMeeting.description,
          date,
          startTime: recurring.startTime,
          endTime: recurring.endTime,
          clinicId: recurring.internalMeeting.clinicId as ClinicId,
          userIds: recurring.internalMeeting.participants.map(
            (p) => p.userId as UserId,
          ),
        },
        authorId: recurring.internalMeeting.adminId as UserId,
        clinicId: recurring.internalMeeting.clinicId as ClinicId,
        parentId: recurring.id as MeetingRecurringId,
      });
    }

    if (recurring.kind === "AVAILABILITY" && recurring.availabilty) {
      return this.availabilityRepository.createPunctual({
        data: {
          date,
          startTime: recurring.startTime,
          endTime: recurring.endTime,
        },
        authorId: recurring.availabilty.userId as UserId,
        clinicId: recurring.availabilty.clinicId,
      });
      // ⚠️ Note : createPunctual ne prend pas de parentId actuellement.
      // Il faut soit l'ajouter à AvailabilityRepository.createPunctual,
      // soit utiliser createExeption avec parentId — voir remarque ci-dessous.
    }

    throw new NotFoundError("Entité liée à la récurrence introuvable");
  }
}
