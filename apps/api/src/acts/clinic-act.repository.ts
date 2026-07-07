import type { CreateClinicAct, UpdateClinicAct } from "@armali/schemas";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export class ClinicActRepository {
  constructor(private prisma: PrismaClient) {}

  async findByClinic(clinicId: string) {
    return this.prisma.clinicAct.findMany({
      where: { clinicId },
      include: { act: true },
      orderBy: { act: { name: "asc" } },
    });
  }

  async findById(id: string) {
    return this.prisma.clinicAct.findUnique({
      where: { id },
      include: { act: true },
    });
  }

  async create(data: CreateClinicAct) {
    return this.prisma.clinicAct.create({
      data: {
        price: data.price,
        actId: data.actId,
        clinicId: data.clinicId,
      },
      include: { act: true },
    });
  }

  async update(id: string, data: UpdateClinicAct) {
    return this.prisma.clinicAct.update({
      where: { id },
      data: { price: data.price },
      include: { act: true },
    });
  }

  async delete(id: string) {
    return this.prisma.clinicAct.delete({ where: { id } });
  }
}
