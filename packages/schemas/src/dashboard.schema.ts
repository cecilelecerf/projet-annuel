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

const orderPreviewSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  items: z.string(),
  total: z.number(),
})

const todaysMeetingSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  animalName: z.string(),
  veterinarianName: z.string(),
})

export const secretaryDashboardSchema = z.object({
  role: z.literal('SECRETARY'),
  ordersToPrepareCount: z.number().int().nonnegative(),
  ordersReadyForPickupCount: z.number().int().nonnegative(),
  ordersToPrepare: z.array(orderPreviewSchema),
  ordersReadyForPickup: z.array(orderPreviewSchema),
  todaysMeetingsCount: z.number().int().nonnegative(),
  todaysMeetings: z.array(todaysMeetingSchema),
  staff: z.object({
    veterinarianCount: z.number().int().nonnegative(),
    secretaryCount: z.number().int().nonnegative(),
  }),
  presentVeterinarians: z.array(
    z.object({
      id: z.string(),
      firstname: z.string(),
      lastname: z.string(),
    }),
  ),
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


const clientUpcomingMeetingSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  animalName: z.string(),
  veterinarianName: z.string().nullable(),
  clinicName: z.string().nullable(),
})

const clientOrderPreviewSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'READY', 'PICKED_UP', 'CANCELLED']),
  items: z.string(),
  total: z.number(),
  createdAt: z.string(),
})

export const clientDashboardSchema = z.object({
  role: z.literal("CLIENT"),
  animals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    species: z.string(),
    breed: z.string(),
    dateOfBirth: z.string(),
    photoUrl: z.string().nullable(),
  })),
  clinics: z.array(z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    image: z.string().nullable(),
  })),
  upcomingMeetingsCount: z.number(),
  upcomingMeetings: z.array(z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    animalName: z.string(),
    veterinarianName: z.string().nullable(),
    clinicName: z.string().nullable(),
  })),
  ordersInProgressCount: z.number(),
  recentOrders: z.array(z.object({
    id: z.string(),
    status: z.enum(["PENDING", "CONFIRMED", "READY", "PICKED_UP", "CANCELLED"]),
    items: z.string(),
    total: z.number(),
    createdAt: z.string(),
  })),
  ordersReadyForPickupCount: z.number(),
  ordersReadyForPickup: z.array(z.object({
    id: z.string(),
    status: z.enum(["PENDING", "CONFIRMED", "READY", "PICKED_UP", "CANCELLED"]),
    items: z.string(),
    total: z.number(),
    createdAt: z.string(),
  })),
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
    picture: z.string().nullable(),
    price: z.number(),
    clinicId: z.string(),
  })),
});

export const dashboardSchema = z.discriminatedUnion('role', [
  referentDashboardSchema,
  directorDashboardSchema,
  secretaryDashboardSchema,
  veterinarianDashboardSchema,
  adminDashboardSchema,
  clientDashboardSchema,
])

export type ReferentDashboard = z.infer<typeof referentDashboardSchema>
export type DirectorDashboard = z.infer<typeof directorDashboardSchema>
export type SecretaryDashboard = z.infer<typeof secretaryDashboardSchema>
export type VeterinarianDashboard = z.infer<typeof veterinarianDashboardSchema>
export type AdminDashboard = z.infer<typeof adminDashboardSchema>
export type ClientDashboard = z.infer<typeof clientDashboardSchema>
export type Dashboard = z.infer<typeof dashboardSchema>