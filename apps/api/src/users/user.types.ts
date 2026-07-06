import { Prisma } from "../../prisma/generated/prisma/client";

export const userWithProfileAndClinicIdInclude = {
  veterinarianProfile: {
    include: {
      veterinarianClinics: { select: { clinicId: true } },
    },
  },
  clientProfile: true,
  secretaryProfile: { select: { id: true, clinicId: true } },
  directorClinicProfile: { select: { id: true, clinicId: true } },
  referentClinicProfile: { select: { id: true, clinicId: true } },
} satisfies Prisma.UserInclude;

export type UserWithProfileAndClinicId = Prisma.UserGetPayload<{
  include: typeof userWithProfileAndClinicIdInclude;
  omit: { password: true };
}>;

export type FlatUserWithClinicId = Omit<
  UserWithProfileAndClinicId,
  | "secretaryProfile"
  | "directorClinicProfile"
  | "referentClinicProfile"
  | "veterinarianProfile"
  | "clientProfile"
> & { clinicId: string | null };
