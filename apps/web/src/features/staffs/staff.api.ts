import { http } from '@/lib/api'
import {
  staffListSchema,
  staffMemberDetailSchema,
  type StaffList,
  type StaffMemberDetail,
  type CreateVeterinarianStaff,
  type CreateSecretaryStaff,
} from '@armali/schemas'

export const staffApi = {
  getAll: async (): Promise<StaffList> => {
    const data = await http.get('/staffs')
    return staffListSchema.parse(data)
  },

  getById: async (id: string): Promise<StaffMemberDetail> => {
    const data = await http.get(`/staffs/${id}`)
    return staffMemberDetailSchema.parse(data)
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
