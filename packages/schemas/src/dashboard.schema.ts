import { z } from 'zod'
import { userIdSchema } from './ids'

// ── Blocs communs à REFERENT et DIRECTOR ────────────────────────────────────

const clinicInfoSchema = z.object({
  name: z.string(),
  veterinarianCount: z.number().int().nonnegative(),
  secretaryCount: z.number().int().nonnegative(),
})

const reviewStatSchema = z.object({
  average: z.number().nullable(),
  count: z.number().int().nonnegative(),
})

const veterinarianReviewSchema = z.object({
  veterinarian: z.object({
    id: userIdSchema,
    firstname: z.string(),
    lastname: z.string(),
    picture: z.url().nullable().optional(),
  }),
  stat: reviewStatSchema,
})

const salesStatsSchema = z.object({
  totalRevenue: z.number().nonnegative(),
  totalOrdersCount: z.number().int().nonnegative(),
  recentOrdersCount: z.number().int().nonnegative(),
  lowStockCount: z.number().int().nonnegative(),
})

const clinicManagementDashboardSchema = z.object({
  clinic: clinicInfoSchema,
  reviews: reviewStatSchema.extend({
    veterinarians: z.array(veterinarianReviewSchema),
  }),
  sales: salesStatsSchema,
})

export const referentDashboardSchema = clinicManagementDashboardSchema.extend({
  role: z.literal('REFERENT'),
})

export const directorDashboardSchema = clinicManagementDashboardSchema.extend({
  role: z.literal('DIRECTOR'),
})

// ── Secrétaire : commandes à préparer/récupérer + RDV du jour de la clinique ──

export const secretaryDashboardSchema = z.object({
  role: z.literal('SECRETARY'),
  ordersToPrepareCount: z.number().int().nonnegative(),
  ordersReadyForPickupCount: z.number().int().nonnegative(),
  todaysMeetingsCount: z.number().int().nonnegative(),
})

// ── Vétérinaire : RDV à venir + sa propre note ──────────────────────────────

const upcomingMeetingSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  animalName: z.string(),
  clientName: z.string(),
})

const recentReviewSchema = z.object({
  rating: z.number(),
  comment: z.string().nullable(),
  clientName: z.string(),
  date: z.string(),
})

export const veterinarianDashboardSchema = z.object({
  role: z.literal('VETERINARIAN'),
  todaysMeetingsCount: z.number().int().nonnegative(),
  upcomingMeetingsCount: z.number().int().nonnegative(),
  upcomingMeetings: z.array(upcomingMeetingSchema),
  rating: reviewStatSchema,
  recentReviews: z.array(recentReviewSchema),
  patientsCount: z.number().int().nonnegative(),
})

// ── Super admin : vue plateforme globale ────────────────────────────────────

export const adminDashboardSchema = z.object({
  role: z.literal('ADMIN'),
  clinicsCount: z.number().int().nonnegative(),
  usersCount: z.number().int().nonnegative(),
  pendingClinicRequestsCount: z.number().int().nonnegative(),
  pendingProductRequestsCount: z.number().int().nonnegative(),
})

export const dashboardSchema = z.discriminatedUnion('role', [
  referentDashboardSchema,
  directorDashboardSchema,
  secretaryDashboardSchema,
  veterinarianDashboardSchema,
  adminDashboardSchema,
])

export type ReferentDashboard = z.infer<typeof referentDashboardSchema>
export type DirectorDashboard = z.infer<typeof directorDashboardSchema>
export type SecretaryDashboard = z.infer<typeof secretaryDashboardSchema>
export type VeterinarianDashboard = z.infer<typeof veterinarianDashboardSchema>
export type AdminDashboard = z.infer<typeof adminDashboardSchema>
export type Dashboard = z.infer<typeof dashboardSchema>