import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().trim().min(1).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;
