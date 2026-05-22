import type { Clinic } from "../../prisma/generated/prisma/client";
import type { UserWithProfileAndClinicId } from "./user.types";

export const flatClinicId = (user: UserWithProfileAndClinicId) => {
  const {
    secretaryProfile,
    directorClinicProfile,
    referentClinicProfile,
    veterinarianProfile,
    clientProfile,
    ...rest
  } = user;

  let clinicId: Clinic["id"] | null = null;
  switch (user.role) {
    case "SECRETARY":
      clinicId = secretaryProfile?.clinicId ?? null;
      break;
    case "DIRECTOR":
      clinicId = directorClinicProfile?.clinicId ?? null;
      break;
    case "REFERANT":
      clinicId = referentClinicProfile?.clinicId ?? null;
      break;
    case "VETERINARIAN":
      clinicId = veterinarianProfile?.veterinarianClinic[0]?.clinicId ?? null;
      break;
  }

  return { ...rest, clinicId };
};

export const flatUser = <T extends { user: Record<string, unknown> }>(
  profile: T,
) => {
  const { user, ...rest } = profile;
  return { ...user, ...rest };
};

export const flatUsers = <T extends { user: Record<string, unknown> }>(
  profiles: T[],
) => profiles.map(flatUser);
