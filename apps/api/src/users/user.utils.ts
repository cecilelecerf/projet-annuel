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
  const u = withAvatarUrl(rest);
  return { ...u, clinicIds: [clinicIds] };
};

// user.utils.ts
import type { File } from "../../prisma/generated/prisma/client";
import { withFileUrl } from "@api/files/utils";

// Plus besoin d'un type nommé strict — la contrainte se fait directement en générique
export function withAvatarUrl<T extends { avatar: File | null }>(user: T) {
  return withFileUrl(user, "avatar", "avatarUrl");
}

export const flatUser = <T extends { user: { avatar: File | null } }>(
  profile: T,
) => {
  const { user, ...rest } = profile;
  const withAvatar = withAvatarUrl(user);
  return { ...rest, ...withAvatar };
};

export const flatUsers = <T extends { user: { avatar: File | null } }>(
  profiles: T[],
) => profiles.map(flatUser);

export const withUserAvatar = <T extends { user: { avatar: File | null } }>(
  profile: T,
) => {
  const { user, ...rest } = profile;
  return { ...rest, user: withAvatarUrl(user) };
};

export const withUsersAvatar = <T extends { user: { avatar: File | null } }>(
  profiles: T[],
) => profiles.map(withUserAvatar);
