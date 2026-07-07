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
export type UserForAvatar = Omit<PrismaUser, "password"> & {
  avatar: File | null;
};

export const flatUser = <T extends { user: UserForAvatar }>(profile: T) => {
  const { user, ...rest } = profile;
  const withAvatar = withAvatarUrl(user);
  return { ...withAvatar, ...rest };
};

export const flatUsers = <T extends { user: UserForAvatar }>(profiles: T[]) =>
  profiles.map(flatUser);

import type {
  User as PrismaUser,
  File,
} from "../../prisma/generated/prisma/client";
import { withFileUrl } from "@api/files/utils";

export function withAvatarUrl(user: UserForAvatar) {
  return withFileUrl(user, "avatar", "avatarUrl");
}
export const withUserAvatar = <T extends { user: UserForAvatar }>(
  profile: T,
) => {
  const { user, ...rest } = profile;
  return { ...rest, user: withAvatarUrl(user) };
};

export const withUsersAvatar = <T extends { user: UserForAvatar }>(
  profiles: T[],
) => profiles.map(withUserAvatar);
