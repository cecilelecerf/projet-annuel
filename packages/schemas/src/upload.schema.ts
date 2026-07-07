import { z } from "zod";
import { fileIdSchema } from "./ids";

// Types MIME acceptés pour une image (avatar / photo animal / image marque)
const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

// --- Requête d'initiation d'upload (POST /.../avatar, /.../photo, etc.) ---
export const initiateImageUploadSchema = z.object({
  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_IMAGE_SIZE_BYTES, "Le fichier ne doit pas dépasser 5 Mo")
    .optional(),
});
export type InitiateImageUploadInput = z.infer<
  typeof initiateImageUploadSchema
>;

// --- Réponse renvoyée par le backend après création du presigned URL ---
export const uploadResponseSchema = z.object({
  fileId: fileIdSchema,
  uploadUrl: z.url(),
});
export type UploadResponse = z.infer<typeof uploadResponseSchema>;

// --- Requête de confirmation (PATCH /.../avatar/confirm, etc.) ---
export const confirmUploadSchema = z.object({
  fileId: fileIdSchema,
});
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
