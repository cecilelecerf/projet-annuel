import { http } from '@/lib/api'

export interface StaffMember {
  id: string
  firstname: string
  lastname: string
  email: string
  role: 'VETERINARIAN' | 'SECRETARY' | 'DIRECTOR' | 'REFERENT'
  licenseNumber?: string
}

export interface StaffList {
  director: StaffMember | null
  referents: StaffMember[]
  veterinarians: StaffMember[]
  secretaries: StaffMember[]
}

export interface BankingInfoInput {
  iban?: string
  bic?: string
  domiciliation?: string
  beneficiary?: string
}

export interface VeterinarianIdentityInput {
  birthCity?: string
  birthDepartment?: string
  birthCountry?: string
  nationality?: string
  inseNumber?: string
  diploma?: string
  diplomaObtainedAt?: string
  rppsNumber?: string
  orderRegisteredAt?: string
  practiceAuthorization?: boolean
  proPhone?: string
}

export interface CreateVeterinarianPayload {
  firstname: string
  lastname: string
  email: string
  password: string
  licenseNumber: string
  bio?: string
  specialityIds?: string[]
  identity?: VeterinarianIdentityInput
  bankingInfo?: BankingInfoInput
}

export interface CreateSecretaryPayload {
  firstname: string
  lastname: string
  email: string
  password: string
  bankingInfo?: BankingInfoInput
}

// Détail complet renvoyé par GET /referent/staff/:id
export interface StaffMemberDetail {
  id: string
  firstname: string
  lastname: string
  email: string
  role: 'VETERINARIAN' | 'SECRETARY' | 'DIRECTOR' | 'REFERENT'
  createdAt: string
  veterinarianProfile?: {
    licenseNumber: string
    bio?: string | null
    speciality: { id: string; name: string; description: string }[]
    veterinarianIdentity?: VeterinarianIdentityInput | null
    bankingInfo?: BankingInfoInput | null
  } | null
  secretaryProfile?: {
    bankingInfo?: BankingInfoInput | null
  } | null
}

export const staffApi = {
  getAll: () => http.get<StaffList>('/referent/staff'),
  getById: (id: string) => http.get<StaffMemberDetail>(`/referent/staff/${id}`),
  createVeterinarian: (data: CreateVeterinarianPayload) =>
    http.post('/referent/staff/veterinarians', data),
  createSecretary: (data: CreateSecretaryPayload) =>
    http.post('/referent/staff/secretaries', data),
}