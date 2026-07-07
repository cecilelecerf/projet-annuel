import { NotFoundError, ForbiddenError } from "@api/errors";
import { ActRepository } from "./act.repository";
import type { CreateAct, UpdateAct, UserRole } from "@armali/schemas";

const ADMIN_ROLES: UserRole[] = ["ADMIN"];

export class ActService {
  constructor(private repository: ActRepository) {}

  async getAll() {
    return this.repository.findAll();
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
    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!ADMIN_ROLES.includes(role)) throw new ForbiddenError();
    const act = await this.repository.findById(id);
    if (!act) throw new NotFoundError("Acte");
    return this.repository.delete(id);
  }
}
