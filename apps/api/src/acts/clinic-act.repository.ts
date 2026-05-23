import { prisma } from "@api/lib/prisma";
import type { CreateClinicAct, UpdateClinicAct } from "@armali/schemas";

export class ClinicActRepository {
  async findByClinic(clinicId: string) {
    return prisma.clinicAct.findMany({
      where: { clinicId },
      include: { act: true },
      orderBy: { act: { name: "asc" } },
    });
  }

  async findById(id: string) {
    return prisma.clinicAct.findUnique({
      where: { id },
      include: { act: true },
    });
  }

  async create(data: CreateClinicAct) {
    return prisma.clinicAct.create({
      data: {
        price: data.price,
        actId: data.actId,
        clinicId: data.clinicId,
      },
      include: { act: true },
    });
  }

  async update(id: string, data: UpdateClinicAct) {
    return prisma.clinicAct.update({
      where: { id },
      data: { price: data.price },
      include: { act: true },
    });
  }

  async delete(id: string) {
    return prisma.clinicAct.delete({ where: { id } });
  }
}
