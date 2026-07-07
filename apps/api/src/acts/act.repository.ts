import type { CreateAct, UpdateAct } from "@armali/schemas";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export class ActRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.act.findMany({
      include: { clinicActs: true },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return this.prisma.act.findUnique({
      where: { id },
      include: { clinicActs: true },
    });
  }

  async create(data: CreateAct) {
    return this.prisma.act.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        basePrice: data.basePrice,
      },
    });
  }

  async update(id: string, data: UpdateAct) {
    return this.prisma.act.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        basePrice: data.basePrice,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.act.delete({ where: { id } });
  }
}
