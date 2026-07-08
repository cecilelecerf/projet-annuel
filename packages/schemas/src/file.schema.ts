import { z } from "zod";
import { fileIdSchema } from "./ids";

// Enums Prisma → Zod, à garder synchronisés avec prisma/generated/prisma/enums
export const fileTypeSchema = z.enum(["IMAGE", "PDF", "DOCUMENT"]);
export type FileType = z.infer<typeof fileTypeSchema>;

export const fileEntityTypeSchema = z.enum([
  "USER",
  "ANIMAL",
  "PRESCRIPTION",
  "CLINIC",
  "BRAND",
  "PRODUCT",
  "IMAGING",
  "ANALYSIS",
]);
export type FileEntityType = z.infer<typeof fileEntityTypeSchema>;

// Id brandé, même convention que UserId

export const fileSchema = z.object({
  id: fileIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  storageKey: z.string(),
  mimeType: z.string(),
  size: z.number().int().positive().nullable(),
  type: fileTypeSchema,
  entityType: fileEntityTypeSchema,
  entityId: z.uuid(),
});
export type File = z.infer<typeof fileSchema>;

export const fileWithUrlSchema = fileSchema.extend({
  url: z.string(),
});
export type FileWithUrl = z.infer<typeof fileWithUrlSchema>;
