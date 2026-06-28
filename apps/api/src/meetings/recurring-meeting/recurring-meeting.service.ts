import { NotFoundError } from "@api/errors";
import { RecurringRepository } from "./recurring-meeting.repository";
import { UpdateRecurring } from "@armali/schemas";

export class RecurringService {
  constructor(private repository: RecurringRepository) {}

  async getById(id: string) {
    const recurring = await this.repository.findById(id);
    if (!recurring) throw new NotFoundError("Récurrence introuvable");
    return recurring;
  }

  async update(id: string, data: UpdateRecurring) {
    const current = await this.getById(id);

    const splitDate = new Date(
      new Date().toISOString().split("T")[0] + "T00:00:00.000Z",
    );

    if (current.dateStart >= splitDate) {
      return this.repository.update(id, data);
    }

    return this.repository.splitFromDate(current, data, splitDate);
  }
}
