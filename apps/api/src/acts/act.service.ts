import { NotFoundError, ForbiddenError, BadRequestError } from "@api/errors";
import { ActRepository } from "./act.repository";
import type { ActType, CreateAct, UpdateAct, UserRole } from "@armali/schemas";

const ADMIN_ROLES: UserRole[] = ["ADMIN"];

export class ActService {
  constructor(private repository: ActRepository) {}

  async getAll({ actType }: { actType?: ActType[] }) {
    return this.repository.findAll({ actType });
  }

  async getById(id: string) {
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return act;
  }

  async create(data: CreateAct, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateAct, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    if (act.type === "VACCINATION") {
      throw new BadRequestError(
        "Un acte de vaccination doit être supprimé via la gestion des vaccins, pas le catalogue d'actes",
      );
    }
    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    if (act.type === "VACCINATION") {
      throw new BadRequestError(
        "Un acte de vaccination doit être supprimé via la gestion des vaccins, pas le catalogue d'actes",
      );
    }
    return this.repository.delete(id);
  }
}
