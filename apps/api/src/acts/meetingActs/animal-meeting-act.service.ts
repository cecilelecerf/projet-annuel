import { ForbiddenError, NotFoundError } from "@api/errors";
import { AnimalMeetingActRepository } from "./animal-meeting-act.repository";
import type {
  CreateAnimalMeetingAct,
  UpdateAnimalMeetingAct,
  UserRole,
} from "@armali/schemas";

const ALLOWED_ROLES: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
];

const repository = new AnimalMeetingActRepository();

export class AnimalMeetingActService {
  async getByMeeting(meetingId: string) {
    return repository.findByMeeting(meetingId);
  }

  async getById(id: string) {
    const act = await repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return act;
  }

  async create(data: CreateAnimalMeetingAct, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    return repository.create(data);
  }

  async update(id: string, data: UpdateAnimalMeetingAct, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const act = await repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!ALLOWED_ROLES.includes(role)) throw new ForbiddenError();
    const act = await repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return repository.delete(id);
  }
}
