import type { Clinic } from "../../prisma/generated/prisma/client";
import type { UserWithProfileAndClinicId } from "./user.types";
import { withFileUrl } from "@api/files/utils";
import { File } from "../../prisma/generated/prisma/client";

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

/**
 * Ajoute `avatarUrl` (URL signée/publique calculée à partir du File Prisma)
 * à un objet qui possède un champ `avatar: File | null`.
 * Ex: withAvatarUrl(user) → { ...user, avatarUrl: "https://..." }
 * Ne retire pas le champ `avatar` d'origine, l'ajoute juste en plus.
 */
export function withAvatarUrl<T extends { avatar: File | null }>(user: T) {
  return withFileUrl(user, "avatar", "avatarUrl");
}

/**
 * "Aplatit" un profil imbriqué du type { user: {...}, ...autresChamps }
 * en un seul objet plat { ...autresChamps, ...user+avatarUrl }.
 * Utile quand le frontend attend un objet unique plutôt qu'un objet
 * profil avec un sous-objet `user` séparé.
 * Ex: flatUser({ id: '1', user: { firstname: 'Léa', avatar: null } })
 *   → { id: '1', firstname: 'Léa', avatarUrl: null }
 */
export const flatUser = <T extends { user: { avatar: File | null } }>(
  profile: T,
) => {
  const { user, ...rest } = profile;
  const withAvatar = withAvatarUrl(user);
  return { ...rest, ...withAvatar };
};

/** Version tableau de flatUser, pour une liste de profils. */
export const flatUsers = <T extends { user: { avatar: File | null } }>(
  profiles: T[],
) => profiles.map(flatUser);

/**
 * Contrairement à flatUser, GARDE la structure imbriquée : le sous-objet
 * `user` reste un sous-objet, mais avec `avatarUrl` ajouté dedans.
 * Utile quand le frontend attend explicitement `profile.user.avatarUrl`
 * plutôt qu'un objet aplati.
 * Ex: withUserAvatar({ id: '1', user: { firstname: 'Léa', avatar: null } })
 *   → { id: '1', user: { firstname: 'Léa', avatar: null, avatarUrl: null } }
 */
export const withUserAvatar = <T extends { user: { avatar: File | null } }>(
  profile: T,
) => {
  const { user, ...rest } = profile;
  return { ...rest, user: withAvatarUrl(user) };
};

/** Version tableau de withUserAvatar, pour une liste de profils. */
export const withUsersAvatar = <T extends { user: { avatar: File | null } }>(
  profiles: T[],
) => profiles.map(withUserAvatar);
