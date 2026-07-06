import { z } from "zod";
import { userIdSchema } from "../ids";
import {
  bankingInfoInputSchema,
  veterinarianIdentityInputSchema,
} from "../users/veterinarian.schema";
import { specialitySchema } from "../clinic.schema";

const staffRoleSchema = z.enum([
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERENT",
]);

export const staffMemberSchema = z.object({
  id: userIdSchema,
  firstname: z.string(),
  lastname: z.string(),
  email: z.email(),
  role: staffRoleSchema,
  licenseNumber: z.string().optional(),
});

export const staffListSchema = z.object({
  director: staffMemberSchema.nullable(),
  referents: z.array(staffMemberSchema),
  veterinarians: z.array(staffMemberSchema),
  secretaries: z.array(staffMemberSchema),
});

// ── Fiche détail (GET /referent/staff/:id) ─────────────────────────────────

export const veterinarianStaffProfileSchema = z.object({
  licenseNumber: z.string(),
  bio: z.string().nullable().optional(),
  speciality: z.array(specialitySchema),
  veterinarianIdentity: veterinarianIdentityInputSchema.nullable().optional(),
  bankingInfo: bankingInfoInputSchema.nullable().optional(),
});

export const secretaryStaffProfileSchema = z.object({
  bankingInfo: bankingInfoInputSchema.nullable().optional(),
});

export const staffMemberDetailSchema = z.object({
  id: userIdSchema,
  firstname: z.string(),
  lastname: z.string(),
  email: z.email(),
  role: staffRoleSchema,
  createdAt: z.string(),
  veterinarianProfile: veterinarianStaffProfileSchema.nullable().optional(),
  secretaryProfile: secretaryStaffProfileSchema.nullable().optional(),
});

export type StaffRole = z.infer<typeof staffRoleSchema>;
export type StaffMember = z.infer<typeof staffMemberSchema>;
export type StaffList = z.infer<typeof staffListSchema>;
export type VeterinarianStaffProfile = z.infer<
  typeof veterinarianStaffProfileSchema
>;
export type SecretaryStaffProfile = z.infer<typeof secretaryStaffProfileSchema>;
export type StaffMemberDetail = z.infer<typeof staffMemberDetailSchema>;