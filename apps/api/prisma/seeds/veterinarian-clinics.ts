import type { PrismaClient, Clinic, User } from "../generated/prisma/client";

export async function seedVeterinarianClinics(
  prisma: PrismaClient,
  {
    users,
    clinics,
  }: {
    users: ReturnType<typeof import("./users").seedUsers> extends Promise<
      infer T
    >
      ? T
      : never;
    clinics: ReturnType<typeof import("./clinics").seedClinics> extends Promise<
      infer T
    >
      ? T
      : never;
  },
) {
  const { vetProfile1, vetProfile2, vetProfile3 } = users;
  const vetoClinic1 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile1.id, clinicId: clinics.clinic1.id },
  });
  const vetoClinic2 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile1.id, clinicId: clinics.clinic2.id },
  });
  const vetoClinic3 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile3.id, clinicId: clinics.clinic1.id },
  });
  const vetoClinic4 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile3.id, clinicId: clinics.clinic2.id },
  });
  const vetoClinic5 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile1.id, clinicId: clinics.clinic3.id },
  });

  return { vetoClinic1, vetoClinic2, vetoClinic3, vetoClinic4, vetoClinic5 };
}
