import type {
  ActId,
  ClinicId,
  CreateClinicAct,
  UpdateClinicAct,
} from "@armali/schemas";
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
  async findByKeys(clinicId: ClinicId, actId: ActId) {
    return this.prisma.clinicAct.findUnique({
      where: { actId_clinicId: { clinicId, actId } },
      include: { act: true },
    });
  }
  async findById(id: string) {
    return this.prisma.clinicAct.findUnique({
      where: { id },
      include: { act: true },
    });
  }

  async create(clinicId: ClinicId, data: CreateClinicAct) {
    return this.prisma.clinicAct.create({
      data: {
        price: data.price,
        actId: data.actId,
        clinicId: clinicId,
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
    console.log(id);
    return this.prisma.clinicAct.delete({ where: { id } });
  }
}
