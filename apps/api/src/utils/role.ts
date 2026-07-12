import type { UserRole } from "@armali/schemas";

export const STAFF_ROLES: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERENT",
  "ADMIN",
] as const;

export const CLINIC_STAFF_ROLES: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERENT",
] as const;

export const isStaff = (role: UserRole) => STAFF_ROLES.includes(role);

export const isAdmin = (role: UserRole) => role === "ADMIN";

export const isVeterinarian = (role: UserRole) => role === "VETERINARIAN";
