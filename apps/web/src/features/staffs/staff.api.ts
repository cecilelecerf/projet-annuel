import { http } from '@/lib/api'
import {
  staffMemberDetailSchema,
  type StaffMemberDetail,
  type CreateVeterinarianStaff,
  type CreateSecretaryStaff,
  staffMemberSchema,
  type UserRole,
  type ClinicId,
} from '@armali/schemas'

export const staffApi = {
  getById: async (id: string, clinicId: ClinicId): Promise<StaffMemberDetail> => {
    const data = await http.get(`/clinics/${clinicId}/staffs/${id}`)
    return staffMemberDetailSchema.parse(data)
  },
  getAllByClinic: async ({ roles, clinicId }: { roles?: UserRole[]; clinicId: ClinicId }) => {
    const params = new URLSearchParams()
    if (roles) roles.forEach((role) => params.append('roles', role))

    return await http
      .get(`/clinics/${clinicId}/staffs?${params}`)
      .then((data) => staffMemberSchema.array().parse(data))
  },

  createVeterinarian: async (
    clinicId: ClinicId,
    data: CreateVeterinarianStaff,
  ): Promise<StaffMemberDetail> => {
    const result = await http.post(`/clinics/${clinicId}/staffs/veterinarians`, data)
    return staffMemberDetailSchema.parse(result)
  },

  createSecretary: async (
    clinicId: ClinicId,
    data: CreateSecretaryStaff,
  ): Promise<StaffMemberDetail> => {
    const result = await http.post(`/clinics/${clinicId}/staffs/secretaries`, data)
    return staffMemberDetailSchema.parse(result)
  },
  createReferent: async (
    clinicId: ClinicId,
    data: CreateSecretaryStaff,
  ): Promise<StaffMemberDetail> => {
    const result = await http.post(`/clinics/${clinicId}/staffs/referents`, data)
    return staffMemberDetailSchema.parse(result)
  },
}
