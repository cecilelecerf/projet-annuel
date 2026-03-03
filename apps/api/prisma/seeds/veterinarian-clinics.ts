import type { PrismaClient, Clinic, User } from "../generated/prisma/client";

export async function seedVeterinarianClinics(
  prisma: PrismaClient,
  { users, clinic1, clinic2 }: { users: any; clinic1: Clinic; clinic2: Clinic },
) {
  const { vetProfile1, vetProfile2, vetProfile3 } = users;
  const vetoClinic1 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile1.id, clinicId: clinic1.id },
  });
  const vetoClinic2 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile1.id, clinicId: clinic2.id },
  });
  const vetoClinic3 = await prisma.veterinarianClinic.create({
    data: { veterinarianId: vetProfile3.id, clinicId: clinic1.id },
  });

  return { vetoClinic1, vetoClinic2, vetoClinic3 };
}
