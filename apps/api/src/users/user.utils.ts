import type { Clinic } from "../../prisma/generated/prisma/client";
import type { UserWithProfileAndClinicId } from "./user.types";

export const flatClinicId = (user: UserWithProfileAndClinicId) => {
  const {
    secretaryProfile,
    directorClinicProfile,
    referentClinicProfile,
    veterinarianProfile,
    clientProfile: _,
    ...rest
  } = user;

  let clinicIds: Clinic["id"][] | null = null;
  switch (user.role) {
    case "SECRETARY":
      clinicIds = secretaryProfile?.clinicId
        ? [secretaryProfile?.clinicId]
        : null;
      break;
    case "DIRECTOR":
      clinicIds = directorClinicProfile?.clinic?.id
        ? [directorClinicProfile?.clinic.id]
        : null;
      break;
    case "REFERENT":
      clinicIds = referentClinicProfile?.clinicId
        ? [referentClinicProfile?.clinicId]
        : null;
      break;
    case "VETERINARIAN":
      clinicIds =
        veterinarianProfile?.veterinarianClinics.map(
          (veterinarianClinic) => veterinarianClinic.clinicId,
        ) ?? null;
      break;
  }

  return { ...rest, clinicIds: [clinicIds] };
};

export const flatUser = <T extends { user: Record<string, unknown> }>(
  profile: T,
) => {
  const { user, ...rest } = profile;
  console.log({ ...user, ...rest });
  return { ...user, ...rest };
};

export const flatUsers = <T extends { user: Record<string, unknown> }>(
  profiles: T[],
) => profiles.map(flatUser);
