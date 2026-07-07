import { http } from '@/lib/api'
import {
  staffMemberDetailSchema,
  type StaffMemberDetail,
  type CreateVeterinarianStaff,
  type CreateSecretaryStaff,
  type StaffMember,
  staffMemberSchema,
  type UserRole,
  type ClinicId,
} from '@armali/schemas'

export const staffApi = {
  getAll: async (): Promise<StaffMember[]> => {
    const data = await http.get('/staffs')
    return staffMemberSchema.array().parse(data)
  },

  getById: async (id: string): Promise<StaffMemberDetail> => {
    const data = await http.get(`/staffs/${id}`)
    return staffMemberDetailSchema.parse(data)
  },
  getAllByClinic: async ({ roles, clinicId }: { roles?: UserRole[]; clinicId: ClinicId }) => {
    const params = new URLSearchParams()
    if (roles) roles.forEach((role) => params.append('roles', role))

    return await http
      .get(`/clinics/${clinicId}/staffs?${params}`)
      .then((data) => staffMemberSchema.array().parse(data))
  },

  createVeterinarian: async (data: CreateVeterinarianStaff): Promise<StaffMemberDetail> => {
    const result = await http.post('/staffs/veterinarians', data)
    return staffMemberDetailSchema.parse(result)
  },

  createSecretary: async (data: CreateSecretaryStaff): Promise<StaffMemberDetail> => {
    const result = await http.post('/staffs/secretaries', data)
    return staffMemberDetailSchema.parse(result)
  },
  createReferent: async (data: CreateSecretaryStaff): Promise<StaffMemberDetail> => {
    const result = await http.post('/staffs/referents', data)
    return staffMemberDetailSchema.parse(result)
  },
}
