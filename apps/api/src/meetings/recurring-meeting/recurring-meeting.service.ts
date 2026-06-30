import { NotFoundError } from "@api/errors";
import { RecurringRepository } from "./recurring-meeting.repository";
import { UpdateRecurring } from "@armali/schemas";
import { InternalMeetingRepository } from "../internal-meeting";
import dayjs from "dayjs";

export class RecurringService {
  constructor(
    private repository: RecurringRepository,
    private internalMeetingRepository: InternalMeetingRepository,
  ) {}

  async getById(id: string) {
    const recurring = await this.repository.findById(id);
    if (!recurring) throw new NotFoundError("Récurrence introuvable");
    return recurring;
  }

  async update(id: string, data: UpdateRecurring) {
    // todo si dans le passé pas de modification avant la date actuelle
    const current = await this.getById(id);

    const splitDate = dayjs(data.dateToStartAction).startOf("day").toDate();
    if (current.dateStart >= splitDate) {
      if (current.internalMeeting && data.internal) {
        await this.internalMeetingRepository.update({
          id: current.internalMeeting.id,
          data: data.internal,
        });
      }
      return this.repository.update(id, data);
    }

    return this.repository.splitFromDate(current, data, splitDate);
  }
}
