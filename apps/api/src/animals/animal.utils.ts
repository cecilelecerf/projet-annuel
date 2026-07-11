import { withFileUrl } from "@api/files/utils";
import type { File } from "../../prisma/generated/prisma/client";

/**
 * Ajoute `photoUrl` (calculée depuis le File Prisma) à un objet qui possède
 * un champ `photo: File | null`. Miroir de `withAvatarUrl` côté users.
 */
export function withPhotoUrl<T extends { photo: File | null }>(animal: T) {
  return withFileUrl(animal, "photo", "photoUrl");
}
