import { z } from "zod";
import { veterinarianIdSchema } from "../ids";

export const veterinarianStatSchema = z.object({
  id: veterinarianIdSchema,
  firstname: z.string(),
  lastname: z.string(),
  averageRating: z.number().nullable(),
  reviewCount: z.number().int().nonnegative(),
});

export const referentDashboardSchema = z.object({
  clinic: z.object({
    name: z.string(),
    veterinarianCount: z.number().int().nonnegative(),
    secretaryCount: z.number().int().nonnegative(),
  }),
  reviews: z.object({
    clinicAverageRating: z.number().nullable(),
    totalReviews: z.number().int().nonnegative(),
    veterinarianStats: z.array(veterinarianStatSchema),
  }),
  sales: z.object({
    totalRevenue: z.number().nonnegative(),
    totalOrdersCount: z.number().int().nonnegative(),
    recentOrdersCount: z.number().int().nonnegative(),
    lowStockCount: z.number().int().nonnegative(),
  }),
});

export type VeterinarianStat = z.infer<typeof veterinarianStatSchema>;
export type ReferentDashboard = z.infer<typeof referentDashboardSchema>;