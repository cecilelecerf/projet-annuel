import z from "zod";

export const getPeriodQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type GetPeriodQuery = z.infer<typeof getPeriodQuerySchema>;
